import { expect, test } from "@playwright/test";
import { createLiveUser, signIn } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

test("authenticated user completes the shipment lifecycle", async ({ page }) => {
  const account = await createLiveUser(test.info(), "shipment");
  const reference = `E2E-${crypto.randomUUID()}`;
  await signIn(page, account.email);

  await page.goto("/shipments/new");
  await page.getByRole("button", { name: "Create starter directory" }).click();
  await expect(page.getByText("Starter directory created")).toBeVisible();
  await page.getByLabel("Reference number").fill(reference);
  await page.getByLabel("Client", { exact: true }).selectOption({ label: "Starter Client" });
  await page.getByLabel("Carrier", { exact: true }).selectOption({ label: "Starter Carrier" });
  await page.getByLabel("Pickup city").fill("Warsaw");
  await page.getByLabel("Delivery city").fill("Berlin");
  await page.getByLabel("Pickup date").fill("2026-08-02");
  await page.getByLabel("Delivery date").fill("2026-08-01");
  await page.getByLabel("Client price").fill("4200");
  await page.getByLabel("Carrier cost").fill("3300");
  await page.getByLabel("Additional costs").fill("150");
  await page.getByRole("button", { name: "Create shipment" }).click();
  await expect(page.getByText("Delivery cannot precede pickup")).toBeVisible();
  await page.getByLabel("Delivery date").fill("2026-08-03");
  await page.getByRole("button", { name: "Create shipment" }).click();

  await expect(page).toHaveURL(/shipments$/);
  await expect(page.getByText(reference)).toBeVisible();
  await page.goto("/shipments?q=Starter+Client&status=New&sort=reference");
  await expect(page.getByText(reference)).toBeVisible();
  await page.goto(`/shipments?q=${encodeURIComponent(reference)}&status=Cancelled&sort=reference`);
  await expect(page.getByText(reference)).not.toBeVisible();
  await page.goto("/shipments");

  await page.getByText(reference).click();
  await page.getByLabel("Delivery city").fill("Hamburg");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page).toHaveURL(/shipments$/);
  await expect(page.getByText("Hamburg")).toBeVisible();
  await page.getByLabel("Shipment status").selectOption("Delivered");
  await expect(page.getByText("Status updated")).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Delete shipment").click();
  await expect(page.getByText(reference)).not.toBeVisible();
});
