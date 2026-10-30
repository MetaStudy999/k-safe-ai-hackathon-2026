/**
 * 05단계 독립 합성 사례 평가 도구.
 * 이 코드는 위험탐지 성능을 측정할 뿐, 합격 기준을 만족시켰다고 자동 주장하지 않습니다.
 * 실제 개인정보·실제 금융사고 메시지 사용 금지.
 */
import { analyzeMessage } from "../src/lib/safety";
import { SYNTHETIC_CASES } from "../data/synthetic/verification-cases";

type Row = {
  id: string;
  expected: "scam" | "benign" | "borderline";
  category: string;
  predicted: "flagged" | "no_clear_signal";
  risk_level: string;
  signals: string[];
  correct: boolean | null;
};
const ids = new Set(SYNTHETIC_CASES.map((c) => c.id));
if (SYNTHETIC_CASES.length !== 30 || ids.size !== 30) {
  throw new Error("합성 사례는 고유 ID 30개여야 합니다.");
}
const rows: Row[] = SYNTHETIC_CASES.map((c) => {
  const result = analyzeMessage(c.message, "before_transfer");
  const flagged = result.risk_level !== "no_clear_signal";
  return {
    id: c.id,
    expected: c.expected,
    category: c.category,
    predicted: flagged ? "flagged" : "no_clear_signal",
    risk_level: result.risk_level,
    signals: result.signals,
    correct: c.expected === "borderline" ? null : c.expected === "scam" ? flagged : !flagged
  };
});
const scam = rows.filter((r) => r.expected === "scam");
const benign = rows.filter((r) => r.expected === "benign");
const ambiguous = rows.filter((r) => r.expected === "borderline");
const tp = scam.filter((r) => r.predicted === "flagged").length;
const fn = scam.length - tp;
const fp = benign.filter((r) => r.predicted === "flagged").length;
const tn = benign.length - fp;
const report = {
  study: "K-SAFE 합성 예제 규칙 탐지 평가 — 개발용, 실사용 정확도 아님",
  sample_size: rows.length,
  labeled_scam: scam.length,
  labeled_benign: benign.length,
  borderline_excluded_from_accuracy: ambiguous.length,
  true_positive: tp,
  false_negative: fn,
  false_positive: fp,
  true_negative: tn,
  sensitivity_recall: Number((tp / scam.length).toFixed(4)),
  false_positive_rate: Number((fp / benign.length).toFixed(4)),
  evaluated_by: "rule-based engine only; external LLM not connected",
  failed_cases: rows.filter((r) => r.correct === false),
  ambiguous_cases: ambiguous,
  all_cases: rows
};
console.log(JSON.stringify(report, null, 2));
