import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { BEFORE_TRANSFER_AUDIO, GUIDE_AUDIO } from "../../src/app/use-guide-speech";

const output = process.env.UI_ARTIFACT_DIR || "artifacts/ui/all-situation-voice-20261104";
mkdirSync(output, { recursive: true });

declare global {
  interface Window {
    guideAudio: HTMLAudioElement[];
    guidePlayCalls: { active: boolean; time: number }[];
    guideMode: "normal" | "blocked" | "pending";
  }
}

// Observe real HTMLAudioElements and native play(); only error tests inject failures.
async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    window.guideAudio = [];
    window.guidePlayCalls = [];
    window.guideMode = "normal";
    const NativeAudio = window.Audio;
    window.Audio = new Proxy(NativeAudio, {
      construct(Target, args) {
        const audio = new Target(...args as [string?]);
        window.guideAudio.push(audio);
        return audio;
      },
    });
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.guidePlayCalls.push({ active: navigator.userActivation.isActive, time: this.currentTime });
      if (window.guideMode === "blocked") return Promise.reject(new DOMException("Blocked", "NotAllowedError"));
      if (window.guideMode === "pending") return new Promise(() => {});
      return nativePlay.call(this);
    };
    // Any browser-TTS fallback is a test failure.
    if (window.speechSynthesis) window.speechSynthesis.speak = () => { throw new Error("Browser TTS fallback used"); };
  });
}
const select = (page: Page) => page.locator(".situation-card.before_transfer").click();
const status = (page: Page) => page.locator(".guide-speech [role=status]");
const replay = (page: Page) => page.getByRole("button", { name: /안내 음성 다시 듣기$/ });
async function playing(page: Page) {
  await expect(status(page)).toContainText("재생하고 있습니다");
  await expect.poll(() => page.evaluate(() => window.guideAudio.at(-1)!.currentTime)).toBeGreaterThan(0.1);
}
async function allPaused(page: Page) {
  expect(await page.evaluate(() => window.guideAudio.every((audio) => audio.paused))).toBe(true);
}

for (const width of [390, 1440]) {
  test(`${width}px: real MP3 decodes; selection, restart, repeat, stop and native completion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await observeAudio(page);
    const errors: string[] = [];
    const audioRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (request.url().includes("/audio/")) audioRequests.push(request.url()); });
    await page.goto("/");
    await expect(page.locator(".guide-speech")).toHaveCount(0);
    expect(await page.evaluate(() => window.guideAudio.length)).toBe(0);
    expect(audioRequests).toEqual([]);
    const responsePromise = page.waitForResponse((response) => response.url().endsWith(BEFORE_TRANSFER_AUDIO));
    await select(page);
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("audio/mpeg");
    await playing(page);
    const decoded = await page.evaluate(() => {
      const a = window.guideAudio.at(-1)!;
      return { duration: a.duration, readyState: a.readyState, error: a.error?.code ?? null, currentTime: a.currentTime };
    });
    expect(decoded.duration).toBeGreaterThan(10);
    expect(decoded.duration).toBeLessThan(60);
    expect(decoded.readyState).toBeGreaterThanOrEqual(2);
    expect(decoded.error).toBeNull();
    for (const activate of [() => select(page), () => replay(page).click()]) {
      await activate();
      await playing(page);
      expect(await page.evaluate(() => window.guideAudio.filter((a) => !a.paused).length)).toBe(1);
      expect(await page.evaluate(() => window.guideAudio.slice(0, -1).every((a) => a.paused && !a.hasAttribute("src")))).toBe(true);
    }
    const calls = await page.evaluate(() => window.guidePlayCalls);
    expect(calls).toHaveLength(3);
    expect(calls.every((call) => call.active && call.time === 0)).toBe(true);
    await page.getByRole("button", { name: /음성 중지$/ }).click();
    await expect(status(page)).toContainText("중지했습니다");
    await allPaused(page);
    await expect(page.getByRole("button", { name: /음성 중지$/ })).toBeDisabled();
    await replay(page).click();
    await playing(page);
    // Seek near the real file's end; completion must come from native ended.
    await page.evaluate(() => { const a = window.guideAudio.at(-1)!; a.currentTime = a.duration - 0.2; });
    await expect(status(page)).toContainText("끝났습니다");
    await allPaused(page);
    expect(errors).toEqual([]);
    writeFileSync(`${output}/decode-${width}.json`, JSON.stringify({ decoded, calls, audioRequests, errors }, null, 2));
    await page.screenshot({ path: `${output}/before-transfer-${width}.png`, fullPage: true });
  });
}

test("other situation, hidden tab and pagehide release audio", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  await select(page);
  await playing(page);
  await page.locator(".situation-card.already_transferred").click();
  await playing(page);
  expect(await page.evaluate(() => window.guideAudio.filter((a) => !a.paused).length)).toBe(1);
  await expect(page.locator(".mobile-emergency")).toContainText("즉시");
  for (const event of ["visibilitychange", "pagehide"]) {
    await select(page);
    await playing(page);
    await page.evaluate((name) => {
      if (name === "visibilitychange") {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event(name));
        Reflect.deleteProperty(document, "hidden");
      } else window.dispatchEvent(new Event(name));
    }, event);
    await expect(status(page)).toContainText("중지했습니다");
    await allPaused(page);
  }

});

test("keyboard selection, stop and replay retain focus", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  const radio = page.locator('input[value="before_transfer"]');
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await playing(page);
  await page.getByRole("button", { name: /음성 중지$/ }).focus();
  await page.keyboard.press("Enter");
  await expect(status(page)).toContainText("중지했습니다");
  await replay(page).focus();
  await page.keyboard.press("Enter");
  await playing(page);
  await expect(replay(page)).toBeFocused();
});

for (const failure of ["network", "decode", "blocked"] as const) {
  test(`${failure} failure keeps text and permits retry without browser TTS`, async ({ page }) => {
    await observeAudio(page);
    if (failure === "network") await page.route(`**${BEFORE_TRANSFER_AUDIO}`, (route) => route.fulfill({ status: 404, body: "Not found" }));
    if (failure === "decode") await page.route(`**${BEFORE_TRANSFER_AUDIO}`, (route) => route.fulfill({ contentType: "audio/mpeg", body: "invalid audio" }));
    await page.goto("/");
    if (failure === "blocked") await page.evaluate(() => { window.guideMode = "blocked"; });
    await select(page);
    await expect(status(page)).toContainText("재생하지 못했습니다");
    await expect(page.locator(".action-list")).toContainText("송금·앱 설치·인증번호 전달을 멈추세요.");
    await expect(page.locator(".action-list")).toContainText("1394");
    await expect(page.locator(".action-list")).toContainText("118");
    await expect(replay(page)).toBeEnabled();
    await allPaused(page);
    await page.unroute(`**${BEFORE_TRANSFER_AUDIO}`);
    await page.evaluate(() => { window.guideMode = "normal"; });
    await replay(page).click();
    await playing(page);
  });
}

test("pending play times out and can be retried", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  await page.clock.install();
  await page.evaluate(() => { window.guideMode = "pending"; });
  await select(page);
  await expect(status(page)).toContainText("준비하고 있습니다");
  await page.clock.fastForward(15100);
  await expect(status(page)).toContainText("재생하지 못했습니다");
  await allPaused(page);
  await page.clock.resume();
  await page.evaluate(() => { window.guideMode = "normal"; });
  await replay(page).click();
  await playing(page);
});

test("rapid replacement ignores a stale play rejection and native pause updates status", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  await page.evaluate(() => {
    const play = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) {
        first = false;
        return new Promise((_, reject) => {
          window.setTimeout(() => reject(new DOMException("Late", "AbortError")), 1000);
        });
      }
      return play.call(this);
    };
  });
  await select(page);
  await expect(status(page)).toContainText("준비하고 있습니다");
  await page.locator(".situation-card.clicked_link").click();
  await playing(page);
  await expect.poll(() => page.evaluate(() => window.guideAudio.at(-1)!.currentTime)).toBeGreaterThan(1.2);
  await expect(status(page)).toContainText("재생하고 있습니다");
  await page.evaluate(() => window.guideAudio.at(-1)!.pause());
  await expect(status(page)).toContainText("중지했습니다");
  await allPaused(page);
});

test("320px: card height, emergency access, large text, contrast and accessibility", async ({ page }) => {
  await observeAudio(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const initialHeight = (await page.locator(".situation-card.before_transfer").boundingBox())!.height;
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await page.getByRole("button", { name: "글자 크게 보기", exact: true }).click();
  await page.locator("#mobile-menu").getByRole("button", { name: "화면 대비 높이기", exact: true }).click();
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  const enlargedHeight = (await page.locator(".situation-card.before_transfer").boundingBox())!.height;
  await select(page);
  await playing(page);
  expect((await page.locator(".situation-card.before_transfer").boundingBox())!.height).toBe(enlargedHeight);
  expect(initialHeight).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.mobile-emergency a[href="tel:112"]')).toBeVisible();
  await expect(page.locator('.mobile-emergency .bank')).toBeVisible();
  for (const button of await page.locator(".guide-speech button").all()) {
    const rect = await button.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(44);
    expect(rect!.height).toBeGreaterThanOrEqual(44);
  }
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: `${output}/large-contrast-320.png`, fullPage: true });
});


test("all six files decode, advance, replace, restart and stop; safe phone and information changes", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  expect(await page.evaluate(() => window.guideAudio.length)).toBe(0);
  const decoded = [];
  for (const [situation, file] of Object.entries(GUIDE_AUDIO)) {
    await page.locator(`.situation-card.${situation}`).click();
    await playing(page);
    const media = await page.evaluate(() => {
      const audio = window.guideAudio.at(-1)!;
      return { src: new URL(audio.src).pathname, duration: audio.duration, readyState: audio.readyState, error: audio.error?.code ?? null, active: window.guideAudio.filter(a => !a.paused).length };
    });
    expect(media.src).toBe(file);
    expect(media.duration).toBeGreaterThan(10);
    expect(media.readyState).toBeGreaterThanOrEqual(2);
    expect(media.error).toBeNull();
    expect(media.active).toBe(1);
    decoded.push({ situation, ...media });
    await page.locator(`.situation-card.${situation}`).click();
    await playing(page);
    expect(await page.evaluate(() => window.guidePlayCalls.at(-1)!.time)).toBe(0);
    await replay(page).click();
    await playing(page);
    expect(await page.evaluate(() => window.guidePlayCalls.at(-1)!.time)).toBe(0);
    await page.getByRole("button", { name: /음성 중지$/ }).click();
    await allPaused(page);
  }
  await page.locator(".situation-card.installed_app").click();
  await page.getByRole("button", { name: "이미 돈도 보냈어요 → 긴급 안내", exact: true }).click();
  await playing(page);
  await expect(page.locator(".mobile-emergency")).toContainText("다른 안전한 전화");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  expect(await page.evaluate(() => new URL(window.guideAudio.at(-1)!.src).pathname)).toBe(GUIDE_AUDIO.already_transferred);
  await page.locator(".situation-card.shared_information").click();
  await playing(page);
  await page.locator('input[name="shared-information-kind"][value="card"]').check();
  await expect(status(page)).toContainText("중지했습니다");
  await allPaused(page);
  await page.locator('input[value="clicked_link"]').focus();
  await page.keyboard.press("Space");
  await playing(page);
  expect(await page.evaluate(() => new URL(window.guideAudio.at(-1)!.src).pathname)).toBe(GUIDE_AUDIO.clicked_link);
  await page.keyboard.press("ArrowLeft");
  await playing(page);
  expect(await page.evaluate(() => new URL(window.guideAudio.at(-1)!.src).pathname)).toBe(GUIDE_AUDIO.shared_information);
  writeFileSync(`${output}/all-situation-decode.json`, JSON.stringify(decoded, null, 2));
});


test("general navigation never starts audio", async ({ page }) => {
  await observeAudio(page);
  await page.goto("/");
  await page.locator('.desktop-nav a[href="#rules"]').click();
  expect(await page.evaluate(() => window.guideAudio.length)).toBe(0);
});
