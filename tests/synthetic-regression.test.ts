import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMessage } from "../src/lib/safety";
import { SYNTHETIC_CASES } from "../data/synthetic/verification-cases";

const missed: Record<string, string> = {
  S11: "delivery_redirection",
  S12: "invitation_link",
  S13: "payment_cancel_verification",
  S15: "customs_payment_link"
};

for (const [id, signal] of Object.entries(missed)) {
  test(`${id} 기존 미탐지 위험 징후를 추가 확인 대상으로 식별`, () => {
    const sample = SYNTHETIC_CASES.find((item) => item.id === id);
    assert.ok(sample, `${id} 합성 사례가 있어야 합니다.`);
    const result = analyzeMessage(sample.message, "before_transfer");
    assert.notEqual(result.risk_level, "no_clear_signal");
    assert.ok(result.signals.includes(signal as (typeof result.signals)[number]));
    assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
  });
}

for (const id of ["B06", "B10"]) {
  test(`${id} 정상 교육 문장을 금융사기 신호로 과도하게 분류하지 않음`, () => {
    const sample = SYNTHETIC_CASES.find((item) => item.id === id);
    assert.ok(sample, `${id} 합성 사례가 있어야 합니다.`);
    const result = analyzeMessage(sample.message, "before_transfer");
    assert.equal(result.risk_level, "no_clear_signal");
  });
}

test("택배 주소 오류와 링크 유도라는 독립 합성 문장에 주의 안내", () => {
  const result = analyzeMessage("택배 주소가 잘못 입력되었습니다. 아래 링크에서 변경해 주세요.", "unsure");
  assert.ok(result.signals.includes("delivery_redirection"));
});

test("정상적인 교육 안내에 앱 설치·계정 정지 단어가 있어도 경고하지 않음", () => {
  const result = analyzeMessage("보안 강의에서 계정 정지와 앱 설치 설명을 다룹니다.", "before_transfer");
  assert.equal(result.risk_level, "no_clear_signal");
});

test("청첩장 링크에 대해서 사기 확정 없이 추가 확인을 권고", () => {
  const result = analyzeMessage("모바일 청첩장 링크를 공유했습니다. 지인에게 확인해 주세요.", "before_transfer");
  assert.equal(result.risk_level, "review");
  assert.match(result.uncertainty_notice, /확정할 수 없습니다/);
});

test("기존 대출 선입금·별도 앱 설치 경고를 계속 탐지", () => {
  const result = analyzeMessage("기존 대출금을 먼저 상환하고 전용 앱을 설치해 주세요.", "before_transfer");
  assert.equal(result.risk_level, "warning");
});
