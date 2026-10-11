import { test, expect } from "@playwright/test";

test.describe("Verpakkings-Quiz", () => {
  test("should load welcome screen and play quiz", async ({ page }) => {
    await page.goto("/");

    const startBtn = page.locator("#start-btn");
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Check product title appears
    await expect(page.locator("h2")).toBeVisible();

    // Click Verpakking question "Ja"
    await page.click('[data-prop="verpakking"][data-val="true"]');

    // Next product
    await page.click("#next-btn");
    await expect(page.locator("h2")).toBeVisible();
  });
});
