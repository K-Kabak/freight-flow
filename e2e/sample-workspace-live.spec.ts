import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import { createLiveUser, signIn, supabaseKey, supabaseUrl } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

test("user creates an isolated sample workspace once", async ({ page }) => {
  const anonymous = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const anonymousResult = await anonymous.rpc("create_sample_workspace");
  expect(anonymousResult.error).not.toBeNull();

  const account = await createLiveUser(test.info(), "sample-workspace");
  await signIn(page, account.email);
  await expect(page.getByRole("heading", { name: "Explore a complete sample workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Load sample workspace" }).click();
  await expect(page.getByText("Sample workspace created")).toBeVisible();
  await expect(page.getByText("10 total shipments")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explore a complete sample workspace" })).not.toBeVisible();

  await page.goto("/shipments");
  await expect(page.getByText("FF-DEMO-010")).toBeVisible();
  await page.goto("/clients");
  await expect(page.getByText("Nordic Home Retail")).toBeVisible();
  await page.goto("/carriers");
  await expect(page.getByText("Vistula Transport")).toBeVisible();
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Profit by client" })).toBeVisible();

  const secondAttempt = await account.api.rpc("create_sample_workspace");
  expect(secondAttempt.error?.code).toBe("23514");
});
