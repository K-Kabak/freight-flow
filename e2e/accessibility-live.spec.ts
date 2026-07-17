import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test("mobile navigation manages keyboard focus", async ({ page }) => {
  const email = `a11y-${Date.now()}-${test.info().project.name}@example.com`;
  const password = "FreightFlow123!";
  const api = createClient(url, key, { auth: { persistSession: false } });
  expect((await api.auth.signUp({ email, password })).error).toBeNull();

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);

  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.focus();
  await opener.press("Enter");
  const closer = page.getByRole("button", { name: "Close navigation" }).last();
  await expect(closer).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
});
