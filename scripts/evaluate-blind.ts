/**
 * 05-6 외부 작성 합성 자료 평가용 실행기.
 * 별도 작성자의 사전 라벨 검토·원본 SHA 기록·버전 동결 후에만 평가한다.
 * 원문 메시지를 출력하지 않으며 --validate-only에서는 탐지 함수를 호출하지 않는다.
 */
import { readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { BlindDataError, MAX_DATA_BYTES, parseBlindData } from "./lib/blind-data";

const GUIDE = "docs/05-verification/BLIND-EVALUATOR-GUIDE-05-6.md";

// 복사 가능한 Bash 인수로 표시한다. 경로에 공백·따옴표가 있어도 안전하다.
function shellQuote(value: string): string {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}

function showNextSteps(filepath: string): void {
  const command = `node --import tsx scripts/evaluate-blind.ts ${shellQuote(filepath)}`;
  console.error(`필요한 파일 경로: ${filepath}`);
  console.error(`준비 방법: 별도 평가자가 ${GUIDE}와 빈 양식을 받아 새 합성 사례를 작성하세요.`);
  console.error("기존 규칙·합성 자료를 복사하지 말고, 24~200건(위험>=10, 정상>=10, 경계>=4)을 작성·검토하세요.");
  console.error(`다음 실행 명령(형식 검증만): ${command} --validate-only`);
  console.error(`사람의 독립성·라벨 검토 및 원본/코드 동결 후 평가: ${command}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("사용법: node --import tsx scripts/evaluate-blind.ts [경로.json] [--validate-only]");
    console.log(`기본 경로: ${resolve(homedir(), "k-safe-eval-external.json")}`);
    console.log(`평가자 안내서: ${GUIDE}`);
    return;
  }
  const paths = args.filter(arg => arg !== "--validate-only");
  if (paths.length > 1 || paths.some(arg => arg.startsWith("-"))) {
    console.error("ARGUMENTS=FAIL\n사용법: node --import tsx scripts/evaluate-blind.ts [경로.json] [--validate-only]\nEVALUATION=NOT_RUN");
    process.exitCode = 1;
    return;
  }
  const filepath = resolve(paths[0] ?? resolve(homedir(), "k-safe-eval-external.json"));
  if (!filepath.endsWith(".json")) {
    console.error("DATA_FILE=INVALID\nVALIDATION=FAIL\n원인: .json 확장자의 파일 경로가 필요합니다.\nEVALUATION=NOT_RUN");
    showNextSteps(filepath);
    process.exitCode = 1;
    return;
  }

  let raw: Buffer;
  try {
    const stat = statSync(filepath);
    if (!stat.isFile()) throw new BlindDataError("경로가 일반 파일이 아닙니다. JSON 파일을 지정하세요.");
    if (stat.size > MAX_DATA_BYTES) throw new BlindDataError("평가 파일은 256KiB 이하여야 합니다.");
    raw = readFileSync(filepath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      console.error("DATA_FILE=NOT_FOUND\nVALIDATION=NOT_RUN\nEVALUATION=NOT_RUN\nSTATUS=EVALUATOR_READY / DATA_PENDING");
      console.error("원인: 지정한 경로에 독립 평가 JSON 파일이 없습니다.");
    } else {
      console.error(`DATA_FILE=${error instanceof BlindDataError ? "INVALID" : "READ_ERROR"}\nVALIDATION=FAIL\nEVALUATION=NOT_RUN`);
      console.error(`원인: ${error instanceof BlindDataError ? error.message : "파일을 읽을 수 없습니다. 파일 접근 권한과 경로를 확인하세요."}`);
    }
    showNextSteps(filepath);
    process.exitCode = 1;
    return;
  }

  let data: ReturnType<typeof parseBlindData>;
  try {
    data = parseBlindData(raw);
  } catch (error) {
    if (!(error instanceof BlindDataError)) throw error;
    console.error(`DATA_FILE=INVALID\nVALIDATION=FAIL\n원인: ${error.message}\nEVALUATION=NOT_RUN`);
    showNextSteps(filepath);
    process.exitCode = 1;
    return;
  }
  const sha256 = createHash("sha256").update(raw).digest("hex");
  const { cases, counts: seen } = data;
  if (args.includes("--validate-only")) {
    console.log(JSON.stringify({
      data_file: "FOUND", validation: "PASS", evaluation: "NOT_RUN",
      data_sha256: sha256, sample_size: cases.length,
      labeled_scam: seen.scam, labeled_benign: seen.benign, borderline_excluded: seen.borderline,
      human_review: "REQUIRED: 독립 작성·라벨·민감정보 확인 및 원본/코드 동결. 형식 검증 PASS는 품질 평가 PASS가 아닙니다."
    }, null, 2));
    return;
  }

  // 전체 파일 검증에 성공한 후에만 기존 탐지 코드를 읽고 실행한다.
  const { analyzeMessage } = await import("../src/lib/safety");
  const rows = cases.map(item => {
    const result = analyzeMessage(item.message, "before_transfer");
    const flagged = result.risk_level !== "no_clear_signal";
    return {
      id: item.id, category: item.category, expected: item.expected,
      predicted: flagged ? "flagged" : "no_clear_signal",
      risk_level: result.risk_level,
      correct: item.expected === "borderline" ? null : item.expected === "scam" ? flagged : !flagged
    };
  });
  const tp = rows.filter(r => r.expected === "scam" && r.predicted === "flagged").length;
  const fp = rows.filter(r => r.expected === "benign" && r.predicted === "flagged").length;
  console.log(JSON.stringify({
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
    ambiguous_cases: rows.filter(r => r.correct === null)
  }, null, 2));
}

main().catch(() => {
  console.error("EVALUATOR=ERROR\n원인: 예상하지 못한 내부 오류입니다. TypeScript 검사와 자동 테스트를 확인하세요.\nEVALUATION=FAILED");
  process.exitCode = 1;
});
