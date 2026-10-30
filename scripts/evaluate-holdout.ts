/**
 * 05-4 새 합성문장 기준선 평가.
 * 출력은 관찰된 결과이며 PASS/FAIL을 강제로 만들지 않는다.
 * 기존 규칙·정답표를 출력 결과에 맞춰 자동 변경하지 않는다.
 * 이 문장들은 구현 코드를 참조해 수동 작성됐기 때문에 엄밀한 블라인드 표본이 아니다.
 */
import { analyzeMessage } from "../src/lib/safety";
import { HOLDOUT_CASES } from "../data/synthetic/holdout-20261030";

const ids = HOLDOUT_CASES.map((item) => item.id);
if (ids.length !== 24 || new Set(ids).size !== 24) {
  throw new Error("새 합성 평가 데이터는 중복 없는 24개여야 합니다.");
}
const counts = {
  scam: HOLDOUT_CASES.filter((item) => item.expected === "scam").length,
  benign: HOLDOUT_CASES.filter((item) => item.expected === "benign").length,
  borderline: HOLDOUT_CASES.filter((item) => item.expected === "borderline").length
};
if (counts.scam !== 12 || counts.benign !== 8 || counts.borderline !== 4) {
  throw new Error("기대 분류 구성(12/8/4)이 맞지 않습니다.");
}
const observations = HOLDOUT_CASES.map((item) => {
  const result = analyzeMessage(item.message, "before_transfer");
  const flagged = result.risk_level !== "no_clear_signal";
  const correct = item.expected === "borderline" ? null : item.expected === "scam" ? flagged : !flagged;
  return {
    id: item.id,
    category: item.category,
    expected: item.expected,
    predicted: flagged ? "flagged" : "no_clear_signal",
    risk_level: result.risk_level,
    signals: result.signals,
    correct
  };
});
const tp = observations.filter((item) => item.expected === "scam" && item.predicted === "flagged").length;
const fn = counts.scam - tp;
const fp = observations.filter((item) => item.expected === "benign" && item.predicted === "flagged").length;
const tn = counts.benign - fp;
const results = {
  dataset: "05-4 NEW SYNTHETIC / manually authored after code review, not statistically independent",
  sample_size: HOLDOUT_CASES.length,
  labeled_scam: counts.scam,
  labeled_benign: counts.benign,
  borderline_excluded: counts.borderline,
  true_positive: tp,
  false_negative: fn,
  false_positive: fp,
  true_negative: tn,
  sensitivity_recall: Number((tp / counts.scam).toFixed(4)),
  false_positive_rate: Number((fp / counts.benign).toFixed(4)),
  failed_cases: observations.filter((item) => item.correct === false),
  ambiguous_cases: observations.filter((item) => item.correct === null),
  all_cases: observations
};
console.log(JSON.stringify(results, null, 2));
