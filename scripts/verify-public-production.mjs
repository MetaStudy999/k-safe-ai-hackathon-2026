import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

const base = new URL(process.env.UI_BASE_URL || "http://127.0.0.1:3102");
assert.equal(
  base.hostname,
  "127.0.0.1",
  "Run this production gate check on local loopback only.",
);
const results = [];
for (const [path, expected, payload] of [
  ["/", 200],
  ["/lab", 404],
  ["/api/analyze", 503, { message: "가상 메시지", situation: "unsure" }],
]) {
  const response = await fetch(
    new URL(path, base),
    payload
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      : undefined,
  );
  assert.equal(response.status, expected, path);
  if (payload) assert.equal(response.headers.get("cache-control"), "no-store");
  results.push({
    path,
    expected,
    status: response.status,
    cacheControl: response.headers.get("cache-control"),
  });
  console.log(`PASS ${path}: HTTP ${response.status}`);
}
writeFileSync(
  "artifacts/ui/production-security.json",
  JSON.stringify(results, null, 2) + "\n",
);
