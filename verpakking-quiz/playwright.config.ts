import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npm run build && npx vite preview --port 5173",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    headless: true,
  },
});
