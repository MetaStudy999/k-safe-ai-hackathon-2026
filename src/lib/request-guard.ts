/**
 * API 요청 본문 읽기 보호 장치.
 * HTTP 요청을 메모리에 전체 JSON으로 파싱하기 전에 스트림 누적 바이트를 제한한다.
 * 공용 호스팅의 엣지/프록시 수신 제한을 대체하지는 않는다.
 */
export const MAX_REQUEST_BYTES = 8 * 1024;

export class RequestBodyError extends Error {
  constructor(
    public readonly status: 400 | 413 | 415,
    public readonly safeMessage: string
  ) {
    super(safeMessage);
    this.name = "RequestBodyError";
  }
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestBodyError(415, "JSON 형식으로 요청해 주세요.");
  }

  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d+$/.test(length)) {
      throw new RequestBodyError(400, "요청 길이를 확인해 주세요.");
    }
    if (Number(length) > MAX_REQUEST_BYTES) {
      throw new RequestBodyError(413, "요청 크기가 제한을 초과했습니다.");
    }
  }

  if (!request.body) {
    throw new RequestBodyError(400, "요청 내용을 입력해 주세요.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      // Content-Length 헤더를 조작해도 실제 수신량을 제한한다.
      if (bytes > MAX_REQUEST_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyError(413, "요청 크기가 제한을 초과했습니다.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }

  if (bytes === 0) {
    throw new RequestBodyError(400, "요청 내용을 입력해 주세요.");
  }

  const merged = new Uint8Array(bytes);
  let position = 0;
  for (const chunk of chunks) {
    merged.set(chunk, position);
    position += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(merged)) as unknown;
  } catch {
    throw new RequestBodyError(400, "올바른 JSON 요청을 보내주세요.");
  }
}
