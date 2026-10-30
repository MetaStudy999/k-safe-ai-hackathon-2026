/**
 * 05-6 외부 작성 합성 자료 평가용 실행기.
 *
 * 반드시 코드를 보지 않은 별도 작성자가 작성하고, 개발자에게 공개되기 전에
 * 라벨 검토·원본 SHA 기록·버전 동결을 마친 JSON 파일을 전달받으세요.
 * 이 프로그램은 원본 메시지 내용은 출력하지 않습니다.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { analyzeMessage } from "../src/lib/safety";

type Label = "scam" | "benign" | "borderline";
type Case = { id: string; expected: Label; category: string; message: string };

function fail(msg: string): never {
  throw new Error("검증 데이터 오류: " + msg);
}

const filepath = process.argv[2];
if (!filepath || !filepath.endsWith(".json")) {
  fail("입력 JSON 경로가 필요합니다. 사용법: node --import tsx scripts/evaluate-blind.ts 경로.json");
}
const raw = readFileSync(filepath);
if (raw.byteLength > 256 * 1024) fail("평가 파일은 256KiB 이하여야 합니다.");
const sha256 = createHash("sha256").update(raw).digest("hex");
let parsed: unknown;
try {
  parsed = JSON.parse(raw.toString("utf-8")) as unknown;
} catch {
  fail("유효한 JSON 파일이 아닙니다.");
}

if (!Array.isArray(parsed)) fail("최상위 JSON은 합성 사례 배열이어야 합니다.");
if (parsed.length < 24 || parsed.length > 200) fail("평가 사례는 24~200건이어야 합니다.");
const ids = new Set<string>();
const seen = { scam: 0, benign: 0, borderline: 0 };
const rows: { id: string; category: string; expected: Label; predicted: string; risk_level: string; correct: boolean | null }[] = [];

for (const item of parsed as unknown[]) {
  if (!item || typeof item !== "object" || Array.isArray(item)) fail("사례는 JSON 객체여야 합니다.");
  const o = item as Record<string, unknown>;
  if (typeof o.id !== "string" || !/^[A-Z0-9_-]{2,32}$/.test(o.id)) fail("사례 ID는 대문자·숫자·언더스코어 등 2~32자");
  if (ids.has(o.id)) fail("중복 ID가 있습니다: " + o.id);
  ids.add(o.id);
  if (o.expected !== "scam" && o.expected !== "benign" && o.expected !== "borderline") fail("허용 라벨: scam, benign, borderline");
  if (typeof o.category !== "string" || o.category.trim().length < 2 || o.category.length > 80) fail("카테고리 길이 오류");
  if (typeof o.message !== "string" || !o.message.trim() || o.message.length > 2000) fail("메시지는 1~2,000자여야 합니다.");
  // 평가 대상은 실제 피해 사례가 아닌 새로 작성한 합성 문장만 허용.
  // 이 정규식만으로 개인정보 유무를 완벽히 확인할 수는 없다.
  if (/(?:\d{3}[- .]?\d{3,4}[- .]?\d{4}|\d{6}[- ]\d{7}|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/.test(o.message)) {
    fail("연락처·신분번호·이메일 형태의 값이 있습니다. 합성 문자열로 대체한 뒤 다시 검토하세요.");
  }
  const label = o.expected as Label;
  seen[label] += 1;
  const result = analyzeMessage(o.message, "before_transfer");
  const flagged = result.risk_level !== "no_clear_signal";
  rows.push({
    id: o.id, category: o.category, expected: label,
    predicted: flagged ? "flagged" : "no_clear_signal",
    risk_level: result.risk_level,
    correct: label === "borderline" ? null : label === "scam" ? flagged : !flagged
  });
}

if (seen.scam < 10 || seen.benign < 10 || seen.borderline < 4) {
  fail("구성 조건을 충족해야 합니다: 위험 >=10, 정상 >=10, 경계 >=4");
}
const tp = rows.filter(r => r.expected === "scam" && r.predicted === "flagged").length;
const fp = rows.filter(r => r.expected === "benign" && r.predicted === "flagged").length;
const report = {
  dataset: "05-6 independently authored synthetic input (independence requires human provenance review)",
  data_sha256: sha256,
  sample_size: rows.length,
  labeled_scam: seen.scam,
  labeled_benign: seen.benign,
  borderline_excluded: seen.borderline,
  true_positive: tp,
  false_negative: seen.scam - tp,
  false_positive: fp,
  true_negative: seen.benign - fp,
  sensitivity_recall: Number((tp / seen.scam).toFixed(4)),
  false_positive_rate: Number((fp / seen.benign).toFixed(4)),
  failed_cases: rows.filter(r => r.correct === false),
  ambiguous_cases: rows.filter(r => r.correct === null),
  // No raw messages in report. File provenance must still be reviewed independently.
};
console.log(JSON.stringify(report, null, 2));
