import { expect,test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E!=="true","Requires the local Supabase stack");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"http://127.0.0.1:54321";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlLWRlbW8iLCJyb2xlIjoiYW5vbiIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test("RLS isolates business records between users",async()=>{
  const owner=createClient(url,key,{auth:{persistSession:false}}); const stranger=createClient(url,key,{auth:{persistSession:false}}); const suffix=`${Date.now()}-${test.info().project.name}`;
  const{data:{user:ownerUser}}=await owner.auth.signUp({email:`owner-${suffix}@example.com`,password:"FreightFlow123!"});
  const clientId=crypto.randomUUID(); expect((await owner.from("clients").insert({id:clientId,user_id:ownerUser!.id,company_name:"Private Client",tax_id:"PL1234567890",contact_person:"Owner",email:"owner@example.com",phone:"+48123456789"})).error).toBeNull();
  await stranger.auth.signUp({email:`stranger-${suffix}@example.com`,password:"FreightFlow123!"});
  const read=await stranger.from("clients").select("id").eq("id",clientId); expect(read.error).toBeNull(); expect(read.data).toEqual([]);
  const update=await stranger.from("clients").update({company_name:"Stolen"}).eq("id",clientId).select("id"); expect(update.error).toBeNull(); expect(update.data).toEqual([]);
  const ownerRead=await owner.from("clients").select("company_name").eq("id",clientId).single(); expect(ownerRead.data?.company_name).toBe("Private Client");
});
