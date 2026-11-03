import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { getPublicDemoActions } from "../../src/lib/public-demo";

declare global {
  interface Window {
    speechTest: {
      spoken: { text: string; lang: string; rate: number; voice: { lang: string; localService: boolean } | null }[];
      cancelled: number;
      current: SpeechSynthesisUtterance | null;
      mode: "normal" | "silent" | "throw";
      voices: SpeechSynthesisVoice[];
    };
  }
}

async function mockSpeech(page: Page) {
  await page.addInitScript(() => {
    window.speechTest = {
      spoken: [], cancelled: 0, current: null, mode: "normal",
      voices: [
        { lang: "en-US", localService: true },
        { lang: "ko-KR", localService: false },
        { lang: "ko-KR", localService: true },
      ] as SpeechSynthesisVoice[],
    };
    class Utterance {
      lang = "";
      rate = 1;
      voice = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => window.speechTest.voices,
        cancel: () => {
          const data = window.speechTest;
          data.cancelled++;
          const previous = data.current;
          data.current = null;
          // Some engines emit interruption events after cancel().
          setTimeout(() => previous?.onerror?.(new Event("error") as SpeechSynthesisErrorEvent), 5);
        },
        speak: (utterance: SpeechSynthesisUtterance) => {
          const data = window.speechTest;
          if (data.mode === "throw") throw new Error("Speech unavailable");
          data.current = utterance;
          data.spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate, voice: utterance.voice });
          if (data.mode !== "silent") utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
        },
      },
    });
  });
}

for (const width of [390, 1440]) {
  test(`${width}px: selection speaks Korean guidance; repeat, stop and completion work`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockSpeech(page);
    await page.goto("/");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    const group = page.getByRole("group", { name: "송금 전 음성 안내", exact: true });
    await expect(group).toHaveCount(0);
    expect(await page.evaluate(() => window.speechTest.spoken)).toEqual([]);
    await page.locator(".situation-card.before_transfer").click();
    await expect(group.getByRole("status")).toContainText("재생하고 있습니다");
    const first = await page.evaluate(() => window.speechTest.spoken[0]);
    expect(first.lang).toBe("ko-KR");
    expect(first.voice?.localService).toBe(true);
    for (const text of getPublicDemoActions("before_transfer")) {
      expect(first.text).toContain(text.replace(/\b(112|118|1394)\b/g, (number) => number.split("").join(" ")));
    }
    expect(first.text).not.toContain("OO은행");
    await page.locator(".situation-card.before_transfer").click();
    expect(await page.evaluate(() => window.speechTest.spoken.length)).toBe(2);
    await group.getByRole("button", { name: "안내 음성 다시 듣기", exact: true }).click();
    await expect(group.getByRole("status")).toContainText("재생하고 있습니다");
    expect(await page.evaluate(() => window.speechTest.spoken.length)).toBe(3);
    await group.getByRole("button", { name: "음성 중지", exact: true }).click();
    await expect(group.getByRole("status")).toHaveText("음성 안내를 중지했습니다.");
    await expect(group.getByRole("button", { name: "음성 중지", exact: true })).toBeDisabled();
    await group.getByRole("button", { name: "안내 음성 다시 듣기", exact: true }).click();
    await page.evaluate(() => {
      const utterance = window.speechTest.current!;
      utterance.onend?.(new Event("end") as SpeechSynthesisEvent);
    });
    await expect(group.getByRole("status")).toContainText("끝났습니다");
    expect(requests).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: `${process.env.UI_ARTIFACT_DIR}/before-transfer-${width}.png`, fullPage: true });
  });
}

test("switching situations and leaving the page stop stale narration", async ({ page }) => {
  await mockSpeech(page);
  await page.goto("/");
  await page.locator(".situation-card.before_transfer").click();
  await page.locator(".situation-card.already_transferred").click();
  expect(await page.evaluate(() => window.speechTest.current)).toBeNull();
  await expect(page.locator(".guide-speech")).toHaveCount(0);
  await expect(page.locator(".mobile-emergency")).toContainText("즉시");
  await page.locator(".situation-card.before_transfer").click();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(page.locator(".guide-speech [role=status]")).toHaveText("음성 안내를 중지했습니다.");
  expect(await page.evaluate(() => window.speechTest.current)).toBeNull();
});

test("keyboard selection and controls work without a mouse", async ({ page }) => {
  await mockSpeech(page);
  await page.goto("/");
  const radio = page.locator('input[value="before_transfer"]');
  await radio.focus();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await expect(page.locator(".guide-speech [role=status]")).toContainText("재생하고 있습니다");
  await page.getByRole("button", { name: "음성 중지", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guide-speech [role=status]")).toContainText("중지했습니다");
});

test("missing speech APIs and playback errors retain readable guidance", async ({ page }) => {
  await page.addInitScript(() => {
    // Delete prototype properties as well, matching a browser with no speech API.
    let object: object | null = window;
    while (object) {
      for (const key of ["speechSynthesis", "SpeechSynthesisUtterance"]) Reflect.deleteProperty(object, key);
      object = Object.getPrototypeOf(object);
    }
  });
  await page.goto("/");
  await page.locator(".situation-card.before_transfer").click();
  await expect(page.locator(".guide-speech [role=status]")).toContainText("지원하지 않습니다");
  await expect(page.getByRole("button", { name: "안내 음성 다시 듣기", exact: true })).toBeDisabled();
  await expect(page.locator(".action-list")).toContainText("송금·앱 설치·인증번호 전달을 멈추세요.");
});

test("empty voice lists, errors and a speech engine that never starts are handled", async ({ page }) => {
  await mockSpeech(page);
  await page.goto("/");
  await page.evaluate(() => { window.speechTest.voices = []; });
  await page.locator(".situation-card.before_transfer").click();
  expect(await page.evaluate(() => window.speechTest.spoken[0].lang)).toBe("ko-KR");
  await page.evaluate(() => {
    window.speechTest.current?.onerror?.(new Event("error") as SpeechSynthesisErrorEvent);
  });
  await expect(page.locator(".guide-speech [role=status]")).toContainText("재생하지 못했습니다");
  await page.evaluate(() => { window.speechTest.mode = "throw"; });
  await page.getByRole("button", { name: "안내 음성 다시 듣기", exact: true }).click();
  await expect(page.locator(".guide-speech [role=status]")).toContainText("재생하지 못했습니다");
  await page.clock.install();
  await page.evaluate(() => { window.speechTest.mode = "silent"; });
  await page.getByRole("button", { name: "안내 음성 다시 듣기", exact: true }).click();
  await expect(page.locator(".guide-speech [role=status]")).toContainText("준비하고 있습니다");
  await page.clock.fastForward(8100);
  await expect(page.locator(".guide-speech [role=status]")).toContainText("재생하지 못했습니다");
  expect(await page.evaluate(() => window.speechTest.current)).toBeNull();
});

test("320px: large text, high contrast, touch targets and accessibility", async ({ page }) => {
  await mockSpeech(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await page.getByRole("button", { name: "글자 크게 보기", exact: true }).click();
  await page.locator("#mobile-menu").getByRole("button", { name: "화면 대비 높이기", exact: true }).click();
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await page.locator(".situation-card.before_transfer").click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const button of await page.locator(".guide-speech button").all()) {
    const rect = await button.boundingBox();
    expect(rect!.width).toBeGreaterThanOrEqual(44);
    expect(rect!.height).toBeGreaterThanOrEqual(44);
  }
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: `${process.env.UI_ARTIFACT_DIR}/large-contrast-320.png`, fullPage: true });
});
