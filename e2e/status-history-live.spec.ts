import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  createLiveUser,
  signIn,
  supabaseKey,
  supabaseUrl,
} from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

test("database records an immutable tenant-isolated status history", async ({ page }) => {
  const owner = await createLiveUser(test.info(), "status-owner");
  const stranger = await createLiveUser(test.info(), "status-stranger");
  const clientId = crypto.randomUUID();
  const carrierId = crypto.randomUUID();
  const shipmentId = crypto.randomUUID();

  expect(
    (
      await owner.api.from("clients").insert({
        id: clientId,
        user_id: owner.user.id,
        company_name: "Audit Client",
        tax_id: "PL7000000001",
        contact_person: "Client Owner",
        email: "audit-client@example.com",
        phone: "+48700100001",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.from("carriers").insert({
        id: carrierId,
        user_id: owner.user.id,
        company_name: "Audit Carrier",
        country: "Poland",
        contact_person: "Dispatcher",
        email: "audit-carrier@example.com",
        phone: "+48700100002",
        vehicle_type: "Curtainsider",
        rating: 5,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.from("shipments").insert({
        id: shipmentId,
        user_id: owner.user.id,
        client_id: clientId,
        carrier_id: carrierId,
        reference_number: `AUDIT-${crypto.randomUUID()}`,
        pickup_city: "Warsaw",
        delivery_city: "Berlin",
        pickup_date: "2026-09-01",
        delivery_date: "2026-09-02",
        client_price: 4200,
        carrier_cost: 3300,
        currency: "PLN",
        exchange_rate_to_base: 1,
        status: "New",
      })
    ).error,
  ).toBeNull();

  const initial = await owner.api
    .from("shipment_status_events")
    .select("id,user_id,changed_by,from_status,to_status,event_kind")
    .eq("shipment_id", shipmentId);
  expect(initial.error).toBeNull();
  expect(initial.data).toHaveLength(1);
  expect(initial.data?.[0]).toMatchObject({
    user_id: owner.user.id,
    changed_by: owner.user.id,
    from_status: null,
    to_status: "New",
    event_kind: "created",
  });

  expect(
    (await owner.api.from("shipments").update({ delivery_city: "Hamburg" }).eq("id", shipmentId))
      .error,
  ).toBeNull();
  expect(
    (await owner.api.from("shipments").update({ status: "New" }).eq("id", shipmentId)).error,
  ).toBeNull();
  expect(
    (await owner.api.from("shipments").update({ status: "Accepted" }).eq("id", shipmentId)).error,
  ).toBeNull();

  const history = await owner.api
    .from("shipment_status_events")
    .select("id,user_id,changed_by,from_status,to_status,event_kind")
    .eq("shipment_id", shipmentId)
    .order("changed_at", { ascending: true });
  expect(history.error).toBeNull();
  expect(history.data).toHaveLength(2);
  expect(history.data?.[1]).toMatchObject({
    user_id: owner.user.id,
    changed_by: owner.user.id,
    from_status: "New",
    to_status: "Accepted",
    event_kind: "changed",
  });

  const hidden = await stranger.api
    .from("shipment_status_events")
    .select("id")
    .eq("shipment_id", shipmentId);
  expect(hidden.error).toBeNull();
  expect(hidden.data).toEqual([]);

  const eventId = history.data![0].id;
  expect(
    (
      await owner.api.from("shipment_status_events").insert({
        shipment_id: shipmentId,
        user_id: owner.user.id,
        changed_by: owner.user.id,
        to_status: "Delivered",
        event_kind: "created",
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.api.from("shipment_status_events").update({ to_status: "Issue" }).eq("id", eventId))
      .error,
  ).not.toBeNull();
  expect(
    (await owner.api.from("shipment_status_events").delete().eq("id", eventId)).error,
  ).not.toBeNull();

  const anonymous = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  expect((await anonymous.from("shipment_status_events").select("id")).error).not.toBeNull();

  await signIn(page, owner.email);
  await page.goto(`/shipments/${shipmentId}`);
  const timeline = page.getByRole("list", { name: "Shipment status history" });
  await expect(timeline.getByRole("listitem")).toHaveCount(2);
  await expect(timeline.getByText("Status changed from New to")).toBeVisible();
  await expect(timeline.getByText(owner.email)).toHaveCount(2);
});
