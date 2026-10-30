import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage, getActions, isSituation, redactMessage } from "../src/lib/safety";

test("4가지 상황 선택만 허용한다", () => {
  assert.equal(isSituation("already_transferred"), true);
  assert.equal(isSituation("unknown"), false);
});
test("합성 이메일과 전화번호를 가린다", () => {
  const value = redactMessage("test@example.com, 010-1234-5678");
  assert.doesNotMatch(value, /test@example.com|010-1234-5678/);
});
test("선입금 및 앱 설치 위험 신호를 발견한다", () => {
  const result = analyzeMessage("먼저 상환금을 보내고 전용 앱을 설치하세요.", "before_transfer");
  assert.equal(result.risk_level, "warning");
  assert.ok(result.signals.includes("upfront_payment"));
  assert.ok(result.signals.includes("unverified_app_install"));
  assert.equal(result.analysis_status, "fallback");
});
test("송금 후에는 AI 설명과 무관하게 긴급 연락을 안내한다", () => {
  assert.match(getActions("already_transferred")[0], /112/);
  assert.match(getActions("already_transferred")[0], /금융회사/);
});
test("아무 단서가 없더라도 안전을 보증하지 않는다", () => {
  const result = analyzeMessage("다음 주에 다시 만납시다.", "unsure");
  assert.equal(result.risk_level, "no_clear_signal");
  assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
});
