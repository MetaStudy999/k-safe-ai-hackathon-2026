import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import generated from "../src/data/ai-demo-explanations.json";
import { analyzeMessage, getSignalReasons } from "../src/lib/safety";
import { PUBLIC_DEMO_SCENARIOS } from "../src/lib/public-demo";
import { validateExplanation } from "../src/lib/ai-explanation";

test("공개 AI 설명은 네 합성 사례의 현재 규칙 입력과 일치한다", () => {
  assert.equal(generated.mode, "pre_generated_explanation");
  assert.equal(generated.cases.length, 4);
  assert.equal(generated.raw_message_transmitted, false);
  for (const scenario of PUBLIC_DEMO_SCENARIOS) {
    const note = generated.cases.find((item) => item.situation === scenario.id)!;
    const result = analyzeMessage(scenario.sample, scenario.id);
    assert.ok(result.signals.length > 0);
    const input = { situation: scenario.id, signals: getSignalReasons(result.signals) };
    assert.equal(note.input_sha256, createHash("sha256").update(JSON.stringify(input)).digest("hex"));
    assert.ok(validateExplanation({ summary: note.summary, explanations: note.explanations }, input));
  }
});
