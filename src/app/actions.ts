"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { shipmentFormSchema } from "@/lib/validation/shipment";

export type ActionResult = { ok:true } | { ok:false; message:string; fieldErrors?:Record<string,string[]> };
const idSchema = z.string().uuid();

async function auth() { const supabase=await createClient(); if(!supabase) return null; const {data:{user}}=await supabase.auth.getUser(); return user ? {supabase,user} : null; }
function refreshShipments(){ revalidatePath("/shipments"); revalidatePath("/dashboard"); revalidatePath("/analytics"); }

export async function upsertShipment(formData:FormData, shipmentId?:string):Promise<ActionResult> {
  const parsed=shipmentFormSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) return {ok:false,message:"Check the highlighted fields.",fieldErrors:parsed.error.flatten().fieldErrors};
  const session=await auth(); if(!session) return {ok:false,message:"Your session expired. Sign in again."};
  const payload={...parsed.data,notes:parsed.data.notes||null};
  const query=shipmentId ? session.supabase.from("shipments").update(payload).eq("id",idSchema.parse(shipmentId)) : session.supabase.from("shipments").insert({...payload,user_id:session.user.id});
  const {error}=await query;
  if(error) return {ok:false,message:error.code==="23505"?"This reference number already exists.":"The shipment could not be saved."};
  refreshShipments(); return {ok:true};
}

export async function deleteShipment(shipmentId:string):Promise<ActionResult>{const parsed=idSchema.safeParse(shipmentId);if(!parsed.success)return{ok:false,message:"Invalid shipment."};const session=await auth();if(!session)return{ok:false,message:"Your session expired. Sign in again."};const{error}=await session.supabase.from("shipments").delete().eq("id",parsed.data);if(error)return{ok:false,message:"The shipment could not be deleted."};refreshShipments();return{ok:true}}
export async function updateShipmentStatus(shipmentId:string,status:string):Promise<ActionResult>{const parsed=z.object({id:idSchema,status:z.enum(["New","Accepted","In Transit","Delivered","Cancelled","Issue"])}).safeParse({id:shipmentId,status});if(!parsed.success)return{ok:false,message:"Invalid status."};const session=await auth();if(!session)return{ok:false,message:"Your session expired. Sign in again."};const{error}=await session.supabase.from("shipments").update({status:parsed.data.status}).eq("id",parsed.data.id);if(error)return{ok:false,message:"The status could not be updated."};refreshShipments();return{ok:true}}

export async function createStarterDirectory():Promise<ActionResult>{const session=await auth();if(!session)return{ok:false,message:"Your session expired. Sign in again."};const[{data:clients},{data:carriers}]=await Promise.all([session.supabase.from("clients").select("id").limit(1),session.supabase.from("carriers").select("id").limit(1)]);if(!clients?.length){const{error}=await session.supabase.from("clients").insert({user_id:session.user.id,company_name:"Starter Client",tax_id:"PL0000000000",contact_person:"Demo Contact",email:"client@example.com",phone:"+48000000000"});if(error)return{ok:false,message:"Could not create the starter client."}}if(!carriers?.length){const{error}=await session.supabase.from("carriers").insert({user_id:session.user.id,company_name:"Starter Carrier",country:"Poland",contact_person:"Demo Dispatcher",email:"carrier@example.com",phone:"+48000000001",vehicle_type:"Curtainsider",rating:5});if(error)return{ok:false,message:"Could not create the starter carrier."}}revalidatePath("/shipments/new");return{ok:true}}

const clientSchema=z.object({company_name:z.string().min(2),tax_id:z.string().min(3),contact_person:z.string().min(2),email:z.string().email(),phone:z.string().min(5)});
const carrierSchema=z.object({company_name:z.string().min(2),country:z.string().min(2),contact_person:z.string().min(2),email:z.string().email(),phone:z.string().min(5),vehicle_type:z.string().min(2),rating:z.coerce.number().int().min(1).max(5)});
export async function upsertClient(formData:FormData,clientId?:string){const data=clientSchema.parse(Object.fromEntries(formData));const session=await auth();if(!session)throw new Error("Unauthorized");const query=clientId?session.supabase.from("clients").update(data).eq("id",clientId):session.supabase.from("clients").insert({...data,user_id:session.user.id});const{error}=await query;if(error)throw new Error(error.message);revalidatePath("/clients");redirect("/clients")}
export async function deleteClient(clientId:string){idSchema.parse(clientId);const session=await auth();if(!session)throw new Error("Unauthorized");const{error}=await session.supabase.from("clients").delete().eq("id",clientId);if(error?.code==="23503")throw new Error("Reassign or delete this client's shipments first.");if(error)throw new Error(error.message);revalidatePath("/clients")}
export async function upsertCarrier(formData:FormData,carrierId?:string){const data=carrierSchema.parse(Object.fromEntries(formData));const session=await auth();if(!session)throw new Error("Unauthorized");const query=carrierId?session.supabase.from("carriers").update(data).eq("id",carrierId):session.supabase.from("carriers").insert({...data,user_id:session.user.id});const{error}=await query;if(error)throw new Error(error.message);revalidatePath("/carriers");redirect("/carriers")}
export async function deleteCarrier(carrierId:string){idSchema.parse(carrierId);const session=await auth();if(!session)throw new Error("Unauthorized");const{error}=await session.supabase.from("carriers").delete().eq("id",carrierId);if(error?.code==="23503")throw new Error("Reassign or delete this carrier's shipments first.");if(error)throw new Error(error.message);revalidatePath("/carriers")}
export async function signOut(){const supabase=await createClient();await supabase?.auth.signOut();redirect("/login")}
