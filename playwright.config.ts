import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: "desktop",
      testIgnore: [
        /rls-live\.spec\.ts/,
        /accessibility-live\.spec\.ts/,
        /production-mobile-live\.spec\.ts/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: [
        /smoke\.spec\.ts/,
        /accessibility-live\.spec\.ts/,
        /production-mobile-live\.spec\.ts/,
      ],
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "api",
      testMatch: /rls-live\.spec\.ts/,
    },
  ],
});
