import { expect, type Page, type TestInfo } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
export const livePassword = "FreightFlow123!";

export async function createLiveUser(testInfo: TestInfo, label: string) {
  const api = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const suffix = `${testInfo.project.name}-${testInfo.workerIndex}-${crypto.randomUUID()}`;
  const email = `${label}-${suffix}@example.com`;
  const { data, error } = await api.auth.signUp({ email, password: livePassword });
  expect(error).toBeNull();
  expect(data.user).toBeTruthy();
  return { api, email, password: livePassword, user: data.user! };
}

export async function signIn(page: Page, email: string, password = livePassword) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard/);
}

export async function clearLiveBusinessData(api: SupabaseClient) {
  const { data: documents } = await api
    .from("shipment_documents")
    .select("id,storage_path");
  for (const document of documents ?? []) {
    await api.storage.from("shipment-documents").remove([document.storage_path]);
    await api.rpc("delete_shipment_document_metadata", { document_id: document.id });
  }
  await api.from("shipments").delete().neq("id", crypto.randomUUID());
  await api.from("clients").delete().neq("id", crypto.randomUUID());
  await api.from("carriers").delete().neq("id", crypto.randomUUID());
}
