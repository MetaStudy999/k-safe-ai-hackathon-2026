/** 평가 데이터 형식만 검사한다. 탐지 규칙이나 평가용 정답 문장은 포함하지 않는다. */
export type Label = "scam" | "benign" | "borderline";
export type BlindCase = { id: string; expected: Label; category: string; message: string };

export const MAX_DATA_BYTES = 256 * 1024;
const FIELDS = ["id", "expected", "category", "message"];

export class BlindDataError extends Error {}

function fail(message: string): never {
  throw new BlindDataError(message);
}

function hasSensitiveFormat(value: string): boolean {
  // 형식 검사만 가능하다. 이름·주소·비밀번호·실제 피해자 원문 등은 사람이 검토한다.
  const normalized = value.normalize("NFKC");
  if (/(?:\d{2,3}[- .]?\d{3,4}[- .]?\d{4}|\d{6}[- .]?\d{7}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\d{10,}|https?:\/\/|www\.)/i.test(normalized)) {
    return true;
  }
  // 계좌·카드처럼 구분자로 나눈 긴 숫자도 거부한다. 날짜(예: 2026-10-30)는 제외.
  return [...normalized.matchAll(/\d+(?:[- .]\d+){1,4}/g)]
    .some(([match]) => match.replace(/\D/g, "").length >= 10);
}

export function parseBlindData(raw: Buffer): {
  cases: BlindCase[];
  counts: Record<Label, number>;
} {
  if (raw.byteLength > MAX_DATA_BYTES) fail("평가 파일은 256KiB 이하여야 합니다.");
  let parsed: unknown;
  try {
    // 잘못된 UTF-8을 대체 문자로 조용히 변환하지 않는다.
    parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) as unknown;
  } catch {
    fail("UTF-8로 저장한 유효한 JSON 파일이어야 합니다. 따옴표·쉼표·괄호를 확인하세요.");
  }
  if (!Array.isArray(parsed)) fail("최상위 JSON은 사례 배열([])이어야 합니다.");
  if (parsed.length < 24 || parsed.length > 200) fail("평가 사례는 24~200건이어야 합니다. 빈 양식은 평가 자료가 아닙니다.");

  const ids = new Set<string>();
  const counts: Record<Label, number> = { scam: 0, benign: 0, borderline: 0 };
  const cases: BlindCase[] = [];
  for (const [index, item] of parsed.entries()) {
    const row = `사례 ${index + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) fail(`${row}: JSON 객체여야 합니다.`);
    const o = item as Record<string, unknown>;
    if (FIELDS.some(field => !Object.hasOwn(o, field))) fail(`${row}: 필수 필드 id, expected, category, message를 모두 작성하세요.`);
    if (Object.keys(o).some(field => !FIELDS.includes(field))) fail(`${row}: 허용 필드는 id, expected, category, message뿐입니다. 검토 메모·결과는 별도로 보관하세요.`);
    if (typeof o.id !== "string" || !/^[A-Z0-9_-]{2,32}$/.test(o.id)) fail(`${row}: id는 대문자·숫자·밑줄·하이픈만 사용해 2~32자로 작성하세요.`);
    if (ids.has(o.id)) fail(`${row}: 중복 ID가 있습니다. 각 id는 서로 달라야 합니다.`);
    ids.add(o.id);
    if (o.expected !== "scam" && o.expected !== "benign" && o.expected !== "borderline") fail(`${row}: expected는 scam, benign, borderline 중 하나여야 합니다.`);
    if (typeof o.category !== "string" || o.category.trim().length < 2 || o.category.length > 80) fail(`${row}: category는 공백을 제외해 최소 2자, 전체 80자 이하여야 합니다.`);
    if (typeof o.message !== "string" || !o.message.trim() || o.message.length > 2000) fail(`${row}: message는 공백만으로 작성할 수 없으며 전체 1~2,000자여야 합니다.`);
    for (const field of ["id", "category", "message"] as const) {
      if (hasSensitiveFormat(o[field] as string)) fail(`${row}: ${field}에 연락처·신분번호·이메일·계좌/카드형 숫자 또는 URL 형식이 있습니다. [가상연락처], [가상계좌], [가상링크] 같은 문자 표시로 바꾸고 검토하세요.`);
    }
    const label = o.expected as Label;
    counts[label] += 1;
    cases.push({ id: o.id, expected: label, category: o.category, message: o.message });
  }
  if (counts.scam < 10 || counts.benign < 10 || counts.borderline < 4) {
    fail(`분류 구성 부족: scam=${counts.scam}, benign=${counts.benign}, borderline=${counts.borderline}. 최소 위험 10건·정상 10건·경계 4건이 필요합니다.`);
  }
  return { cases, counts };
}
