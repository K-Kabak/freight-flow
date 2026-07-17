import { expect, test } from "@playwright/test";
import { createLiveUser, signIn } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

test("mobile navigation manages keyboard focus", async ({ page }) => {
  const account = await createLiveUser(test.info(), "a11y");
  await signIn(page, account.email);

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
