import { expect, test } from "@playwright/test";
import { productionConfigured, signInToProduction } from "./support/production-workspace";

test.skip(
  !productionConfigured,
  "Requires an external deployment and two isolated production test accounts",
);

test("hosted deployment keeps protected navigation usable on mobile", async ({ page }) => {
  await signInToProduction(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeVisible();
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page).toHaveURL(/analytics/);
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
});
