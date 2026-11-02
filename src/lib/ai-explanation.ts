import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSignalReasons, isSituation, type AnalysisResult, type Situation } from "./safety";

export const AI_MODEL = "gpt-6-luna";
export type AiStatus = "generated" | "disabled" | "no_signals" | "unavailable" | "limited" | "invalid";
export type AiExplanation = { status: AiStatus; model?: string; summary?: string; explanations?: { signal_id: string; text: string }[] };
export type ExplainedAnalysis = Omit<AnalysisResult, "source" | "analysis_status"> & {
  source: "rules_fallback" | "rules_with_ai_explanation";
  analysis_status: "fallback" | "completed";
  ai: AiExplanation;
};
export type AiInput = { situation: Situation; signals: { id: string; reason: string }[] };
type Env = { NODE_ENV?: string; OPENAI_API_KEY?: string; KSAFE_AI_ENABLED?: string };
export type GenerateExplanation = (input: AiInput, signal: AbortSignal) => Promise<unknown>;
const schema = z.object({ summary: z.string(), explanations: z.array(z.object({ signal_id: z.string(), text: z.string() })) });
const instruction = `K-SAFE 가상 사례의 규칙 신호를 쉬운 한국어로 풀어 쓰는 보조 설명기입니다.
입력은 서버가 만든 위험 신호와 상황이며 사용자 메시지 원문은 제공되지 않습니다.
제공된 신호만 설명하고 없던 사실, 기관명, 수치, URL, 연락처를 만들지 마세요.
위험 수준 판정, 안전 보증, 사기 확정, 송금/앱 설치 지시, 행동 순서 변경은 하지 마세요.
summary와 각 text는 각각 180자 이내의 설명 한 문장입니다.
명령문 대신 왜 해당 신호를 추가 확인해야 하는지 서술문으로 설명하세요.
입력의 모든 signal id를 각각 정확히 한 번 사용하고 새 id는 추가하지 마세요.`;

// LOCAL demonstration budget only; not a distributed public rate limiter.
export function createAiBudget(limit = 24) {
  let attempts = 0;
  let active = false;
  return {
    acquire() { if (active || attempts >= limit) return false; attempts++; active = true; return true; },
    release() { active = false; },
  };
}
const budget = createAiBudget();
function safeSentence(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 5 && value.length <= 180 &&
    !/(?:https?:|www\.|@|[<>]|[0-9０-９]{3}|sk-|사기(?:입니다|로\s*확정)|안전(?:합니다|해요|한\s*문자)|(?:송금|이체|설치|입력)(?:하세요|하십시오|해\s*주세요)|이전\s*지침)/iu.test(value);
}
export function validateExplanation(value: unknown, input: AiInput) {
  const parsed = schema.strict().safeParse(value);
  if (!parsed.success || !safeSentence(parsed.data.summary)) return null;
  const expected = input.signals.map((s) => s.id).sort();
  const actual = parsed.data.explanations.map((s) => s.signal_id).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected) || !parsed.data.explanations.every((item) => safeSentence(item.text))) return null;
  return parsed.data;
}
export function openAiGenerator(apiKey: string): GenerateExplanation {
  const provider = createOpenAI({ apiKey });
  return async (input, signal) => {
    const result = await generateText({
      model: provider.responses(AI_MODEL), system: instruction, prompt: JSON.stringify(input),
      output: Output.object({ schema }), maxOutputTokens: 1200, reasoning: "none", maxRetries: 0,
      timeout: 8000, abortSignal: signal,
      telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false },
      providerOptions: { openai: { store: false } },
    });
    return result.output;
  };
}
export async function explainAnalysis(
  rules: AnalysisResult, situation: Situation,
  options: { env?: Env; generate?: GenerateExplanation; budget?: ReturnType<typeof createAiBudget>; timeoutMs?: number } = {},
): Promise<ExplainedAnalysis> {
  const env = options.env ?? process.env;
  const fallback = (status: AiStatus): ExplainedAnalysis => ({ ...rules, ai: { status } });
  // Production stays closed even if the legacy API gate is explicitly enabled.
  if (env.NODE_ENV !== "development" || env.KSAFE_AI_ENABLED !== "true" || !env.OPENAI_API_KEY) return fallback("disabled");
  if (!isSituation(situation)) return fallback("invalid");
  const input: AiInput = { situation, signals: getSignalReasons(rules.signals) };
  if (!input.signals.length) return fallback("no_signals");
  const limiter = options.budget ?? budget;
  if (!limiter.acquire()) return fallback("limited");
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { abort.abort(); reject(new Error("AI_TIMEOUT")); }, options.timeoutMs ?? 8000);
    });
    const raw = await Promise.race([(options.generate ?? openAiGenerator(env.OPENAI_API_KEY))(input, abort.signal), timeout]);
    const explanation = validateExplanation(raw, input);
    if (!explanation) return fallback("invalid");
    return { ...rules, source: "rules_with_ai_explanation", analysis_status: "completed", ai: { status: "generated", model: AI_MODEL, ...explanation } };
  } catch {
    // No raw SDK errors, request bodies, credentials or model output in logs.
    return fallback("unavailable");
  } finally { clearTimeout(timer); limiter.release(); }
}
