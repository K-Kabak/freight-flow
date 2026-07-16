import { expect,test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E!=="true","Requires the local Supabase stack");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"http://127.0.0.1:54321";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlLWRlbW8iLCJyb2xlIjoiYW5vbiIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test("RLS isolates business records between users",async()=>{
  const owner=createClient(url,key,{auth:{persistSession:false}}); const stranger=createClient(url,key,{auth:{persistSession:false}}); const suffix=`${Date.now()}-${test.info().project.name}`;
  const{data:{user:ownerUser}}=await owner.auth.signUp({email:`owner-${suffix}@example.com`,password:"FreightFlow123!"});
  const clientId=crypto.randomUUID(); expect((await owner.from("clients").insert({id:clientId,user_id:ownerUser!.id,company_name:"Private Client",tax_id:"PL1234567890",contact_person:"Owner",email:"owner@example.com",phone:"+48123456789"})).error).toBeNull();
  const carrierId=crypto.randomUUID(); expect((await owner.from("carriers").insert({id:carrierId,user_id:ownerUser!.id,company_name:"Private Carrier",country:"PL",contact_person:"Owner",email:"carrier@example.com",phone:"+48987654321",vehicle_type:"Curtainsider",rating:5})).error).toBeNull();
  const shipmentId=crypto.randomUUID(); expect((await owner.from("shipments").insert({id:shipmentId,user_id:ownerUser!.id,client_id:clientId,carrier_id:carrierId,reference_number:`RLS-${suffix}`,pickup_city:"Warsaw",delivery_city:"Berlin",pickup_date:"2026-08-01",delivery_date:"2026-08-02",client_price:4200,carrier_cost:3300,additional_costs:150,currency:"PLN",exchange_rate_to_base:1,status:"New",notes:null})).error).toBeNull();
  const{data:{user:strangerUser}}=await stranger.auth.signUp({email:`stranger-${suffix}@example.com`,password:"FreightFlow123!"});
  const read=await stranger.from("clients").select("id").eq("id",clientId); expect(read.error).toBeNull(); expect(read.data).toEqual([]);
  const update=await stranger.from("clients").update({company_name:"Stolen"}).eq("id",clientId).select("id"); expect(update.error).toBeNull(); expect(update.data).toEqual([]);
  const shipmentRead=await stranger.from("shipments").select("id").eq("id",shipmentId); expect(shipmentRead.error).toBeNull(); expect(shipmentRead.data).toEqual([]);
  const shipmentDelete=await stranger.from("shipments").delete().eq("id",shipmentId).select("id"); expect(shipmentDelete.error).toBeNull(); expect(shipmentDelete.data).toEqual([]);
  const crossTenantInsert=await stranger.from("shipments").insert({user_id:strangerUser!.id,client_id:clientId,carrier_id:carrierId,reference_number:`FORBIDDEN-${suffix}`,pickup_city:"Paris",delivery_city:"Madrid",pickup_date:"2026-08-03",delivery_date:"2026-08-04",client_price:1000,carrier_cost:800,additional_costs:0,currency:"EUR",exchange_rate_to_base:1,status:"New",notes:null}); expect(crossTenantInsert.error).not.toBeNull();
  const restrictedDelete=await owner.from("clients").delete().eq("id",clientId); expect(restrictedDelete.error).not.toBeNull();
  const ownerRead=await owner.from("clients").select("company_name").eq("id",clientId).single(); expect(ownerRead.data?.company_name).toBe("Private Client");
});
