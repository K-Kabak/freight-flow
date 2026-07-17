import { createClient } from "@/lib/supabase/server";
import { carriers as demoCarriers, clients as demoClients } from "@/data/mock-data";
import type { Carrier, Client, Shipment } from "@/types";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CarrierRow = Database["public"]["Tables"]["carriers"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
export type DirectoryQuery = { q?: string; sort?: string; page?: number; pageSize?: number };
export type DirectoryPage<T> = { items: T[]; total: number; page: number; pageCount: number; isDemo: boolean };

function clientStats(row: ClientRow, shipments: ShipmentRow[]): Client {
  const related = shipments.filter((shipment) => shipment.client_id === row.id);
  const revenue = related.reduce((sum, shipment) => sum + Number(shipment.client_price) * Number(shipment.exchange_rate_to_base), 0);
  const profit = related.reduce((sum, shipment) => sum + Number(shipment.profit) * Number(shipment.exchange_rate_to_base), 0);
  return { id:row.id, companyName:row.company_name, taxId:row.tax_id, contactPerson:row.contact_person, email:row.email, phone:row.phone,
    totalShipments:related.length, totalRevenue:revenue, averageMargin:revenue ? Number(((profit / revenue) * 100).toFixed(2)) : 0 };
}

function carrierStats(row: CarrierRow, shipments: ShipmentRow[]): Carrier {
  const completed = shipments.filter((shipment) => shipment.carrier_id === row.id && shipment.status === "Delivered").length;
  return { id:row.id, companyName:row.company_name, country:row.country, contactPerson:row.contact_person, email:row.email, phone:row.phone,
    vehicleType:row.vehicle_type, rating:row.rating, completedShipments:completed };
}

function paginate<T>(items:T[], page:number, pageSize:number, isDemo:boolean):DirectoryPage<T>{
  const pageCount=Math.max(1,Math.ceil(items.length/pageSize)); const current=Math.min(Math.max(1,page),pageCount);
  return {items:items.slice((current-1)*pageSize,current*pageSize),total:items.length,page:current,pageCount,isDemo};
}

export async function getClients(query:DirectoryQuery={}):Promise<DirectoryPage<Client>>{
  const page=query.page??1,pageSize=query.pageSize??10,q=(query.q??"").toLowerCase(); const supabase=await createClient();
  let items:Client[];
  if(!supabase){items=demoClients;}
  else {const[{data:rows,error},{data:shipments,error:shipmentError}]=await Promise.all([supabase.from("clients").select("*"),supabase.from("shipments").select("*")]);if(error||shipmentError)throw new Error("Unable to load clients");items=(rows??[]).map(row=>clientStats(row,shipments??[]));}
  items=items.filter(item=>`${item.companyName} ${item.taxId} ${item.contactPerson} ${item.email}`.toLowerCase().includes(q));
  items.sort((a,b)=>query.sort==="revenue"?b.totalRevenue-a.totalRevenue:query.sort==="shipments"?b.totalShipments-a.totalShipments:a.companyName.localeCompare(b.companyName));
  return paginate(items,page,pageSize,!supabase);
}

export async function getCarriers(query:DirectoryQuery={}):Promise<DirectoryPage<Carrier>>{
  const page=query.page??1,pageSize=query.pageSize??10,q=(query.q??"").toLowerCase(); const supabase=await createClient();
  let items:Carrier[];
  if(!supabase){items=demoCarriers;}
  else {const[{data:rows,error},{data:shipments,error:shipmentError}]=await Promise.all([supabase.from("carriers").select("*"),supabase.from("shipments").select("*")]);if(error||shipmentError)throw new Error("Unable to load carriers");items=(rows??[]).map(row=>carrierStats(row,shipments??[]));}
  items=items.filter(item=>`${item.companyName} ${item.country} ${item.contactPerson} ${item.email} ${item.vehicleType}`.toLowerCase().includes(q));
  items.sort((a,b)=>query.sort==="rating"?b.rating-a.rating:query.sort==="completed"?b.completedShipments-a.completedShipments:a.companyName.localeCompare(b.companyName));
  return paginate(items,page,pageSize,!supabase);
}

export async function getClientDetail(id:string):Promise<{item:Client|null;shipments:Shipment[];isDemo:boolean}>{
  const page=await getClients({pageSize:10000});const item=page.items.find(client=>client.id===id)??null;
  const {getShipments}=await import("@/lib/data/shipments");const shipmentResult=await getShipments();return{item,shipments:shipmentResult.shipments.filter(s=>s.clientId===id),isDemo:page.isDemo};
}

export async function getCarrierDetail(id:string):Promise<{item:Carrier|null;shipments:Shipment[];isDemo:boolean}>{
  const page=await getCarriers({pageSize:10000});const item=page.items.find(carrier=>carrier.id===id)??null;
  const {getShipments}=await import("@/lib/data/shipments");const shipmentResult=await getShipments();return{item,shipments:shipmentResult.shipments.filter(s=>s.carrierId===id),isDemo:page.isDemo};
}
