import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// This records only the local production scenario UI. No key or live AI is used.
const base = new URL(process.env.UI_BASE_URL || "http://127.0.0.1:3112");
assert.equal(base.hostname, "127.0.0.1", "Recording is restricted to local loopback.");
const out = "docs/08-presentation";
await mkdir(out, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), "k-safe-recording-"));
const browser = await chromium.launch({ headless: true });
const started = new Date();
const posts = [], errors = [], external = [], stages = [];
let context;
try {
  context = await browser.newContext({ viewport: { width: 1280, height: 900 }, recordVideo: { dir: temp, size: { width: 1280, height: 900 } }, reducedMotion: "reduce" });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== base.origin) { external.push(url.origin); return route.abort(); }
    if (route.request().method() === "POST") { posts.push(url.pathname); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const response = await page.goto(base.href);
  assert.equal(response?.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("textarea").count(), 0);
  await page.evaluate(() => {
    const box = document.createElement("div"); box.id = "recording-caption"; box.setAttribute("role", "note");
    box.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:16px 28px;background:#061634;color:#ecf8ff;border-bottom:3px solid #00c7ff;font:600 21px/1.5 Pretendard,sans-serif;box-shadow:0 -4px 24px #06163444;pointer-events:none";
    document.body.appendChild(box);
    document.documentElement.style.scrollBehavior = "auto";
    document.documentElement.style.scrollPaddingTop = "110px";
    document.body.style.paddingTop = "90px";
  });
  const caption = async text => page.locator("#recording-caption").evaluate((box, value) => { box.textContent = value; }, text);
  await caption("K-SAFE 공개 가상 사례 · 자동 녹화 / 사전 생성 AI 설명이며 실시간 분석이 아닙니다.");
  await page.waitForTimeout(4000);
  const labels = [
    ["before_transfer", "01 송금 전 · 가상 사례의 위험 단서와 확인할 행동을 살펴봅니다."],
    ["already_transferred", "02 이미 송금 · AI 응답을 기다리지 않고 상황별 행동·공식 연락 안내를 확인합니다."],
    ["installed_app", "03 앱 설치 후 · 상황에 맞는 안내를 확인합니다. 기관 조치는 서비스가 대신하지 않습니다."],
    ["unsure", "04 잘 모르겠어요 · 사전 생성 설명만으로 사기나 안전 여부를 확정할 수 없습니다."],
  ];
  for (const [situation, label] of labels) {
    await page.locator(`.situation-card.${situation}`).click();
    assert.equal(await page.locator(`input[value="${situation}"]`).isChecked(), true);
    await caption(label);
    await page.locator("#situation-title").scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    await page.locator(".ai-demo-note summary").click();
    const note = page.locator(".ai-demo-note");
    assert.match(await note.innerText(), /미리 생성한 설명/);
    assert.match(await note.innerText(), /지금 사용자 메시지를 분석하거나 AI를 호출하지 않습니다/);
    await note.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5000);
    stages.push({ situation, pre_generated_notice_visible: true, selection_correct: true });
  }
  await caption("가상 사례 녹화 종료 · 실제 입력·AI 호출·전화·신고 실행 없음 / 실제 AI 연결 증빙은 별도 검증 기록입니다.");
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(4000);
  assert.deepEqual(posts, []); assert.deepEqual(external, []); assert.deepEqual(errors, []);
  const video = page.video();
  await context.close(); context = undefined;
  await rename(await video.path(), join(out, "K-SAFE-PUBLIC-DEMO-20261102.webm"));
  const data = JSON.parse(await readFile("src/data/ai-demo-explanations.json", "utf8"));
  const manifest = { recorded_at: started.toISOString(), source_commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), duration_ms: Date.now() - started.getTime(), mode: "automated_local_public_scenario_recording", viewport: { width: 1280, height: 900 }, video: "K-SAFE-PUBLIC-DEMO-20261102.webm", captions_added_for_recording_only: true, live_ai_calls: 0, post_requests: posts.length, external_requests: external.length, page_errors: errors.length, pre_generated_ai_model: data.model, stages, human_rehearsal: "NOT_RUN", remote_deployment_verification: "NOT_RUN" };
  await writeFile(join(out, "public-demo-recording.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(JSON.stringify(manifest));
} finally {
  if (context) await context.close();
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
