import { createClient } from "@/lib/supabase/server";
import { shipments as demoShipments, clients as demoClients, carriers as demoCarriers } from "@/data/mock-data";
import type { Shipment } from "@/types";
import type { Database } from "@/types/database";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type RelatedShipment = ShipmentRow & { clients:{company_name:string}|null; carriers:{company_name:string}|null };
export type DirectoryOption = { id:string; companyName:string };
export type ShipmentQuery={q?:string;status?:string;sort?:string;page?:number;pageSize?:number};

function mapShipment(row: RelatedShipment): Shipment {
  return { id:row.id, referenceNumber:row.reference_number, pickupCity:row.pickup_city, deliveryCity:row.delivery_city,
    clientId:row.client_id, client:row.clients?.company_name ?? "Unknown client", carrierId:row.carrier_id, carrier:row.carriers?.company_name ?? "Unknown carrier",
    pickupDate:row.pickup_date, deliveryDate:row.delivery_date, clientPrice:Number(row.client_price), carrierCost:Number(row.carrier_cost),
    additionalCosts:Number(row.additional_costs), profit:Number(row.profit), marginPercent:Number(row.margin_percent), currency:row.currency,
    exchangeRateToBase:Number(row.exchange_rate_to_base), status:row.status, notes:row.notes ?? undefined };
}

export async function getShipments(query?:ShipmentQuery): Promise<{shipments:Shipment[];total:number;page:number;pageCount:number;isDemo:boolean}> {
  const supabase = await createClient();
  const page=Math.max(1,query?.page??1),pageSize=query?.pageSize??10;
  if (!supabase) {const filtered=demoShipments.filter(item=>(!query?.status||query.status==="All"||item.status===query.status)&&`${item.referenceNumber} ${item.client} ${item.pickupCity} ${item.deliveryCity}`.toLowerCase().includes((query?.q??"").toLowerCase()));return{shipments:query?filtered.slice((page-1)*pageSize,page*pageSize):filtered,total:filtered.length,page,pageCount:Math.max(1,Math.ceil(filtered.length/pageSize)),isDemo:true}}
  let request=supabase.from("shipments").select("*, clients(company_name), carriers(company_name)",{count:"exact"});
  if(query?.status&&query.status!=="All")request=request.eq("status",query.status as ShipmentRow["status"]);
  if(query?.q){const term=query.q.replace(/[,%()]/g,"");const{data:matchingClients}=await supabase.from("clients").select("id").ilike("company_name",`%${term}%`);const clientFilter=matchingClients?.length?`,client_id.in.(${matchingClients.map(client=>client.id).join(",")})`:"";request=request.or(`reference_number.ilike.%${term}%,pickup_city.ilike.%${term}%,delivery_city.ilike.%${term}%${clientFilter}`)}
  const sortFields:Record<string,keyof ShipmentRow>={reference:"reference_number",profit:"profit",status:"status",pickup:"pickup_date"};const sort=sortFields[query?.sort??"pickup"]??"pickup_date";
  request=request.order(sort,{ascending:sort!=="pickup_date"});if(query)request=request.range((page-1)*pageSize,page*pageSize-1);
  const { data, error,count } = await request;
  if (error) throw new Error("Unable to load shipments");
  const total=count??data?.length??0;return { shipments:(data as RelatedShipment[]).map(mapShipment),total,page,pageCount:Math.max(1,Math.ceil(total/pageSize)),isDemo:false };
}

export async function getShipment(id:string): Promise<{shipment:Shipment|null; isDemo:boolean}> {
  const supabase = await createClient();
  if (!supabase) return { shipment:demoShipments.find(item => item.id===id) ?? null, isDemo:true };
  const { data, error } = await supabase.from("shipments").select("*, clients(company_name), carriers(company_name)").eq("id",id).maybeSingle();
  if (error) throw new Error("Unable to load shipment");
  return { shipment:data ? mapShipment(data as RelatedShipment) : null, isDemo:false };
}

export async function getDirectoryOptions(): Promise<{clients:DirectoryOption[];carriers:DirectoryOption[];reportingCurrency:"PLN"|"EUR"|"USD";isDemo:boolean}> {
  const supabase = await createClient();
  if (!supabase) return { clients:demoClients.map(x=>({id:x.id,companyName:x.companyName})), carriers:demoCarriers.map(x=>({id:x.id,companyName:x.companyName})), reportingCurrency:"PLN", isDemo:true };
  const {data:{user}}=await supabase.auth.getUser();
  const [{data:clients,error:clientError},{data:carriers,error:carrierError},{data:profile,error:profileError}] = await Promise.all([
    supabase.from("clients").select("id, company_name").order("company_name"), supabase.from("carriers").select("id, company_name").order("company_name"),supabase.from("profiles").select("reporting_currency").eq("id",user!.id).single()
  ]);
  if (clientError || carrierError || profileError) throw new Error("Unable to load shipment directory");
  return { clients:(clients??[]).map(x=>({id:x.id,companyName:x.company_name})), carriers:(carriers??[]).map(x=>({id:x.id,companyName:x.company_name})), reportingCurrency:profile.reporting_currency, isDemo:false };
}
