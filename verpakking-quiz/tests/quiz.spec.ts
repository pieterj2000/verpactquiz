import { test, expect } from "@playwright/test";

test.describe("Verpakkings-Quiz", () => {
  test("should load welcome screen and play quiz", async ({ page }) => {
    await page.goto("/");

    // Wait for start button to be visible
    const startBtn = page.locator("#start-btn");
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    // Check question appears
    await expect(page.locator(".question-text")).toBeVisible();

    // Answer question
    await page.click(".option-btn:first-child");

    // Check feedback
    await expect(page.locator(".feedback-box")).toBeVisible();

    // Next question
    await page.click("#next-btn");
    await expect(page.locator(".question-text")).toBeVisible();
  });
});
