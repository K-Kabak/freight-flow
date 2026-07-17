import { expect, test, type Download } from "@playwright/test";
import { createLiveUser, signIn } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

async function downloadText(download: Download) {
  const stream = await download.createReadStream();
  let contents = "";
  for await (const chunk of stream) contents += chunk.toString();
  return contents;
}

test("CSV respects filters and RLS while the print summary remains private", async ({
  page,
  request,
}) => {
  const owner = await createLiveUser(test.info(), "export-owner");
  const stranger = await createLiveUser(test.info(), "export-stranger");
  const suffix = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  const carrierId = crypto.randomUUID();
  const shipmentId = crypto.randomUUID();
  const includedReference = `CSV-KEEP-${suffix}`;
  const excludedReference = `CSV-FILTERED-${suffix}`;
  const strangerReference = `CSV-STRANGER-${suffix}`;

  expect(
    (
      await owner.api.from("clients").insert({
        id: clientId,
        user_id: owner.user.id,
        company_name: "CSV Client",
        tax_id: "PL7200000001",
        contact_person: "Export Owner",
        email: "csv-client@example.com",
        phone: "+48720100001",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.from("carriers").insert({
        id: carrierId,
        user_id: owner.user.id,
        company_name: "CSV Carrier",
        country: "Poland",
        contact_person: "Export Dispatcher",
        email: "csv-carrier@example.com",
        phone: "+48720100002",
        vehicle_type: "Box truck",
        rating: 5,
      })
    ).error,
  ).toBeNull();

  const shipmentBase = {
    user_id: owner.user.id,
    client_id: clientId,
    carrier_id: carrierId,
    pickup_city: "+SUM(1,1)",
    delivery_city: "Berlin",
    pickup_date: "2026-09-20",
    delivery_date: "2026-09-21",
    client_price: 4500,
    carrier_cost: 3400,
    additional_costs: 100,
    currency: "PLN" as const,
    exchange_rate_to_base: 1,
  };
  expect(
    (
      await owner.api.from("shipments").insert([
        {
          ...shipmentBase,
          id: shipmentId,
          reference_number: includedReference,
          status: "New",
          notes: "=HYPERLINK(\"https://example.invalid\")",
        },
        {
          ...shipmentBase,
          id: crypto.randomUUID(),
          reference_number: excludedReference,
          status: "Delivered",
          notes: "Filtered out",
        },
      ])
    ).error,
  ).toBeNull();

  const strangerClientId = crypto.randomUUID();
  const strangerCarrierId = crypto.randomUUID();
  expect(
    (
      await stranger.api.from("clients").insert({
        id: strangerClientId,
        user_id: stranger.user.id,
        company_name: "Stranger CSV Client",
        tax_id: "PL7200000002",
        contact_person: "Stranger",
        email: "stranger-csv-client@example.com",
        phone: "+48720200001",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await stranger.api.from("carriers").insert({
        id: strangerCarrierId,
        user_id: stranger.user.id,
        company_name: "Stranger CSV Carrier",
        country: "Poland",
        contact_person: "Stranger",
        email: "stranger-csv-carrier@example.com",
        phone: "+48720200002",
        vehicle_type: "Van",
        rating: 4,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await stranger.api.from("shipments").insert({
        ...shipmentBase,
        id: crypto.randomUUID(),
        user_id: stranger.user.id,
        client_id: strangerClientId,
        carrier_id: strangerCarrierId,
        reference_number: strangerReference,
        status: "New",
      })
    ).error,
  ).toBeNull();

  const anonymousExport = await request.get("/shipments/export", { maxRedirects: 0 });
  expect(anonymousExport.status()).toBe(307);
  expect(anonymousExport.headers().location).toContain("/login");

  await signIn(page, owner.email);
  await page.goto(
    `/shipments?q=${encodeURIComponent(includedReference)}&status=New&sort=reference`,
  );
  const ownerDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const ownerCsv = await downloadText(await ownerDownloadPromise);

  expect(ownerCsv.startsWith("\uFEFF")).toBe(true);
  expect(ownerCsv).toContain(includedReference);
  expect(ownerCsv).not.toContain(excludedReference);
  expect(ownerCsv).not.toContain(strangerReference);
  expect(ownerCsv).toContain("\"'+SUM(1,1)\"");
  expect(ownerCsv).toContain("\"'=HYPERLINK(\"\"https://example.invalid\"\")\"");

  await page.goto(`/shipments/${shipmentId}`);
  await page.getByRole("link", { name: "Print summary" }).click();
  await expect(page).toHaveURL(new RegExp(`/shipments/${shipmentId}/summary$`));
  await expect(page.getByRole("heading", { name: includedReference })).toBeVisible();
  await expect(page.getByText("CSV Client")).toBeVisible();
  await expect(page.getByText("CSV Carrier")).toBeVisible();
  await expect(page.getByText("+SUM(1,1)")).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = "true";
    };
  });
  await page.getByRole("button", { name: "Print / Save as PDF" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "true");

  await page.context().clearCookies();
  await signIn(page, stranger.email);
  await page.goto(
    `/shipments?q=${encodeURIComponent(includedReference)}&status=All&sort=reference`,
  );
  const strangerDownloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const strangerCsv = await downloadText(await strangerDownloadPromise);
  expect(strangerCsv).not.toContain(includedReference);
  expect(strangerCsv).not.toContain(excludedReference);

  await page.goto(`/shipments/${shipmentId}/summary`);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
