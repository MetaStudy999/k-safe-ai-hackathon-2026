import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PUBLIC_DEMO_SCENARIOS, getPublicDemoActions } from "../src/lib/public-demo";
import { SITUATIONS } from "../src/lib/safety";

test("공개 데모: 기존 4개 상황을 모두 가상의 문구로 제공한다", () => {
  assert.deepEqual(
    PUBLIC_DEMO_SCENARIOS.map((item) => item.id).sort(),
    SITUATIONS.map((item) => item.id).sort()
  );
  for (const item of PUBLIC_DEMO_SCENARIOS) {
    assert.ok(item.sample.length > 10);
    assert.ok(item.signals.length > 0);
    assert.doesNotMatch(item.sample, /https?:\/\/|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  }
});

test("공개 데모: 이미 송금한 경우 기존 긴급 안전행동을 유지한다", () => {
  const actions = getPublicDemoActions("already_transferred").join(" ");
  assert.match(actions, /112/);
  assert.match(actions, /금융회사/);
});

test("공개 데모: 실제 입력·분석 요청을 제공하지 않고 배포 모드에서만 노출한다", () => {
  const client = readFileSync("src/app/public-demo.tsx", "utf8");
  const route = readFileSync("src/app/page.tsx", "utf8");
  assert.doesNotMatch(client, /<textarea\b|\bfetch\s*\(|\/api\/analyze/);
  assert.match(route, /process\.env\.NODE_ENV === "production"/);
  assert.match(route, /<PublicDemo\s*\/>/);
});
