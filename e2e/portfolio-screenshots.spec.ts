import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  livePassword,
  signIn,
  supabaseKey,
  supabaseUrl,
} from "./support/live-workspace";

test.skip(process.env.CAPTURE_PORTFOLIO !== "true", "Run only when refreshing portfolio media");
test.use({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

async function prepareScreenshot(page: import("@playwright/test").Page) {
  await page.locator("nextjs-portal").evaluateAll((portals) => portals.forEach((portal) => portal.remove()));
  await page.waitForTimeout(500);
}

test("capture portfolio screens from an isolated sample workspace", async ({ page }) => {
  const email = `reviewer-${Date.now().toString(36)}@example.com`;
  const api = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  expect((await api.auth.signUp({ email, password: livePassword })).error).toBeNull();
  await signIn(page, email);
  await page.getByRole("button", { name: "Load sample workspace" }).click();
  await expect(page.getByText("10 total shipments")).toBeVisible();
  await page.waitForTimeout(4_500);
  await prepareScreenshot(page);
  await page.screenshot({ path: "public/screenshots/dashboard.png", fullPage: true });

  await page.goto("/shipments");
  await expect(page.getByText("FF-DEMO-010")).toBeVisible();
  await prepareScreenshot(page);
  await page.screenshot({ path: "public/screenshots/shipments.png", fullPage: true });

  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Profit by client" })).toBeVisible();
  await prepareScreenshot(page);
  await page.screenshot({ path: "public/screenshots/analytics.png", fullPage: true });
});
