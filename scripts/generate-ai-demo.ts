import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { analyzeMessage, getSignalReasons } from "../src/lib/safety";
import { PUBLIC_DEMO_SCENARIOS } from "../src/lib/public-demo";
import { AI_MODEL, explainAnalysis } from "../src/lib/ai-explanation";

async function main() {
  const cases = [];
  await mkdir("artifacts/ai", { recursive: true });
  let saved: Record<string, { input_sha256: string; result: Awaited<ReturnType<typeof explainAnalysis>> }> = {};
  try { saved = JSON.parse(await readFile("artifacts/ai/generation-progress.json", "utf8")); } catch { /* first run */ }
  for (const scenario of PUBLIC_DEMO_SCENARIOS) {
    const rules = analyzeMessage(scenario.sample, scenario.id);
    const input = { situation: scenario.id, signals: getSignalReasons(rules.signals) };
    const inputHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const cached = saved[scenario.id];
    const result = cached?.input_sha256 === inputHash && cached.result.ai.status === "generated" ? cached.result : await explainAnalysis(rules, scenario.id, {
      env: { NODE_ENV: "development", KSAFE_AI_ENABLED: "true", OPENAI_API_KEY: process.env.OPENAI_API_KEY },
    });
    saved[scenario.id] = { input_sha256: inputHash, result };
    await writeFile("artifacts/ai/generation-progress.json", JSON.stringify(saved, null, 2) + "\n");
    console.log(JSON.stringify({ situation: scenario.id, ai_status: result.ai.status }));
    if (result.ai.status !== "generated") throw new Error("DEMO_GENERATION_INCOMPLETE");
    cases.push({ situation: scenario.id, input_sha256: createHash("sha256").update(JSON.stringify(input)).digest("hex"),
      ...result.ai });
  }
  const report = { generated_at: new Date().toISOString(), model: AI_MODEL, mode: "pre_generated_explanation",
    source: "live_openai_responses", raw_message_transmitted: false, cases };
  await mkdir("src/data", { recursive: true });
  await writeFile("src/data/ai-demo-explanations.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ generated: cases.length, model: AI_MODEL, raw_message_transmitted: false }));
}
void main().catch(() => { console.error("Demo explanations could not be generated; existing artifact unchanged."); process.exitCode = 1; });
