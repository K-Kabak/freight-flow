import { expect,test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.skip(process.env.SUPABASE_E2E!=="true","Requires the local Supabase stack");
const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"http://127.0.0.1:54321";
const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY??"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

test("authenticated user completes the shipment lifecycle",async({page})=>{
  const email=`e2e-${Date.now()}-${test.info().project.name}@example.com`; const password="FreightFlow123!"; const api=createClient(url,key);
  const{data:{user},error}=await api.auth.signUp({email,password}); expect(error).toBeNull(); expect(user).toBeTruthy();
  const clientId=crypto.randomUUID(); const carrierId=crypto.randomUUID();
  expect((await api.from("clients").insert({id:clientId,user_id:user!.id,company_name:"E2E Client",tax_id:"PL1234567890",contact_person:"Test Client",email:"client@example.com",phone:"+48123456789"})).error).toBeNull();
  expect((await api.from("carriers").insert({id:carrierId,user_id:user!.id,company_name:"E2E Carrier",country:"Poland",contact_person:"Test Carrier",email:"carrier@example.com",phone:"+48987654321",vehicle_type:"Curtainsider",rating:5})).error).toBeNull();
  await page.goto("/login"); await page.getByLabel("Email address").fill(email); await page.getByLabel("Password").fill(password); await page.getByRole("button",{name:"Sign in"}).click(); await expect(page).toHaveURL(/dashboard/);
  await page.goto("/shipments/new"); await page.getByLabel("Reference number").fill("E2E-001"); await page.getByLabel("Client",{exact:true}).selectOption(clientId); await page.getByLabel("Carrier",{exact:true}).selectOption(carrierId); await page.getByLabel("Pickup city").fill("Warsaw"); await page.getByLabel("Delivery city").fill("Berlin"); await page.getByLabel("Pickup date").fill("2026-08-01"); await page.getByLabel("Delivery date").fill("2026-08-02"); await page.getByLabel("Client price").fill("4200"); await page.getByLabel("Carrier cost").fill("3300"); await page.getByLabel("Additional costs").fill("150"); await page.getByRole("button",{name:"Create shipment"}).click();
  await expect(page).toHaveURL(/shipments$/); await expect(page.getByText("E2E-001")).toBeVisible();
  await page.getByText("E2E-001").click(); await page.getByLabel("Delivery city").fill("Hamburg"); await page.getByRole("button",{name:"Save changes"}).click(); await expect(page).toHaveURL(/shipments$/); await expect(page.getByText("Hamburg")).toBeVisible();
  await page.getByLabel("Shipment status").selectOption("Delivered"); await expect(page.getByText("Status updated")).toBeVisible(); page.on("dialog",dialog=>dialog.accept()); await page.getByLabel("Delete shipment").click(); await expect(page.getByText("E2E-001")).not.toBeVisible();
});
