import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  productionApi,
  productionConfiguration,
  productionConfigured,
  signInToProduction,
} from "./support/production-workspace";

test.skip(
  !productionConfigured,
  "Requires an external deployment and two isolated production test accounts",
);

async function cleanup(
  client: SupabaseClient,
  reference: string,
  clientName: string,
  carrierName: string,
) {
  await client.from("shipments").delete().eq("reference_number", reference);
  await client.from("clients").delete().eq("company_name", clientName);
  await client.from("carriers").delete().eq("company_name", carrierName);
}

test("hosted deployment supports the critical private workspace flow", async ({ page }) => {
  test.setTimeout(90_000);
  const suffix = crypto.randomUUID();
  const reference = `PROD-${suffix}`;
  const clientName = `Production Client ${suffix}`;
  const carrierName = `Production Carrier ${suffix}`;
  const [primary, secondary] = await Promise.all([
    productionApi(
      productionConfiguration.primaryEmail!,
      productionConfiguration.primaryPassword!,
    ),
    productionApi(
      productionConfiguration.secondaryEmail!,
      productionConfiguration.secondaryPassword!,
    ),
  ]);

  try {
    await signInToProduction(page);

    await page.goto("/clients/new");
    await page.getByLabel("Company name").fill(clientName);
    await page.getByLabel("Tax / VAT ID").fill("PL9000000001");
    await page.getByLabel("Contact person").fill("Portfolio Test");
    await page.getByLabel("Email").fill("portfolio-client@example.com");
    await page.getByLabel("Phone").fill("+48500900001");
    await page.getByRole("button", { name: "Create client" }).click();
    await expect(page.getByText(clientName)).toBeVisible();

    await page.goto("/carriers/new");
    await page.getByLabel("Company name").fill(carrierName);
    await page.getByLabel("Country").fill("Poland");
    await page.getByLabel("Contact person").fill("Portfolio Dispatcher");
    await page.getByLabel("Email").fill("portfolio-carrier@example.com");
    await page.getByLabel("Phone").fill("+48500900002");
    await page.getByLabel("Vehicle type").fill("Curtainsider");
    await page.getByLabel("Rating").selectOption("5");
    await page.getByRole("button", { name: "Create carrier" }).click();
    await expect(page.getByText(carrierName)).toBeVisible();

    const [{ data: client }, { data: carrier }] = await Promise.all([
      primary.from("clients").select("id").eq("company_name", clientName).single(),
      primary.from("carriers").select("id").eq("company_name", carrierName).single(),
    ]);
    expect(client).toBeTruthy();
    expect(carrier).toBeTruthy();

    await page.goto("/shipments/new");
    await page.getByLabel("Reference number").fill(reference);
    await page.getByLabel("Client", { exact: true }).selectOption({ label: clientName });
    await page.getByLabel("Carrier", { exact: true }).selectOption({ label: carrierName });
    await page.getByLabel("Pickup city").fill("Warsaw");
    await page.getByLabel("Delivery city").fill("Berlin");
    await page.getByLabel("Pickup date").fill("2027-01-12");
    await page.getByLabel("Delivery date").fill("2027-01-14");
    await page.getByLabel("Client price").fill("7200");
    await page.getByLabel("Carrier cost").fill("5400");
    await page.getByLabel("Additional costs").fill("180");
    await page.getByRole("button", { name: "Create shipment" }).click();
    await expect(page.getByText(reference)).toBeVisible();

    const foreignRead = await secondary.from("clients").select("id").eq("id", client!.id);
    expect(foreignRead.error).toBeNull();
    expect(foreignRead.data).toEqual([]);
    const foreignUpdate = await secondary
      .from("clients")
      .update({ company_name: "Forbidden update" })
      .eq("id", client!.id)
      .select("id");
    expect(foreignUpdate.error).toBeNull();
    expect(foreignUpdate.data).toEqual([]);
    const foreignDelete = await secondary
      .from("clients")
      .delete()
      .eq("id", client!.id)
      .select("id");
    expect(foreignDelete.error).toBeNull();
    expect(foreignDelete.data).toEqual([]);
    const crossTenantInsert = await secondary.from("shipments").insert({
      user_id: (await secondary.auth.getUser()).data.user!.id,
      client_id: client!.id,
      carrier_id: carrier!.id,
      reference_number: `FORBIDDEN-${suffix}`,
      pickup_city: "Warsaw",
      delivery_city: "Berlin",
      pickup_date: "2027-01-12",
      delivery_date: "2027-01-14",
      client_price: 1000,
      carrier_cost: 800,
      currency: "PLN",
      exchange_rate_to_base: 1,
    });
    expect(crossTenantInsert.error).not.toBeNull();

    await page.getByText(reference).click();
    await page.getByLabel("Delivery city").fill("Hamburg");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Hamburg")).toBeVisible();
    await page.getByLabel("Shipment status").selectOption("Delivered");
    await expect(page.getByText("Status updated")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(reference)).toBeVisible();
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Profit by client" })).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/shipments");
    await page.getByLabel("Delete shipment").click();
    await expect(page.getByText(reference)).not.toBeVisible();
    await page.goto("/clients");
    await page.getByLabel("Delete client").click();
    await expect(page.getByText(clientName)).not.toBeVisible();
    await page.goto("/carriers");
    await page.getByLabel("Delete carrier").click();
    await expect(page.getByText(carrierName)).not.toBeVisible();
  } finally {
    await cleanup(primary, reference, clientName, carrierName);
  }
});
