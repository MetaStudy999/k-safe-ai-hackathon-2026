import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage } from "../src/lib/safety";
import { HOLDOUT_CASES } from "../data/synthetic/holdout-20261030";

// 05-4 최초 평가 후 명시적으로 개발·회귀시험에 편입한 사례들.
// 이 테스트를 통과해도 독립적인 검증 정확도라고 주장할 수 없다.
const missed: Record<string, string> = {
  HS02: "delivery_address_redirect",
  HS03: "secret_investigation_chat",
  HS04: "benefit_personal_data",
  HS05: "changed_payment_account",
  HS07: "remote_support_install",
  HS08: "marketplace_external_payment",
  HS10: "bank_secret_request",
  HS11: "redelivery_fee"
};

for (const [id, signal] of Object.entries(missed)) {
  test(`05-5 위험 문맥 ${id} — 추가 검토 신호 식별`, () => {
    const example = HOLDOUT_CASES.find((item) => item.id === id);
    assert.ok(example, id);
    const result = analyzeMessage(example.message, "before_transfer");
    assert.notEqual(result.risk_level, "no_clear_signal");
    assert.ok(result.signals.includes(signal as (typeof result.signals)[number]));
    assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
  });
}

for (const id of ["HB02", "HB04", "HB06", "HB07"]) {
  test(`05-5 교육·설명 문맥 ${id} — 과잉 경고 방지`, () => {
    const example = HOLDOUT_CASES.find((item) => item.id === id);
    assert.ok(example, id);
    const result = analyzeMessage(example.message, "before_transfer");
    assert.equal(result.risk_level, "no_clear_signal");
  });
}

test("교육이라고 소개해도 별도 카드정보 입력 지시는 주의 대상으로 유지", () => {
  const result = analyzeMessage(
    "안전결제 교육 안내입니다. 판매자가 준 인증 페이지에 카드 정보를 입력해 주세요.",
    "before_transfer"
  );
  assert.ok(result.signals.includes("marketplace_external_payment"));
});

test("강의라고 소개해도 실제 은행 비밀번호 전달 지시는 주의 대상으로 유지", () => {
  const result = analyzeMessage(
    "보안 강의 자료입니다. 은행입니다. 안내한 전화로 계좌 비밀번호를 말하세요.",
    "before_transfer"
  );
  assert.ok(result.signals.includes("bank_secret_request"));
});

test("사기 확정은 하지 않고 검토·공식 경로 확인을 안내", () => {
  const result = analyzeMessage(
    "거래처 회계팀입니다. 변경된 계좌로 대금을 송금해 주십시오.",
    "before_transfer"
  );
  assert.equal(result.risk_level, "review");
  assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
  assert.match(result.recommended_actions.join(" "), /공식 홈페이지/);
});

test("이미 송금했다면 교육 문구가 섞여도 112 긴급 안내가 우선", () => {
  const result = analyzeMessage(
    "보안 교육 내용입니다. 의심되는 송금 요청이 있었습니다.",
    "already_transferred"
  );
  assert.match(result.recommended_actions[0], /112/);
});
