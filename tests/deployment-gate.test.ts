import test from "node:test";
import assert from "node:assert/strict";
import { canUseAnalyzeApi } from "../src/lib/deployment-gate";

test("개발 모드에서는 기존 로컬 API 시험 허용", () => {
  assert.equal(canUseAnalyzeApi({ NODE_ENV: "development" }), true);
});

test("공개 환경은 WAF 검증 선언이 없으면 API 차단", () => {
  assert.equal(canUseAnalyzeApi({ NODE_ENV: "production" }), false);
  assert.equal(canUseAnalyzeApi({ NODE_ENV: "production", RATE_LIMIT_RULE_VERIFIED: "false" }), false);
});

test("공개 환경은 검증 선언을 명시한 경우에만 API 허용", () => {
  assert.equal(canUseAnalyzeApi({ NODE_ENV: "production", RATE_LIMIT_RULE_VERIFIED: "true" }), true);
  assert.equal(canUseAnalyzeApi({ NODE_ENV: "production", RATE_LIMIT_RULE_VERIFIED: "TRUE" }), false);
});
