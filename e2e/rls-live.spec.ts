import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires the local Supabase stack");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlLWRlbW8iLCJyb2xlIjoiYW5vbiIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const password = "FreightFlow123!";

async function createUser(label: string) {
  const api = createClient(url, key, { auth: { persistSession: false } });
  const suffix = `${Date.now()}-${crypto.randomUUID()}`;
  const { data, error } = await api.auth.signUp({
    email: `${label}-${suffix}@example.com`,
    password,
  });
  expect(error).toBeNull();
  expect(data.user).toBeTruthy();
  return { api, userId: data.user!.id };
}

function clientRow(userId: string, name: string) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    company_name: name,
    tax_id: `PL${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`,
    contact_person: "Client Owner",
    email: "client@example.com",
    phone: "+48123456789",
  };
}

function carrierRow(userId: string, name: string) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    company_name: name,
    country: "Poland",
    contact_person: "Carrier Owner",
    email: "carrier@example.com",
    phone: "+48987654321",
    vehicle_type: "Curtainsider",
    rating: 5,
  };
}

function shipmentRow(
  userId: string,
  clientId: string,
  carrierId: string,
  reference: string,
) {
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    client_id: clientId,
    carrier_id: carrierId,
    reference_number: reference,
    pickup_city: "Warsaw",
    delivery_city: "Berlin",
    pickup_date: "2026-08-01",
    delivery_date: "2026-08-02",
    client_price: 4200,
    carrier_cost: 3300,
    additional_costs: 150,
    currency: "PLN" as const,
    exchange_rate_to_base: 1,
    status: "New" as const,
    notes: null,
  };
}

async function expectHidden(
  api: SupabaseClient,
  table: "profiles" | "clients" | "carriers" | "shipments",
  id: string,
) {
  const result = await api.from(table).select("id").eq("id", id);
  expect(result.error).toBeNull();
  expect(result.data).toEqual([]);
}

test("owners have the intended operation matrix and other users are isolated", async () => {
  const owner = await createUser("matrix-owner");
  const stranger = await createUser("matrix-stranger");

  const ownerProfile = await owner.api
    .from("profiles")
    .select("id")
    .eq("id", owner.userId)
    .single();
  expect(ownerProfile.error).toBeNull();
  await expectHidden(stranger.api, "profiles", owner.userId);

  const profileUpdate = await owner.api
    .from("profiles")
    .update({ full_name: "Matrix Owner" })
    .eq("id", owner.userId)
    .select("id");
  expect(profileUpdate.error).toBeNull();
  expect(profileUpdate.data).toEqual([{ id: owner.userId }]);

  const foreignProfileUpdate = await stranger.api
    .from("profiles")
    .update({ full_name: "Stolen" })
    .eq("id", owner.userId)
    .select("id");
  expect(foreignProfileUpdate.error).toBeNull();
  expect(foreignProfileUpdate.data).toEqual([]);

  expect(
    (await owner.api.from("profiles").update({ email: "changed@example.com" }).eq("id", owner.userId))
      .error,
  ).not.toBeNull();
  expect((await owner.api.from("profiles").delete().eq("id", owner.userId)).error).not.toBeNull();
  expect(
    (await owner.api.from("profiles").insert({ id: crypto.randomUUID(), email: "x@example.com" }))
      .error,
  ).not.toBeNull();

  const client = clientRow(owner.userId, "Matrix Client");
  const carrier = carrierRow(owner.userId, "Matrix Carrier");
  expect((await owner.api.from("clients").insert(client)).error).toBeNull();
  expect((await owner.api.from("carriers").insert(carrier)).error).toBeNull();
  expect(
    (await stranger.api.from("clients").insert(clientRow(owner.userId, "Foreign Insert"))).error,
  ).not.toBeNull();
  expect(
    (await stranger.api.from("carriers").insert(carrierRow(owner.userId, "Foreign Insert"))).error,
  ).not.toBeNull();

  const shipment = shipmentRow(
    owner.userId,
    client.id,
    carrier.id,
    `RLS-${crypto.randomUUID()}`,
  );
  expect((await owner.api.from("shipments").insert(shipment)).error).toBeNull();
  expect(
    (
      await stranger.api.from("shipments").insert(
        shipmentRow(
          owner.userId,
          client.id,
          carrier.id,
          `FOREIGN-${crypto.randomUUID()}`,
        ),
      )
    ).error,
  ).not.toBeNull();

  for (const [table, id] of [
    ["clients", client.id],
    ["carriers", carrier.id],
    ["shipments", shipment.id],
  ] as const) {
    const ownRead = await owner.api.from(table).select("id").eq("id", id).single();
    expect(ownRead.error).toBeNull();
    await expectHidden(stranger.api, table, id);

    const foreignDelete = await stranger.api.from(table).delete().eq("id", id).select("id");
    expect(foreignDelete.error).toBeNull();
    expect(foreignDelete.data).toEqual([]);
  }

  const ownClientUpdate = await owner.api
    .from("clients")
    .update({ company_name: "Updated Matrix Client" })
    .eq("id", client.id)
    .select("id");
  expect(ownClientUpdate.data).toEqual([{ id: client.id }]);
  const ownCarrierUpdate = await owner.api
    .from("carriers")
    .update({ rating: 4 })
    .eq("id", carrier.id)
    .select("id");
  expect(ownCarrierUpdate.data).toEqual([{ id: carrier.id }]);
  const ownShipmentUpdate = await owner.api
    .from("shipments")
    .update({ status: "Accepted" })
    .eq("id", shipment.id)
    .select("id");
  expect(ownShipmentUpdate.data).toEqual([{ id: shipment.id }]);

  for (const [table, id, values] of [
    ["clients", client.id, { company_name: "Stolen" }],
    ["carriers", carrier.id, { rating: 1 }],
    ["shipments", shipment.id, { status: "Cancelled" }],
  ] as const) {
    const result = await stranger.api.from(table).update(values).eq("id", id).select("id");
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  }

  const disposableClient = clientRow(owner.userId, "Disposable Client");
  const disposableCarrier = carrierRow(owner.userId, "Disposable Carrier");
  expect((await owner.api.from("clients").insert(disposableClient)).error).toBeNull();
  expect((await owner.api.from("carriers").insert(disposableCarrier)).error).toBeNull();
  expect(
    (await owner.api.from("clients").delete().eq("id", disposableClient.id).select("id")).data,
  ).toEqual([{ id: disposableClient.id }]);
  expect(
    (await owner.api.from("carriers").delete().eq("id", disposableCarrier.id).select("id")).data,
  ).toEqual([{ id: disposableCarrier.id }]);
  expect((await owner.api.from("shipments").delete().eq("id", shipment.id).select("id")).data).toEqual([
    { id: shipment.id },
  ]);
});

test("cross-tenant relationships and financial invariants cannot be bypassed", async () => {
  const owner = await createUser("invariant-owner");
  const stranger = await createUser("invariant-stranger");
  const client = clientRow(owner.userId, "Invariant Client");
  const carrier = carrierRow(owner.userId, "Invariant Carrier");
  const foreignClient = clientRow(stranger.userId, "Foreign Client");
  const foreignCarrier = carrierRow(stranger.userId, "Foreign Carrier");
  expect((await owner.api.from("clients").insert(client)).error).toBeNull();
  expect((await owner.api.from("carriers").insert(carrier)).error).toBeNull();
  expect((await stranger.api.from("clients").insert(foreignClient)).error).toBeNull();
  expect((await stranger.api.from("carriers").insert(foreignCarrier)).error).toBeNull();

  const invalidRate = {
    ...shipmentRow(owner.userId, client.id, carrier.id, `RATE-${crypto.randomUUID()}`),
    exchange_rate_to_base: 1.25,
  };
  expect((await owner.api.from("shipments").insert(invalidRate)).error).not.toBeNull();

  const crossTenant = shipmentRow(
    owner.userId,
    foreignClient.id,
    foreignCarrier.id,
    `CROSS-${crypto.randomUUID()}`,
  );
  expect((await owner.api.from("shipments").insert(crossTenant)).error).not.toBeNull();

  const valid = shipmentRow(
    owner.userId,
    client.id,
    carrier.id,
    `VALID-${crypto.randomUUID()}`,
  );
  expect((await owner.api.from("shipments").insert(valid)).error).toBeNull();
  expect(
    (
      await owner.api
        .from("shipments")
        .update({ client_id: foreignClient.id })
        .eq("id", valid.id)
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.api
        .from("shipments")
        .update({ carrier_id: foreignCarrier.id })
        .eq("id", valid.id)
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.api.from("shipments").update({ user_id: stranger.userId }).eq("id", valid.id)).error,
  ).not.toBeNull();

  expect(
    (
      await owner.api
        .from("profiles")
        .update({ reporting_currency: "EUR" })
        .eq("id", owner.userId)
    ).error,
  ).not.toBeNull();
  expect((await owner.api.from("clients").delete().eq("id", client.id)).error).not.toBeNull();
  expect((await owner.api.from("carriers").delete().eq("id", carrier.id)).error).not.toBeNull();

  const emptyUser = await createUser("currency-owner");
  expect(
    (
      await emptyUser.api
        .from("profiles")
        .update({ reporting_currency: "EUR" })
        .eq("id", emptyUser.userId)
    ).error,
  ).toBeNull();
});

test("anonymous requests have no business table privileges", async () => {
  const anonymous = createClient(url, key, { auth: { persistSession: false } });

  for (const table of ["profiles", "clients", "carriers", "shipments"] as const) {
    expect((await anonymous.from(table).select("id").limit(1)).error).not.toBeNull();
    expect((await anonymous.from(table).insert({ id: crypto.randomUUID() })).error).not.toBeNull();
    expect(
      (await anonymous.from(table).update({ id: crypto.randomUUID() }).eq("id", crypto.randomUUID()))
        .error,
    ).not.toBeNull();
    expect((await anonymous.from(table).delete().eq("id", crypto.randomUUID())).error).not.toBeNull();
  }
});
