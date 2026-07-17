import { expect, test } from "@playwright/test";
import { createLiveUser, signIn } from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

test("user manages directories and protected relationships", async ({ page }) => {
  test.setTimeout(60_000);
  const account = await createLiveUser(test.info(), "directory");
  const suffix = crypto.randomUUID();
  await signIn(page, account.email);

  await page.goto("/clients/new");
  await page.getByLabel("Company name").fill("Stage Three Client");
  await page.getByLabel("Tax / VAT ID").fill("PL1234567890");
  await page.getByLabel("Contact person").fill("Client Contact");
  await page.getByLabel("Email").fill("client@example.com");
  await page.getByLabel("Phone").fill("+48111222333");
  await page.getByRole("button", { name: "Create client" }).click();
  await expect(page.getByText("Stage Three Client")).toBeVisible();
  await page.getByText("Stage Three Client").click();
  await page.getByLabel("Company name").fill("Updated Stage Three Client");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Updated Stage Three Client")).toBeVisible();

  await page.goto("/carriers/new");
  await page.getByLabel("Company name").fill("Stage Three Carrier");
  await page.getByLabel("Country").fill("Poland");
  await page.getByLabel("Contact person").fill("Carrier Contact");
  await page.getByLabel("Email").fill("carrier@example.com");
  await page.getByLabel("Phone").fill("+48444555666");
  await page.getByLabel("Vehicle type").fill("Mega trailer");
  await page.getByLabel("Rating").selectOption("4");
  await page.getByRole("button", { name: "Create carrier" }).click();
  await expect(page.getByText("Stage Three Carrier")).toBeVisible();
  await page.getByText("Stage Three Carrier").click();
  await page.getByLabel("Vehicle type").fill("Refrigerated trailer");
  await page.getByLabel("Rating").selectOption("5");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Refrigerated trailer")).toBeVisible();

  await page.goto("/shipments/new");
  await page.getByLabel("Reference number").fill(`DIR-${suffix}`);
  await page
    .getByLabel("Client", { exact: true })
    .selectOption({ label: "Updated Stage Three Client" });
  await page
    .getByLabel("Carrier", { exact: true })
    .selectOption({ label: "Stage Three Carrier" });
  await page.getByLabel("Pickup city").fill("Warsaw");
  await page.getByLabel("Delivery city").fill("Berlin");
  await page.getByLabel("Pickup date").fill("2026-09-01");
  await page.getByLabel("Delivery date").fill("2026-09-02");
  await page.getByLabel("Client price").fill("2000");
  await page.getByLabel("Carrier cost").fill("1500");
  await page.getByLabel("Additional costs").fill("100");
  await page.getByRole("button", { name: "Create shipment" }).click();
  await expect(page.getByText(`DIR-${suffix}`)).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/clients");
  await page.getByLabel("Delete client").click();
  await expect(page.getByText("Reassign or delete this client's shipments first.")).toBeVisible();
  await page.goto("/carriers");
  await page.getByLabel("Delete carrier").click();
  await expect(page.getByText("Reassign or delete this carrier's shipments first.")).toBeVisible();

  await page.goto("/shipments");
  await page.getByLabel("Delete shipment").click();
  await expect(page.getByText(`DIR-${suffix}`)).not.toBeVisible();
  await page.goto("/clients");
  await page.getByLabel("Delete client").click();
  await expect(page.getByText("Updated Stage Three Client")).not.toBeVisible();
  await page.goto("/carriers");
  await page.getByLabel("Delete carrier").click();
  await expect(page.getByText("Stage Three Carrier")).not.toBeVisible();
});
