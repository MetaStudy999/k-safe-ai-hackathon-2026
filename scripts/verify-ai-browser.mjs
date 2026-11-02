import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { analyzeMessage, EXAMPLE_MESSAGE } from "../src/lib/safety.ts";
const browser = await chromium.launch({ headless: true });
const checks = {};
const checkedAt = new Date().toISOString();
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
await mkdir("artifacts/ai", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const posts = [];
  page.on("request", (request) => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("http://127.0.0.1:3112");
  for (const situation of ["before_transfer", "already_transferred", "installed_app", "unsure"]) {
    await page.locator(`.situation-card.${situation}`).click();
    await page.locator(".ai-demo-note summary").click();
    assert.match(await page.locator(".ai-demo-note").innerText(), /미리 생성한 설명/);
    assert.match(await page.locator(".ai-demo-note").innerText(), /gpt-6-luna/);
    assert.equal(await page.locator(".ai-demo-note").evaluate((element) => element.open), true);
  }
  checks.public_pre_generated_explanations_four_situations = true;
  checks.public_ai_post_requests_zero = posts.length === 0;
  assert.equal(posts.length, 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: "artifacts/ai/public-ai-mobile-v2.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3113/lab");
  await page.getByRole("button", { name: /가상 예시 불러오기/ }).click();
  await page.locator('input[value="already_transferred"]').check();
  assert.match(await page.locator(".emergency").innerText(), /112/);
  checks.emergency_before_ai = true;
  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/analyze"), { timeout: 30000 });
  await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
  const response = await responsePromise;
  const body = await response.json();
  assert.equal(response.status(), 200);
  assert.equal(body.ai.status, "generated");
  const expectedRules = analyzeMessage(EXAMPLE_MESSAGE, "already_transferred");
  for (const key of ["risk_level", "signals", "reasons", "uncertainty_notice", "recommended_actions"]) assert.deepEqual(body[key], expectedRules[key]);
  await page.locator(".ai-explanation").waitFor();
  assert.match(await page.locator(".mode").innerText(), /AI 보조 설명 연결/);
  assert.match(await page.locator(".guide").innerText(), /112/);
  checks.browser_api_live_ai_response_rendered = true;
  checks.rules_actions_preserved = true;
  await page.screenshot({ path: "artifacts/ai/local-ai-desktop-v2.png", fullPage: true });
  await page.route("**/api/analyze", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
  await page.locator('input[value="unsure"]').check();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".ai-explanation").count(), 0);
  checks.stale_result_not_applied_after_situation_change = true;
  await page.unroute("**/api/analyze");
  await page.route("**/api/analyze", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"unavailable"}' }));
  await page.locator('input[value="already_transferred"]').check();
  await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
  await page.locator(".error").waitFor();
  assert.match(await page.locator(".guide").innerText(), /112/);
  checks.api_failure_preserves_emergency_actions = true;
  const sourceFiles = [];
  for (const path of ["src/lib/safety.ts", "src/lib/ai-explanation.ts", "src/app/api/analyze/route.ts", "src/app/local-analyzer.tsx", "src/app/globals.css", "src/app/public-demo.tsx", "src/data/ai-demo-explanations.json"]) {
    const sha256 = createHash("sha256").update(await readFile(path)).digest("hex");
    const committed = createHash("sha256").update(execFileSync("git", ["show", `${sourceCommit}:${path}`])).digest("hex");
    assert.equal(sha256, committed);
    sourceFiles.push({ path, sha256, matches_source_commit: true });
  }
  await writeFile("artifacts/ai/browser-verification-20261102-v2.json", JSON.stringify({ checked_at: checkedAt, completed_at: new Date().toISOString(), source_commit: sourceCommit, source_files: sourceFiles, environment: "local production 3112 and explicitly enabled development 3113", live_scope: ["one actual browser to API to OpenAI to UI response", "rule risk/signals/reasons/uncertainty/actions deep equality"], mocked_scope: ["delayed old response after situation change", "HTTP 503 fallback"], checks, passed: true }, null, 2) + "\n");
  console.log(JSON.stringify({ checks, passed: true }));
} finally { await browser.close(); }
