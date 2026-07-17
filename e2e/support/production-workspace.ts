import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";

export const productionConfiguration = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  primaryEmail: process.env.PRODUCTION_E2E_EMAIL,
  primaryPassword: process.env.PRODUCTION_E2E_PASSWORD,
  secondaryEmail: process.env.PRODUCTION_E2E_SECONDARY_EMAIL,
  secondaryPassword: process.env.PRODUCTION_E2E_SECONDARY_PASSWORD,
};

export const productionConfigured =
  process.env.PRODUCTION_E2E === "true" &&
  Object.values(productionConfiguration).every(Boolean);

export async function productionApi(email: string, password: string) {
  const client = createClient(productionConfiguration.url!, productionConfiguration.key!, {
    auth: { persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  expect(error).toBeNull();
  return client;
}

export async function signInToProduction(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(productionConfiguration.primaryEmail!);
  await page.getByLabel("Password").fill(productionConfiguration.primaryPassword!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
}
