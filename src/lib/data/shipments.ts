import { createClient } from "@/lib/supabase/server";
import { shipments as demoShipments, clients as demoClients, carriers as demoCarriers } from "@/data/mock-data";
import type { Shipment } from "@/types";
import type { Database } from "@/types/database";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type RelatedShipment = ShipmentRow & { clients:{company_name:string}|null; carriers:{company_name:string}|null };
export type DirectoryOption = { id:string; companyName:string };

function mapShipment(row: RelatedShipment): Shipment {
  return { id:row.id, referenceNumber:row.reference_number, pickupCity:row.pickup_city, deliveryCity:row.delivery_city,
    clientId:row.client_id, client:row.clients?.company_name ?? "Unknown client", carrierId:row.carrier_id, carrier:row.carriers?.company_name ?? "Unknown carrier",
    pickupDate:row.pickup_date, deliveryDate:row.delivery_date, clientPrice:Number(row.client_price), carrierCost:Number(row.carrier_cost),
    additionalCosts:Number(row.additional_costs), profit:Number(row.profit), marginPercent:Number(row.margin_percent), currency:row.currency,
    exchangeRateToBase:Number(row.exchange_rate_to_base), status:row.status, notes:row.notes ?? undefined };
}

export async function getShipments(): Promise<{shipments:Shipment[]; isDemo:boolean}> {
  const supabase = await createClient();
  if (!supabase) return { shipments:demoShipments, isDemo:true };
  const { data, error } = await supabase.from("shipments").select("*, clients(company_name), carriers(company_name)").order("pickup_date", { ascending:false });
  if (error) throw new Error("Unable to load shipments");
  return { shipments:(data as RelatedShipment[]).map(mapShipment), isDemo:false };
}

export async function getShipment(id:string): Promise<{shipment:Shipment|null; isDemo:boolean}> {
  const supabase = await createClient();
  if (!supabase) return { shipment:demoShipments.find(item => item.id===id) ?? null, isDemo:true };
  const { data, error } = await supabase.from("shipments").select("*, clients(company_name), carriers(company_name)").eq("id",id).maybeSingle();
  if (error) throw new Error("Unable to load shipment");
  return { shipment:data ? mapShipment(data as RelatedShipment) : null, isDemo:false };
}

export async function getDirectoryOptions(): Promise<{clients:DirectoryOption[];carriers:DirectoryOption[];isDemo:boolean}> {
  const supabase = await createClient();
  if (!supabase) return { clients:demoClients.map(x=>({id:x.id,companyName:x.companyName})), carriers:demoCarriers.map(x=>({id:x.id,companyName:x.companyName})), isDemo:true };
  const [{data:clients,error:clientError},{data:carriers,error:carrierError}] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"), supabase.from("carriers").select("id, company_name").order("company_name")
  ]);
  if (clientError || carrierError) throw new Error("Unable to load shipment directory");
  return { clients:(clients??[]).map(x=>({id:x.id,companyName:x.company_name})), carriers:(carriers??[]).map(x=>({id:x.id,companyName:x.company_name})), isDemo:false };
}
