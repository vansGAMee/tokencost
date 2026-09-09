import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: 1,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "msedge", viewport: { width: 1280, height: 823 }, permissions: ["clipboard-read", "clipboard-write"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium", channel: "msedge", permissions: ["clipboard-read", "clipboard-write"] } },
  ],
});
