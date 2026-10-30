import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  PUBLIC_DEMO_SCENARIOS,
  getPublicDemoActions,
} from "../../src/lib/public-demo";

const output = "artifacts/ui/final";
mkdirSync(output, { recursive: true });

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`${width}px: scenarios, layout, targets and browser errors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width <= 768 ? 844 : 900 });
    const errors: string[] = [];
    const posts: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (request.method() === "POST") posts.push(request.url());
    });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "의심스러운 연락",
    );
    await expect(page.locator('input[name="situation"]:checked')).toHaveValue(
      "already_transferred",
    );
    await expect(page.locator(".hero-artwork")).toBeVisible();
    await expect(page.locator(".demo-notice")).toContainText(
      "실제 AI 분석 아님",
    );
    expect(await page.locator("textarea").count()).toBe(0);

    for (const scenario of PUBLIC_DEMO_SCENARIOS) {
      await page.locator(`.situation-card.${scenario.id}`).click();
      await expect(page.locator(`input[value="${scenario.id}"]`)).toBeChecked();
      await expect(page.locator(".situation-card.selected")).toHaveCount(1);
      await expect(page.locator(".message-example blockquote")).toContainText(
        scenario.message,
      );
      for (const clue of scenario.clues)
        await expect(page.locator(".clues")).toContainText(clue.title);
      const actions = getPublicDemoActions(scenario.id);
      for (let i = 0; i < 3; i++) {
        await expect(page.locator(".action-list li").nth(i)).toContainText(
          scenario.steps[i],
        );
        await expect(page.locator(".action-list li").nth(i)).toContainText(
          actions[i],
        );
      }
      if (width <= 768)
        await expect(page.locator(".mobile-emergency")).toContainText(
          scenario.alertTitle,
        );
      // Label text, clue text, guide text and buttons must stay inside their containers.
      const issues = await page.evaluate(() => {
        const issues: string[] = [];
        if (document.documentElement.scrollWidth > innerWidth)
          issues.push("horizontal scroll");
        for (const el of document.querySelectorAll<HTMLElement>(
          ".situation-text,.clue h4,.clue p,.action-list h3,.action-list p,.emergency-link,.hero-subtitle",
        )) {
          if (el.getClientRects().length && el.scrollWidth > el.clientWidth + 1)
            issues.push(`text overflow: ${el.className || el.tagName}`);
        }
        const cards = [...document.querySelectorAll(".situation-card")].map(
          (el) => el.getBoundingClientRect(),
        );
        for (let a = 0; a < cards.length; a++)
          for (let b = a + 1; b < cards.length; b++) {
            if (
              Math.min(cards[a].right, cards[b].right) >
                Math.max(cards[a].left, cards[b].left) &&
              Math.min(cards[a].bottom, cards[b].bottom) >
                Math.max(cards[a].top, cards[b].top)
            )
              issues.push("overlapping cards");
          }
        return issues;
      });
      expect(issues).toEqual([]);
    }
    await page.locator(".situation-card.already_transferred").click();
    if (width <= 768) {
      const targets = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("a,button,.situation-card")]
          .filter(
            (el) =>
              el.getClientRects().length &&
              !el.closest("dialog") &&
              !el.classList.contains("skip-link"),
          )
          .map((el) => ({
            label: el.textContent?.trim(),
            rect: el.getBoundingClientRect(),
          }))
          .filter((x) => x.rect.width < 44 || x.rect.height < 44)
          .map((x) => ({
            label: x.label,
            width: x.rect.width,
            height: x.rect.height,
          })),
      );
      expect(targets).toEqual([]);
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      const footer = await page.locator(".site-footer").boundingBox();
      const nav = await page.locator(".bottom-nav").boundingBox();
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(nav!.y);
    }
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      document.documentElement.style.scrollBehavior = "auto";
      scrollTo(0, 0);
    });
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    // Hide only the development runtime indicator, which is absent in production.
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}",
    });
    if (width === 390 || width === 1440) {
      const name = width === 390 ? "mobile-390x844" : "desktop-1440x900";
      await page.screenshot({ path: `${output}/${name}.png` });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      writeFileSync(
        `artifacts/ui/axe-${width}.json`,
        JSON.stringify(results, null, 2),
      );
      expect(
        results.violations.map((x) => ({
          id: x.id,
          nodes: x.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
    }
    await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    expect(errors).toEqual([]);
    expect(posts).toEqual([]);
  });
}

test("desktop navigation, dialogs, keyboard, contrast and telephone links", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const item of [
    { name: "홈", id: "home" },
    { name: "사기예방 가이드", id: "guide" },
    { name: "사례로 알아보기", id: "cases" },
    { name: "안전수칙", id: "rules" },
    { name: "도움받기", id: "help" },
  ]) {
    await page
      .getByRole("navigation", { name: "주 메뉴", exact: true })
      .getByRole("link", { name: item.name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
  }
  await page.getByRole("link", { name: /지금 안전하게 확인하기/ }).click();
  await expect(page).toHaveURL(/#guide$/);
  await page.getByRole("button", { name: "소개", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("개인정보 보호");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /금융회사 고객센터/ }).click();
  await expect(page.getByRole("dialog")).toContainText("공식 홈페이지");
  await page.getByRole("button", { name: "확인", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "화면 대비 높이기" }).click();
  await expect(
    page.getByRole("button", { name: "화면 대비 높이기" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "화면 대비 높이기" }).click();
  await page.locator('input[value="before_transfer"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.locator('input[value="already_transferred"]'),
  ).toBeChecked();
  for (const number of [112, 118])
    await expect(
      page.locator(`.desktop-contacts a[href="tel:${number}"]`),
    ).toHaveAttribute("href", `tel:${number}`);
});

test("mobile menu, bottom navigation, dialog focus and telephone click dispatch", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "메뉴", exact: true }),
  ).toHaveAttribute("aria-expanded", "true");
  await page
    .getByRole("navigation", { name: "모바일 주 메뉴" })
    .getByRole("link", { name: "사기예방 가이드" })
    .click();
  await expect(
    page.getByRole("navigation", { name: "모바일 주 메뉴" }),
  ).toHaveCount(0);
  for (const [name, hash] of [
    ["사례보기", "cases"],
    ["안전수칙", "rules"],
    ["도움받기", "help"],
    ["홈", "home"],
  ]) {
    await page
      .getByRole("navigation", { name: "하단 메뉴" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${hash}$`));
  }
  await page.getByRole("button", { name: "더보기", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "더보기", exact: true }),
  ).toBeFocused();
  await page
    .locator(".mobile-emergency")
    .getByRole("button", { name: /금융회사에 연락하기/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "지급정지나 신고를 접수하지 않습니다",
  );
  await page.keyboard.press("Escape");
  // Prevent invoking the OS dialer: validate click dispatch and tel destination only.
  await page.evaluate(() => {
    document.querySelectorAll('a[href^="tel:"]').forEach((el) =>
      el.addEventListener("click", (event) => {
        event.preventDefault();
        el.setAttribute("data-clicked", "true");
      }),
    );
  });
  for (const number of [112, 118]) {
    const link = page.locator(`.mobile-emergency a[href="tel:${number}"]`);
    await link.click();
    await expect(link).toHaveAttribute("data-clicked", "true");
  }
});
