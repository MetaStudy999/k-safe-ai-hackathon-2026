import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`${width}px: unselected entry, visible urgent action and action-first guidance`, async ({ page }) => {
    const height = width <= 768 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('input[name="situation"]:checked')).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("아직 상황을 선택하지 않았습니다");
    await expect(page.locator(".detail-grid")).toBeHidden();
    const urgent = await page.locator('.mobile-emergency a[href="tel:112"]').boundingBox();
    expect(urgent!.y).toBeGreaterThan(0);
    expect(urgent!.y + urgent!.height).toBeLessThanOrEqual(height - (width <= 768 ? 72 : 0));
    if (width === 390 || width === 1440) await page.screenshot({ path: `${process.env.UI_ARTIFACT_DIR || "artifacts/ui/main-improvements-20261103"}/entry-${width}.png` });
    await page.locator(".situation-card.already_transferred").click();
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); });
    const selectedUrgent = await page.locator('.mobile-emergency a[href="tel:112"]').boundingBox();
    expect(selectedUrgent!.y + selectedUrgent!.height).toBeLessThanOrEqual(height - (width <= 768 ? 72 : 0));
    await page.locator(".situation-card.shared_information").click();
    const action = await page.locator(".action-panel").boundingBox();
    const example = await page.locator(".case-panel").boundingBox();
    const information = await page.locator(".information-options").boundingBox();
    if (width <= 1100) {
      expect(action!.y).toBeLessThan(example!.y);
      expect(information!.y).toBeLessThan(example!.y);
    } else {
      expect(action!.x).toBeLessThan(example!.x);
    }
    expect(await page.locator(".action-list p").evaluateAll((items) => items.every((e) => Number.parseFloat(getComputedStyle(e).fontSize) >= 16))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(".mobile-emergency .bank").click();
    await expect(page.getByRole("dialog")).toContainText("공식 홈페이지");
    await page.keyboard.press("Escape");
  });
}

test("mobile display preferences remain usable with enlarged guidance", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "모바일 주 메뉴" });
  for (const name of ["화면 대비 높이기", "글자 크게 보기"]) {
    const control = menu.getByRole("button", { name, exact: true });
    await control.click();
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await page.locator(".situation-card.shared_information").click();
  await page.getByRole("radio", { name: "비밀번호·인증번호", exact: true }).check();
  expect(await page.locator(".action-list p").evaluateAll((items) => items.every((e) => Number.parseFloat(getComputedStyle(e).fontSize) >= 18))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator(".action-list")).toContainText("비밀번호 변경만으로 해결되는 것은 아닙니다");
});
