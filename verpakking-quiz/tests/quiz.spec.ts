import { test, expect } from "@playwright/test";

test.describe("Verpakkings-Quiz", () => {
  test("should load welcome screen and play quiz", async ({ page }) => {
    // Start dev server or preview server or point to built app
    // We can use vite preview or local dev server
    await page.goto("http://localhost:5173");

    // Check title
    await expect(page.locator("header h1")).toHaveText("Verpakkings-Quiz");

    // Click start
    await page.click("#start-btn");

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
