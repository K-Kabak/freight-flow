import { carriers as demoCarriers, clients as demoClients } from "@/data/mock-data";
import { getRelatedShipments } from "@/lib/data/shipments";
import { calculateClientFinancials } from "@/lib/reporting-calculations";
import { createClient } from "@/lib/supabase/server";
import type { Carrier, Client, Shipment } from "@/types";
import type { Database } from "@/types/database";

type ClientRow = Pick<
  Database["public"]["Tables"]["clients"]["Row"],
  "id" | "company_name" | "tax_id" | "contact_person" | "email" | "phone"
>;
type CarrierRow = Pick<
  Database["public"]["Tables"]["carriers"]["Row"],
  | "id"
  | "company_name"
  | "country"
  | "contact_person"
  | "email"
  | "phone"
  | "vehicle_type"
  | "rating"
>;
type FinancialShipmentRow = Pick<
  Database["public"]["Tables"]["shipments"]["Row"],
  "client_id" | "client_price" | "carrier_cost" | "additional_costs" | "exchange_rate_to_base"
>;
type CarrierShipmentRow = Pick<
  Database["public"]["Tables"]["shipments"]["Row"],
  "carrier_id" | "status"
>;

export type DirectoryQuery = {
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};
export type DirectoryPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
  isDemo: boolean;
};

function clientStats(row: ClientRow, shipments: FinancialShipmentRow[]): Client {
  const related = shipments
    .filter((shipment) => shipment.client_id === row.id)
    .map((shipment) => ({
      clientPrice: Number(shipment.client_price),
      carrierCost: Number(shipment.carrier_cost),
      additionalCosts: Number(shipment.additional_costs),
      exchangeRateToBase: Number(shipment.exchange_rate_to_base),
    }));
  return {
    id: row.id,
    companyName: row.company_name,
    taxId: row.tax_id,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    ...calculateClientFinancials(related),
  };
}

function carrierStats(row: CarrierRow, shipments: CarrierShipmentRow[]): Carrier {
  const completedShipments = shipments.filter(
    (shipment) => shipment.carrier_id === row.id && shipment.status === "Delivered",
  ).length;
  return {
    id: row.id,
    companyName: row.company_name,
    country: row.country,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    vehicleType: row.vehicle_type,
    rating: row.rating,
    completedShipments,
  };
}

function clientDetail(row: ClientRow, shipments: Shipment[]): Client {
  return {
    id: row.id,
    companyName: row.company_name,
    taxId: row.tax_id,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    ...calculateClientFinancials(shipments),
  };
}

function carrierDetail(row: CarrierRow, shipments: Shipment[]): Carrier {
  return {
    id: row.id,
    companyName: row.company_name,
    country: row.country,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    vehicleType: row.vehicle_type,
    rating: row.rating,
    completedShipments: shipments.filter((shipment) => shipment.status === "Delivered").length,
  };
}

function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
  isDemo: boolean,
): DirectoryPage<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    total: items.length,
    page: current,
    pageCount,
    isDemo,
  };
}

export async function getClients(query: DirectoryQuery = {}): Promise<DirectoryPage<Client>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const q = (query.q ?? "").toLowerCase();
  const supabase = await createClient();
  let items: Client[];
  if (!supabase) {
    items = demoClients;
  } else {
    const [{ data: rows, error }, { data: shipments, error: shipmentError }] =
      await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, tax_id, contact_person, email, phone"),
        supabase
          .from("shipments")
          .select(
            "client_id, client_price, carrier_cost, additional_costs, exchange_rate_to_base",
          ),
      ]);
    if (error || shipmentError) throw new Error("Unable to load clients");
    items = (rows ?? []).map((row) => clientStats(row, shipments ?? []));
  }
  items = items.filter((item) =>
    `${item.companyName} ${item.taxId} ${item.contactPerson} ${item.email}`
      .toLowerCase()
      .includes(q),
  );
  items.sort((a, b) =>
    query.sort === "revenue"
      ? b.totalRevenue - a.totalRevenue
      : query.sort === "shipments"
        ? b.totalShipments - a.totalShipments
        : a.companyName.localeCompare(b.companyName),
  );
  return paginate(items, page, pageSize, !supabase);
}

export async function getCarriers(query: DirectoryQuery = {}): Promise<DirectoryPage<Carrier>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const q = (query.q ?? "").toLowerCase();
  const supabase = await createClient();
  let items: Carrier[];
  if (!supabase) {
    items = demoCarriers;
  } else {
    const [{ data: rows, error }, { data: shipments, error: shipmentError }] =
      await Promise.all([
        supabase
          .from("carriers")
          .select(
            "id, company_name, country, contact_person, email, phone, vehicle_type, rating",
          ),
        supabase.from("shipments").select("carrier_id, status"),
      ]);
    if (error || shipmentError) throw new Error("Unable to load carriers");
    items = (rows ?? []).map((row) => carrierStats(row, shipments ?? []));
  }
  items = items.filter((item) =>
    `${item.companyName} ${item.country} ${item.contactPerson} ${item.email} ${item.vehicleType}`
      .toLowerCase()
      .includes(q),
  );
  items.sort((a, b) =>
    query.sort === "rating"
      ? b.rating - a.rating
      : query.sort === "completed"
        ? b.completedShipments - a.completedShipments
        : a.companyName.localeCompare(b.companyName),
  );
  return paginate(items, page, pageSize, !supabase);
}

export async function getClientDetail(
  id: string,
): Promise<{ item: Client | null; shipments: Shipment[]; isDemo: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    const item = demoClients.find((client) => client.id === id) ?? null;
    const related = await getRelatedShipments({ clientId: id });
    return { item, shipments: related.shipments, isDemo: true };
  }
  const [{ data: row, error }, related] = await Promise.all([
    supabase
      .from("clients")
      .select("id, company_name, tax_id, contact_person, email, phone")
      .eq("id", id)
      .maybeSingle(),
    getRelatedShipments({ clientId: id }),
  ]);
  if (error) throw new Error("Unable to load client");
  return {
    item: row ? clientDetail(row, related.shipments) : null,
    shipments: related.shipments,
    isDemo: false,
  };
}

export async function getCarrierDetail(
  id: string,
): Promise<{ item: Carrier | null; shipments: Shipment[]; isDemo: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    const item = demoCarriers.find((carrier) => carrier.id === id) ?? null;
    const related = await getRelatedShipments({ carrierId: id });
    return { item, shipments: related.shipments, isDemo: true };
  }
  const [{ data: row, error }, related] = await Promise.all([
    supabase
      .from("carriers")
      .select("id, company_name, country, contact_person, email, phone, vehicle_type, rating")
      .eq("id", id)
      .maybeSingle(),
    getRelatedShipments({ carrierId: id }),
  ]);
  if (error) throw new Error("Unable to load carrier");
  return {
    item: row ? carrierDetail(row, related.shipments) : null,
    shipments: related.shipments,
    isDemo: false,
  };
}
