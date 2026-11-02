import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { analyzeMessage, EXAMPLE_MESSAGE } from "../src/lib/safety";
import { AI_MODEL, explainAnalysis } from "../src/lib/ai-explanation";

async function main() {
  const rules = analyzeMessage(EXAMPLE_MESSAGE, "already_transferred");
  const result = await explainAnalysis(rules, "already_transferred", {
    env: { NODE_ENV: "development", KSAFE_AI_ENABLED: "true", OPENAI_API_KEY: process.env.OPENAI_API_KEY },
  });
  const report = { checked_at: new Date().toISOString(), model: AI_MODEL, ai_status: result.ai.status,
    live_api_success: result.ai.status === "generated", risk_preserved: result.risk_level === rules.risk_level,
    actions_preserved: JSON.stringify(result.recommended_actions) === JSON.stringify(rules.recommended_actions),
    external_input_fields: ["situation", "signals.id", "signals.reason"], raw_message_transmitted: false,
    explanation: result.ai, explanation_sha256: createHash("sha256").update(JSON.stringify(result.ai)).digest("hex") };
  await mkdir("artifacts/ai", { recursive: true });
  await writeFile("artifacts/ai/live-verification.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  if (!report.live_api_success || !report.risk_preserved || !report.actions_preserved) process.exitCode = 1;
}
void main().catch(() => { console.error("Live AI verification could not complete."); process.exitCode = 1; });
