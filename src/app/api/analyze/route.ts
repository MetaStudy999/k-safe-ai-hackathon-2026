import { NextResponse } from "next/server";
import { analyzeMessage, isSituation, redactMessage } from "@/lib/safety";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "올바른 JSON 요청을 보내주세요." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "입력값을 확인해 주세요." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (typeof input.message !== "string" || input.message.trim().length === 0 || input.message.length > 2000 || !isSituation(input.situation)) {
    return NextResponse.json({ error: "메시지(1~2,000자)와 현재 상황을 확인해 주세요." }, { status: 400 });
  }
  const safeMessage = redactMessage(input.message);
  const result = analyzeMessage(safeMessage, input.situation);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
