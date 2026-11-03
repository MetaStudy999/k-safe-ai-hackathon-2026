import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  PUBLIC_DEMO_SCENARIOS,
  getPublicDemoActions,
} from "../../src/lib/public-demo";

const output = process.env.UI_ARTIFACT_DIR || "artifacts/ui/main-improvements-20261103";
mkdirSync(output, { recursive: true });

test("390px: prevention disclosures, emergency shortcuts and app plus transfer warning", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const storageBefore = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
  const shortcut = page.getByRole("button", { name: "이미 돈도 보냈어요 → 긴급 안내", exact: true });
  for (const situation of PUBLIC_DEMO_SCENARIOS.filter((item) => item.id !== "already_transferred")) {
    await page.locator(`.situation-card.${situation.id}`).click();
    await expect(shortcut).toHaveCount(1);
    await shortcut.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('input[value="already_transferred"]')).toBeChecked();
    await expect(page.locator('input[value="already_transferred"]')).toBeFocused();
    await expect(shortcut).toHaveCount(0);
    await expect(page.locator(".action-list li").first()).toContainText("지급정지");
    if (situation.id === "installed_app") {
      await expect(page.locator('.action-panel [role="alert"]')).toContainText("다른 안전한 전화");
      await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
      await page.locator(".mobile-emergency .bank").click();
      await expect(page.locator("dialog .dialog-call")).not.toHaveAttribute("href");
      await page.getByRole("button", { name: "닫기", exact: true }).click();
    }
  }
  await page.locator(".situation-card.shared_information").click();
  const prevention = page.locator(".additional-prevention");
  await expect(prevention).not.toHaveAttribute("open");
  await prevention.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(prevention).toHaveAttribute("open", "");
  for (const label of ["개인정보노출자 사고예방시스템", "여신거래 안심차단", "비대면 계좌개설 안심차단", "오픈뱅킹 안심차단"]) await expect(prevention).toContainText(label);
  await expect(prevention).toContainText("긴급 지급정지와 별개인 예방서비스");
  await expect(prevention).toContainText("신청·해제를 접수하지 않으며");
  await expect(prevention.locator('a[href="https://www.payinfo.or.kr/"]')).toHaveAttribute("rel", "noopener noreferrer");
  const sources = page.locator(".guide-sources");
  await expect(sources).not.toHaveAttribute("open");
  await sources.locator("summary").click();
  await expect(sources.getByRole("link")).toHaveCount(3);
  await expect(sources).toContainText("자료 발표일 미표시 · 최종 확인일 2026-11-02");
  // Check the expanded links as real touch targets, including prevention links.
  for (const details of [prevention, sources]) {
    expect(await details.getByRole("link").evaluateAll((links) => links.every((link) => {
      const rect = link.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44;
    }))).toBe(true);
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await expect(page.locator("input:not([type=radio]),textarea,select")).toHaveCount(0);
  expect(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)])).toEqual(storageBefore);
  expect(requests).toEqual([]);
});

test("390px: sixth scenario follow-ups, information reset and local transitions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  const storageBefore = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
  const information = page.getByRole("group", { name: "어떤 정보를 알려주셨나요?" });
  const followUps = page.getByRole("group", { name: "링크 클릭 후 추가로 한 행동" });
  await expect(page.locator('.situation-grid input[type="radio"]')).toHaveCount(6);
  await page.locator(".situation-card.shared_information").click();
  await information.getByRole("radio", { name: "카드정보", exact: true }).check();
  await page.locator(".situation-card.clicked_link").click();
  await expect(information).toHaveCount(0);
  await expect(followUps.getByRole("button")).toHaveCount(3);
  await expect(page.locator(".message-example a")).toHaveCount(0);
  await expect(page.locator(".action-list")).toContainText("안전이 확인된 것도 아닙니다");
  await followUps.getByRole("button", { name: "정보도 입력했어요", exact: true }).click();
  await expect(page.locator('input[value="shared_information"]')).toBeChecked();
  await expect(page.locator('input[value="shared_information"]')).toBeFocused();
  await expect(information.locator(":checked")).toHaveCount(0);
  await expect(page.locator(".action-list")).toContainText("정보 종류를 고르면");
  for (const [label, target] of [["앱도 설치했어요", "installed_app"], ["이미 돈도 보냈어요 → 긴급 안내", "already_transferred"]]) {
    await page.locator(".situation-card.clicked_link").click();
    await followUps.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(`input[value="${target}"]`)).toBeChecked();
    await expect(page.locator(`input[value="${target}"]`)).toBeFocused();
    if (target === "installed_app") {
      await expect(page.locator(".official-contacts a[href]")).toHaveCount(0);
      await expect(page.locator(".action-list li").first()).toContainText("연결");
    } else {
      await expect(page.locator(".action-list li").first()).toContainText("지급정지");
    }
  }
  await page.locator(".situation-card.clicked_link").click();
  await expect(page.locator("input:not([type=radio]),textarea,select")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)])).toEqual(storageBefore);
  expect(requests).toEqual([]);
});

for (const width of [320, 390, 1440]) {
  test(`${width}px: information kinds, keyboard, reset and no collection`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    const storageBefore = await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)]);
    const group = page.getByRole("group", { name: "어떤 정보를 알려주셨나요?" });
    await expect(group).toHaveCount(0);
    await page.locator(".situation-card.shared_information").click();
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio")).toHaveCount(4);
    await expect(group.locator(":checked")).toHaveCount(0);
    await expect(page.locator(".action-list")).toContainText("정보 종류를 고르면");
    await expect(page.locator(".action-list")).not.toContainText("인증번호");
    await expect(page.locator(".information-priority")).toContainText("이미 송금했거나 모르는 계좌 출금이 있다면 112 또는 금융회사에 즉시 연락해 지급정지를 요청");
    await expect(page.locator("input:not([type=radio]),textarea,select")).toHaveCount(0);

    await group.getByRole("radio", { name: "계좌번호만", exact: true }).focus();
    await page.keyboard.press("Space");
    await expect(page.locator(".action-list")).toContainText("송금이 완료되거나 계좌가 탈취됐다고 단정할 수 없습니다");
    await page.keyboard.press("ArrowDown");
    await expect(group.getByRole("radio", { name: "신분증·주민등록번호", exact: true })).toBeChecked();
    await expect(page.locator(".action-list")).toContainText("개인정보노출자 사고예방시스템");
    await expect(page.getByRole("link", { name: "금융감독원 개인정보노출자 사고예방시스템 안내" })).toHaveAttribute("href", "https://pd.fss.or.kr/");
    await page.keyboard.press("ArrowDown");
    await expect(group.getByRole("radio", { name: "비밀번호·인증번호", exact: true })).toBeChecked();
    await expect(page.locator(".action-list")).toContainText("즉시 보호 조치를 요청");
    await expect(page.locator(".action-list")).toContainText("안전한 기기");
    await expect(page.locator(".action-list")).toContainText("비밀번호 변경만으로 해결되는 것은 아닙니다");
    await expect(page.getByRole("link", { name: "금융감독원 개인정보노출자 사고예방시스템 안내", exact: true })).toHaveCount(0);
    await page.keyboard.press("ArrowDown");
    await expect(group.getByRole("radio", { name: "카드정보", exact: true })).toBeChecked();
    await expect(page.locator(".action-list")).toContainText("사용정지·재발급");
    await expect(page.locator(".action-list")).toContainText("본인이 사용하지 않은 승인·결제");
    await expect(page.locator(".action-list")).not.toContainText(/환급|보장|승인취소/);
    await expect(page.locator(".information-guide .information-note").last()).toContainText("실제 신고나 보호 조치가 접수되는 것은 아닙니다");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".information-options label").evaluateAll((labels) => labels.every((label) => label.getBoundingClientRect().height >= 44))).toBe(true);

    await page.getByRole("button", { name: /의심 앱도 설치했다면/ }).click();
    await expect(group).toHaveCount(0);
    await expect(page.locator('input[value="installed_app"]')).toBeChecked();
    await expect(page.locator(".official-contacts a[href]")).toHaveCount(0);
    await page.locator(".situation-card.shared_information").click();
    await expect(group.locator(":checked")).toHaveCount(0);
    await expect(page.locator(".action-list")).toContainText("정보 종류를 고르면");
    await group.getByRole("radio", { name: "카드정보", exact: true }).check();
    await page.locator(".situation-card.already_transferred").click();
    await expect(group).toHaveCount(0);
    await expect(page.locator(".action-list li").first()).toContainText("지급정지");
    await expect(page.locator('.desktop-contacts a[href="tel:1394"]')).toHaveCount(1);
    await page.locator(".situation-card.shared_information").click();
    await expect(group.locator(":checked")).toHaveCount(0);
    expect(await page.evaluate(() => [JSON.stringify(localStorage), JSON.stringify(sessionStorage)])).toEqual(storageBefore);
    expect(requests).toEqual([]);
  });
}

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
    await expect(page.locator('input[name="situation"]:checked')).toHaveCount(0);
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
        `${output}/axe-${width}.json`,
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
  await page.getByRole("link", { name: /내 상황 선택하기/ }).click();
  await expect(page).toHaveURL(/#guide$/);
  await page.getByRole("button", { name: "소개", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("개인정보 보호");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator(".desktop-contacts").getByRole("button", { name: /금융회사 연락 방법 보기/ }).click();
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
    ["긴급전화", "help"],
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
    .getByRole("button", { name: /금융회사 연락 방법 보기/ })
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
