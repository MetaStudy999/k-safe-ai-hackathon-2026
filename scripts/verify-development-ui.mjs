import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { analyzeMessage, EXAMPLE_MESSAGE } from "../src/lib/safety.ts";

const base = new URL(process.env.UI_BASE_URL || "http://127.0.0.1:3113");
assert.equal(base.hostname, "127.0.0.1");
const browser = await chromium.launch();
const checkedAt = new Date().toISOString();
const checks = {}, layouts = [];
const rules = analyzeMessage(EXAMPLE_MESSAGE, "already_transferred");
const fixture = (summary = "모의 응답: 규칙 신호의 보조 설명입니다.") => ({ ...rules, source: "rules_with_ai_explanation", analysis_status: "completed", ai: { status: "generated", model: "MOCK_ONLY", summary, explanations: rules.signals.map(signal_id => ({ signal_id, text: "모의 응답: 해당 규칙 신호를 확인할 필요가 있습니다." })) } });
const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = value => rgb(value).map(c => c / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
try {
  await mkdir("artifacts/ai", { recursive: true });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage(); const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(new URL("/lab", base).href);
    const heading = await page.locator("#hero-title").evaluate(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(e).fontSize), lineHeight: parseFloat(getComputedStyle(e).lineHeight) }));
    assert.ok(heading.width >= width * 0.5);
    assert.ok(heading.height <= heading.lineHeight * 4);
    assert.doesNotMatch(await page.locator('label:has(input[value="already_transferred"])').innerText(), /계좌/);
    await page.getByRole("button", { name: /가상 예시 불러오기/ }).click();
    await page.locator('input[value="already_transferred"]').check();
    assert.match(await page.locator(".emergency").innerText(), /112/);
    const colors = await page.locator(".primaryButton").evaluate(e => ({ foreground: getComputedStyle(e).color, background: getComputedStyle(e).backgroundColor }));
    const a = luminance(colors.foreground), b = luminance(colors.background);
    const contrast = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    assert.ok(contrast >= 4.5);
    await page.route("**/api/analyze", route => route.fulfill({ json: fixture() }));
    await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
    await page.locator(".ai-explanation").waitFor();
    assert.match(await page.locator(".analysisBox").innerText(), /입력에서 찾은 규칙 신호/);
    assert.match(await page.locator(".ai-explanation").innerText(), /AI 보조 설명/);
    assert.match(await page.locator(".guide").innerText(), /상황별 기본 안전행동/);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    assert.equal(axe.violations.length, 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.screenshot({ path: `artifacts/ai/development-ui-${width}.png`, fullPage: true });
    layouts.push({ width, hero_heading: heading, button_colors: colors, button_text_contrast: Math.round(contrast * 100) / 100, axe_violations: 0, axe_incomplete: axe.incomplete.map(item => item.id), horizontal_overflow: false });
    // All error/race cases below are explicit mocked API responses, never live AI.
    await page.unroute("**/api/analyze");
    await page.route("**/api/analyze", async route => { await new Promise(ok => setTimeout(ok, 300)); await route.fulfill({ json: fixture("모의 이전 응답: 적용하면 안 됩니다.") }); });
    await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
    await page.locator('input[value="unsure"]').check();
    await page.waitForTimeout(450);
    assert.equal(await page.locator(".ai-explanation").count(), 0);
    checks.situation_change_discards_old_response = true;
    await page.unroute("**/api/analyze");
    let sequence = 0;
    await page.route("**/api/analyze", async route => {
      const old = ++sequence === 1;
      await new Promise(ok => setTimeout(ok, old ? 650 : 30));
      await route.fulfill({ json: fixture(old ? "모의 오래된 응답" : "모의 새 요청 응답") });
    });
    await page.locator('input[value="already_transferred"]').check();
    await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
    await page.locator("textarea").fill(EXAMPLE_MESSAGE + " 가상 예시 추가 문장");
    await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
    await page.waitForTimeout(800);
    assert.match(await page.locator(".ai-explanation").innerText(), /모의 새 요청 응답/);
    assert.doesNotMatch(await page.locator(".ai-explanation").innerText(), /오래된/);
    checks.text_change_and_new_request_preserve_new_result = true;
    await page.unroute("**/api/analyze");
    for (const status of ["invalid", "unavailable", "limited"]) {
      await page.route("**/api/analyze", route => route.fulfill({ json: { ...rules, ai: { status } } }));
      await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
      await page.locator(".analysisBox").waitFor();
      assert.equal(await page.locator(".ai-explanation").count(), 0);
      assert.match(await page.locator(".guide").innerText(), /112/);
      assert.match(await page.locator(".mode").innerText(), /기본 규칙 안내/);
      await page.unroute("**/api/analyze");
    }
    checks.invalid_unavailable_limited_preserve_rules = true;
    await page.route("**/api/analyze", route => route.fulfill({ status: 503, json: { error: "MOCK_UNAVAILABLE" } }));
    await page.getByRole("button", { name: /위험 신호 분석하기/ }).click();
    await page.locator(".error").waitFor();
    assert.match(await page.locator(".guide").innerText(), /112/);
    assert.deepEqual(errors, []);
    checks.request_failure_preserves_emergency_actions = true;
    await context.close();
  }
  Object.assign(checks, { button_contrast_at_least_4_5: true, transfer_label_excludes_account_sharing: true, rules_ai_and_generic_actions_separate: true, desktop_mobile_axe_pass: true, hero_heading_legible_dimensions: true });
  const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const sourceFiles = [];
  for (const path of ["src/lib/safety.ts", "src/app/local-analyzer.tsx", "src/app/globals.css"]) sourceFiles.push({ path, sha256: createHash("sha256").update(await readFile(path)).digest("hex"), matches_source_commit: createHash("sha256").update(await readFile(path)).digest("hex") === createHash("sha256").update(execFileSync("git", ["show", `${sourceCommit}:${path}`])).digest("hex") });
  const report = { checked_at: checkedAt, source_commit: sourceCommit, source_files: sourceFiles, worktree_status_at_execution: execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().split("\n"), scope: "Local development browser UI with mocked API responses only; no live model inference or remote deployment verification.", checks, layouts, passed: true };
  await writeFile("artifacts/ai/development-ui-verification-20261102.json", JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ checks, layouts, passed: true }));
} finally { await browser.close(); }
