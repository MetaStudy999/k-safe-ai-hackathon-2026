import test from "node:test";
import assert from "node:assert/strict";
import { MAX_REQUEST_BYTES, readBoundedJson, RequestBodyError } from "../src/lib/request-guard";

const make = (text: string, contentType = "application/json") =>
  new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": contentType },
    body: text
  });

test("정상 JSON 파싱", async () => {
  const data = { situation: "unsure", message: "합성 문장" };
  assert.deepEqual(await readBoundedJson(make(JSON.stringify(data))), data);
});

test("잘못된 JSON은 400", async () => {
  await assert.rejects(readBoundedJson(make("{broken-json")), (error: unknown) =>
    error instanceof RequestBodyError && error.status === 400);
});

test("지원하지 않는 형식은 415", async () => {
  await assert.rejects(readBoundedJson(make("hello", "text/plain")), (error: unknown) =>
    error instanceof RequestBodyError && error.status === 415);
});

test("실제 요청 본문이 8KiB를 초과하면 413", async () => {
  const text = JSON.stringify({ message: "가".repeat(3000), situation: "unsure" });
  assert.ok(Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES);
  await assert.rejects(readBoundedJson(make(text)), (error: unknown) =>
    error instanceof RequestBodyError && error.status === 413);
});

test("빈 요청은 400", async () => {
  const request = new Request("http://localhost/api/analyze", {
    method: "POST", headers: { "content-type": "application/json" }
  });
  await assert.rejects(readBoundedJson(request), (error: unknown) =>
    error instanceof RequestBodyError && error.status === 400);
});
