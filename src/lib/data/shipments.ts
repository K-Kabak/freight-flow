import { carriers as demoCarriers, clients as demoClients, shipments as demoShipments } from "@/data/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Shipment, ShipmentDocument, ShipmentStatusEvent } from "@/types";
import type { Database } from "@/types/database";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type RelatedShipment = Pick<
  ShipmentRow,
  | "id"
  | "client_id"
  | "carrier_id"
  | "reference_number"
  | "pickup_city"
  | "delivery_city"
  | "pickup_date"
  | "delivery_date"
  | "client_price"
  | "carrier_cost"
  | "additional_costs"
  | "profit"
  | "margin_percent"
  | "currency"
  | "exchange_rate_to_base"
  | "status"
  | "notes"
> & {
  clients: { company_name: string } | null;
  carriers: { company_name: string } | null;
};

export type DirectoryOption = { id: string; companyName: string };
export type ShipmentQuery = {
  q?: string;
  status?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

const shipmentSelection =
  "id, client_id, carrier_id, reference_number, pickup_city, delivery_city, pickup_date, delivery_date, client_price, carrier_cost, additional_costs, profit, margin_percent, currency, exchange_rate_to_base, status, notes, clients(company_name), carriers(company_name)";

function mapShipment(row: RelatedShipment): Shipment {
  return {
    id: row.id,
    referenceNumber: row.reference_number,
    pickupCity: row.pickup_city,
    deliveryCity: row.delivery_city,
    clientId: row.client_id,
    client: row.clients?.company_name ?? "Unknown client",
    carrierId: row.carrier_id,
    carrier: row.carriers?.company_name ?? "Unknown carrier",
    pickupDate: row.pickup_date,
    deliveryDate: row.delivery_date,
    clientPrice: Number(row.client_price),
    carrierCost: Number(row.carrier_cost),
    additionalCosts: Number(row.additional_costs),
    profit: Number(row.profit),
    marginPercent: Number(row.margin_percent),
    currency: row.currency,
    exchangeRateToBase: Number(row.exchange_rate_to_base),
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

export async function getShipments(
  query?: ShipmentQuery,
): Promise<{
  shipments: Shipment[];
  total: number;
  page: number;
  pageCount: number;
  isDemo: boolean;
}> {
  const supabase = await createClient();
  const page = Math.max(1, query?.page ?? 1);
  const pageSize = query?.pageSize ?? 10;
  if (!supabase) {
    const filtered = demoShipments.filter(
      (item) =>
        (!query?.status || query.status === "All" || item.status === query.status) &&
        `${item.referenceNumber} ${item.client} ${item.pickupCity} ${item.deliveryCity}`
          .toLowerCase()
          .includes((query?.q ?? "").toLowerCase()),
    );
    return {
      shipments: query ? filtered.slice((page - 1) * pageSize, page * pageSize) : filtered,
      total: filtered.length,
      page,
      pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
      isDemo: true,
    };
  }

  let request = supabase.from("shipments").select(shipmentSelection, { count: "exact" });
  if (query?.status && query.status !== "All") {
    request = request.eq("status", query.status as ShipmentRow["status"]);
  }
  if (query?.q) {
    const term = query.q.replace(/[,%()]/g, "");
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .ilike("company_name", `%${term}%`);
    const clientFilter = matchingClients?.length
      ? `,client_id.in.(${matchingClients.map((client) => client.id).join(",")})`
      : "";
    request = request.or(
      `reference_number.ilike.%${term}%,pickup_city.ilike.%${term}%,delivery_city.ilike.%${term}%${clientFilter}`,
    );
  }

  const sortFields: Record<string, keyof ShipmentRow> = {
    reference: "reference_number",
    profit: "profit",
    status: "status",
    pickup: "pickup_date",
  };
  const sort = sortFields[query?.sort ?? "pickup"] ?? "pickup_date";
  request = request.order(sort, { ascending: sort !== "pickup_date" });
  if (query) request = request.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await request;
  if (error) throw new Error("Unable to load shipments");
  const total = count ?? data?.length ?? 0;
  return {
    shipments: (data as RelatedShipment[]).map(mapShipment),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    isDemo: false,
  };
}

export async function getRelatedShipments(filter: {
  clientId?: string;
  carrierId?: string;
}): Promise<{ shipments: Shipment[]; isDemo: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      shipments: demoShipments.filter(
        (item) =>
          (!filter.clientId || item.clientId === filter.clientId) &&
          (!filter.carrierId || item.carrierId === filter.carrierId),
      ),
      isDemo: true,
    };
  }

  let request = supabase.from("shipments").select(shipmentSelection);
  if (filter.clientId) request = request.eq("client_id", filter.clientId);
  if (filter.carrierId) request = request.eq("carrier_id", filter.carrierId);
  const { data, error } = await request.order("pickup_date", { ascending: false });
  if (error) throw new Error("Unable to load related shipments");
  return { shipments: (data as RelatedShipment[]).map(mapShipment), isDemo: false };
}

export async function getShipment(
  id: string,
): Promise<{ shipment: Shipment | null; isDemo: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    return { shipment: demoShipments.find((item) => item.id === id) ?? null, isDemo: true };
  }
  const { data, error } = await supabase
    .from("shipments")
    .select(shipmentSelection)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Unable to load shipment");
  return { shipment: data ? mapShipment(data as RelatedShipment) : null, isDemo: false };
}

type StatusEventRow = Database["public"]["Tables"]["shipment_status_events"]["Row"] & {
  actor: { full_name: string; email: string } | null;
};

export async function getShipmentStatusEvents(
  shipmentId: string,
): Promise<ShipmentStatusEvent[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shipment_status_events")
    .select(
      "id, shipment_id, from_status, to_status, event_kind, changed_at, changed_by, actor:profiles!shipment_status_events_changed_by_fkey(full_name, email)",
    )
    .eq("shipment_id", shipmentId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error("Unable to load shipment status history");

  return ((data ?? []) as StatusEventRow[]).map((event) => ({
    id: event.id,
    shipmentId: event.shipment_id,
    fromStatus: event.from_status,
    toStatus: event.to_status,
    kind: event.event_kind,
    changedAt: event.changed_at,
    actor: event.actor
      ? { fullName: event.actor.full_name, email: event.actor.email }
      : null,
  }));
}

export async function getShipmentDocuments(shipmentId: string): Promise<ShipmentDocument[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("shipment_documents")
    .select(
      "id,shipment_id,storage_path,original_name,mime_type,size_bytes,upload_status,created_at,uploaded_at",
    )
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw new Error("Unable to load shipment documents");

  return (data ?? []).map((document) => ({
    id: document.id,
    shipmentId: document.shipment_id,
    storagePath: document.storage_path,
    originalName: document.original_name,
    mimeType: document.mime_type,
    sizeBytes: document.size_bytes,
    status: document.upload_status,
    createdAt: document.created_at,
    uploadedAt: document.uploaded_at,
  }));
}

export async function getDirectoryOptions(): Promise<{
  clients: DirectoryOption[];
  carriers: DirectoryOption[];
  reportingCurrency: "PLN" | "EUR" | "USD";
  isDemo: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      clients: demoClients.map((item) => ({ id: item.id, companyName: item.companyName })),
      carriers: demoCarriers.map((item) => ({ id: item.id, companyName: item.companyName })),
      reportingCurrency: "PLN",
      isDemo: true,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unable to load shipment directory");
  const [
    { data: clients, error: clientError },
    { data: carriers, error: carrierError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"),
    supabase.from("carriers").select("id, company_name").order("company_name"),
    supabase.from("profiles").select("reporting_currency").eq("id", user.id).single(),
  ]);
  if (clientError || carrierError || profileError) {
    throw new Error("Unable to load shipment directory");
  }
  return {
    clients: (clients ?? []).map((item) => ({ id: item.id, companyName: item.company_name })),
    carriers: (carriers ?? []).map((item) => ({ id: item.id, companyName: item.company_name })),
    reportingCurrency: profile.reporting_currency,
    isDemo: false,
  };
}
