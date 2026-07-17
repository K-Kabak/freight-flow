import { expect, test } from "@playwright/test";
import { createLiveUser, signIn } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");
test("reporting currency and FX snapshots drive live analytics", async ({ page }) => {
  test.setTimeout(60_000);
  const account = await createLiveUser(test.info(), "reporting");
  const { api, user } = account;
  const suffix = crypto.randomUUID();
  await signIn(page, account.email);
  await expect(page.getByText("No shipments yet.")).toBeVisible();
  await expect(page.getByText("FR-001")).not.toBeVisible();
  await page.goto("/clients");
  await expect(page.getByText("IKEA Distribution")).not.toBeVisible();

  await page.goto("/settings");
  await page.getByLabel("Full name").fill("Reporting User");
  await page.getByLabel("Reporting currency").selectOption("EUR");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();

  const clientId = crypto.randomUUID();
  const carrierId = crypto.randomUUID();
  expect((await api.from("clients").insert({ id:clientId, user_id:user.id, company_name:"FX Client", tax_id:"EU123", contact_person:"Finance", email:"finance@example.com", phone:"123456789" })).error).toBeNull();
  expect((await api.from("carriers").insert({ id:carrierId, user_id:user.id, company_name:"FX Carrier", country:"Germany", contact_person:"Dispatch", email:"dispatch@example.com", phone:"987654321", vehicle_type:"Curtainsider", rating:5 })).error).toBeNull();

  await page.goto("/shipments/new");
  await page.getByLabel("Reference number").fill(`FX-${suffix}`);
  await page.getByLabel("Client", { exact:true }).selectOption(clientId);
  await page.getByLabel("Carrier", { exact:true }).selectOption(carrierId);
  await page.getByLabel("Pickup city").fill("Paris");
  await page.getByLabel("Delivery city").fill("Madrid");
  await page.getByLabel("Pickup date").fill("2026-07-10");
  await page.getByLabel("Delivery date").fill("2026-07-11");
  await page.getByLabel("Client price").fill("1000");
  await page.getByLabel("Carrier cost").fill("700");
  await page.getByLabel("Additional costs").fill("100");
  await page.getByLabel("Currency", { exact:true }).selectOption("USD");
  await page.getByLabel("1 USD in reporting currency (EUR)").fill("0.9");
  await page.getByRole("button", { name:"Create shipment" }).click();
  await expect(page).toHaveURL(/shipments$/);

  await page.goto("/dashboard");
  await expect(page.getByText("€900")).toBeVisible();
  await expect(page.getByText("€180").first()).toBeVisible();
  await page.goto("/analytics");
  await expect(page.getByText("Live profitability analytics in EUR.")).toBeVisible();
  await expect(page.getByText("FX Client").last()).toBeVisible();
  await page.goto("/settings");
  await page.getByLabel("Reporting currency").selectOption("PLN");
  await page.getByRole("button", { name:"Save settings" }).click();
  await expect(
    page.getByRole("main").getByRole("alert").filter({ hasText: /cannot be changed after shipments/ }),
  ).toBeVisible();
});
