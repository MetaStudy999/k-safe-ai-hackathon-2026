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

test("가족 사칭 상품권 PIN 요구를 고위험 신호로 탐지한다", () => {
  const message = "엄마, 나 폰 액정이 깨져서 수리했어. 급하게 문화상품권을 대신 구매해서 핀번호를 카톡으로 보내줘.";
  const result = analyzeMessage(message, "before_transfer");
  assert.equal(result.risk_level, "warning");
  assert.ok(result.signals.includes("family_contact_scam"));
  assert.ok(result.signals.includes("gift_card_pin_request"));
  assert.match(result.recommended_actions[1], /가족이 이전부터 사용하던 번호/);
});

test("가족 사칭 긴급 송금 요청을 탐지한다", () => {
  const message = "엄마 핸드폰이 고장나서 이 번호로 문자해요. 지금 급하게 이체해야 하는데 돈 좀 보내줘.";
  const result = analyzeMessage(message, "before_transfer");
  assert.equal(result.risk_level, "warning");
  assert.ok(result.signals.includes("family_contact_scam"));
  assert.ok(result.signals.includes("urgent_transfer_request"));
});

test("정상 가족 연락을 가족 사칭 송금으로 과도하게 분류하지 않는다", () => {
  const message = "엄마, 폰 액정이 깨져서 내일 수리 맡기려고 해. 저녁에 만나자.";
  const result = analyzeMessage(message, "before_transfer");
  assert.equal(result.signals.includes("family_contact_scam"), false);
  assert.equal(result.signals.includes("gift_card_pin_request"), false);
  assert.equal(result.risk_level, "no_clear_signal");
});

test("가족 사칭 문구라도 이미 송금 상태이면 긴급 신고가 최우선이다", () => {
  const result = analyzeMessage("엄마, 폰이 깨져서 이 번호로 연락해. 급히 돈 좀 보내줘.", "already_transferred");
  assert.match(result.recommended_actions[0], /112/);
  assert.match(result.recommended_actions[0], /금융회사/);
  assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
});
