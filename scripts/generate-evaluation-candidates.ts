/** AI-authored candidates only. Human label/provenance review is required before evaluation. */
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createHash } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { parseBlindData } from "./lib/blind-data";

async function main() {
  const destination = "artifacts/evaluation/ai-authored-candidates.json";
  try { await readFile(destination); throw new Error("EXISTING_CANDIDATES_REUSE_REQUIRED"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const frozenCode = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const classifierHash = createHash("sha256").update(await readFile("src/lib/safety.ts")).digest("hex");
  const provider = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await generateText({ model: provider.responses("gpt-6-luna"), reasoning: "none", maxRetries: 0,
    maxOutputTokens: 9000, timeout: 45000,
    telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false },
    providerOptions: { openai: { store: false } },
    output: Output.object({ schema: z.object({ cases: z.array(z.object({
      id: z.string(), expected: z.enum(["scam", "benign", "borderline"]), category: z.string(), message: z.string(),
    })) }) }),
    prompt: `금융사기 안내 시연의 평가 후보로 사용할 새로운 한국어 합성 메시지 24건을 작성하세요.
규칙 코드, 기존 개발 문장, 기존 평가 결과는 제공하지 않습니다. 사람 검토 전 후보이며 정식 독립 평가 결과가 아닙니다.
scam 10건, benign 10건, borderline 4건, id EV01~EV24를 정확히 한 번씩 사용합니다.
category 2~80자, message 10~160자로 작성하세요. 위험 후보는 금전·비밀정보·기기 접근을 유도하는 다양한 문맥,
정상 후보는 교육 문구에 편중되지 않는 일상 연락·거래·공지, 경계 후보는 정보가 부족한 문맥입니다.
실제/가상 전화번호·계좌·주민번호·이메일·URL이나 개인 이름은 넣지 마세요. 필요한 경우 [가상연락처], [가상링크], [가상계좌] 등 문자 표지만 씁니다.
상투적인 문장을 반복하거나 서로 표현만 바꾼 중복을 만들지 마세요. 모든 문장은 새로 가상으로 작성합니다.`,
  });
  const raw = Buffer.from(JSON.stringify(result.output.cases, null, 2) + "\n");
  const checked = parseBlindData(raw);
  if (checked.cases.length !== 24 || checked.counts.scam !== 10 || checked.counts.benign !== 10 || checked.counts.borderline !== 4)
    throw new Error("CANDIDATE_COUNTS_INVALID");
  if (new Set(checked.cases.map((c) => c.message)).size !== 24) throw new Error("CANDIDATE_DUPLICATES");
  await mkdir("artifacts/evaluation", { recursive: true });
  await writeFile(destination, raw, { flag: "wx" });
  const provenance = { created_at: new Date().toISOString(), author: "OpenAI gpt-6-luna, separate generation request",
    source_code_commit_frozen_before_generation: frozenCode, classifier_sha256: classifierHash,
    data_sha256: createHash("sha256").update(raw).digest("hex"), sample_size: 24, counts: checked.counts,
    human_label_review: "REQUIRED", independence_review: "REQUIRED", evaluation: "NOT_RUN",
    formal_independent_quality_pass: false, meets_05_6_separate_human_author_requirement: false,
    allowed_use: "AI-authored exploratory candidates; not a replacement for independently human-authored evaluation data" };
  await writeFile("artifacts/evaluation/provenance.json", JSON.stringify(provenance, null, 2) + "\n");
  console.log(JSON.stringify(provenance, null, 2));
}
void main().catch((error: unknown) => {
  console.error(JSON.stringify({ generated: false, error_type: error instanceof Error ? error.name : "unknown", human_review_required: true }));
  process.exitCode = 1;
});
