import { NextResponse } from "next/server";
import { analyzeMessage, isSituation, redactMessage } from "@/lib/safety";
import { readBoundedJson, RequestBodyError } from "@/lib/request-guard";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { error: error.safeMessage },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "요청을 처리할 수 없습니다." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "입력값을 확인해 주세요." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  if (
    typeof input.message !== "string" ||
    input.message.trim().length === 0 ||
    input.message.length > 2000 ||
    !isSituation(input.situation)
  ) {
    return NextResponse.json(
      { error: "메시지(1~2,000자)와 현재 상황을 확인해 주세요." },
      { status: 400 }
    );
  }

  const safeMessage = redactMessage(input.message);
  const result = analyzeMessage(safeMessage, input.situation);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
