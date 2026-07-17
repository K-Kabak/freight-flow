import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  createLiveUser,
  signIn,
  supabaseKey,
  supabaseUrl,
} from "./support/live-workspace";

test.skip(process.env.SUPABASE_E2E !== "true", "Requires Supabase with Storage enabled");

test("private shipment documents remain isolated and require finalization", async ({ page }) => {
  const owner = await createLiveUser(test.info(), "document-owner");
  const stranger = await createLiveUser(test.info(), "document-stranger");
  const clientId = crypto.randomUUID();
  const carrierId = crypto.randomUUID();
  const shipmentId = crypto.randomUUID();

  expect(
    (
      await owner.api.from("clients").insert({
        id: clientId,
        user_id: owner.user.id,
        company_name: "Document Client",
        tax_id: "PL7100000001",
        contact_person: "Client Owner",
        email: "document-client@example.com",
        phone: "+48710100001",
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.from("carriers").insert({
        id: carrierId,
        user_id: owner.user.id,
        company_name: "Document Carrier",
        country: "Poland",
        contact_person: "Dispatcher",
        email: "document-carrier@example.com",
        phone: "+48710100002",
        vehicle_type: "Curtainsider",
        rating: 5,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.from("shipments").insert({
        id: shipmentId,
        user_id: owner.user.id,
        client_id: clientId,
        carrier_id: carrierId,
        reference_number: `DOC-${crypto.randomUUID()}`,
        pickup_city: "Warsaw",
        delivery_city: "Prague",
        pickup_date: "2026-09-10",
        delivery_date: "2026-09-11",
        client_price: 3900,
        carrier_cost: 3000,
        currency: "PLN",
        exchange_rate_to_base: 1,
        status: "Accepted",
      })
    ).error,
  ).toBeNull();

  const documentId = crypto.randomUUID();
  const storagePath = `${owner.user.id}/${shipmentId}/${documentId}`;
  expect(
    (
      await owner.api.from("shipment_documents").insert({
        id: documentId,
        shipment_id: shipmentId,
        storage_path: storagePath,
        original_name: "proof-of-delivery.pdf",
        mime_type: "application/pdf",
        size_bytes: 8,
      })
    ).error,
  ).toBeNull();

  const forgedReadyId = crypto.randomUUID();
  expect(
    (
      await owner.api.from("shipment_documents").insert({
        id: forgedReadyId,
        shipment_id: shipmentId,
        storage_path: `${owner.user.id}/${shipmentId}/${forgedReadyId}`,
        original_name: "forged.pdf",
        mime_type: "application/pdf",
        size_bytes: 8,
        upload_status: "ready",
        uploaded_at: new Date().toISOString(),
      })
    ).error,
  ).not.toBeNull();

  expect(
    (await owner.api.rpc("finalize_shipment_document", { document_id: documentId })).error,
  ).not.toBeNull();
  expect(
    (await stranger.api.rpc("finalize_shipment_document", { document_id: documentId })).error,
  ).not.toBeNull();
  expect(
    (
      await stranger.api
        .from("shipment_documents")
        .select("id")
        .eq("shipment_id", shipmentId)
    ).data,
  ).toEqual([]);
  expect(
    (
      await stranger.api.from("shipment_documents").insert({
        id: crypto.randomUUID(),
        shipment_id: shipmentId,
        storage_path: `${stranger.user.id}/${shipmentId}/${crypto.randomUUID()}`,
        original_name: "stolen.pdf",
        mime_type: "application/pdf",
        size_bytes: 8,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.api
        .from("shipment_documents")
        .update({ original_name: "manipulated.pdf" })
        .eq("id", documentId)
    ).error,
  ).not.toBeNull();
  expect(
    (await owner.api.from("shipment_documents").delete().eq("id", documentId)).error,
  ).not.toBeNull();
  expect(
    (await stranger.api.from("shipment_documents").delete().eq("id", documentId)).error,
  ).not.toBeNull();
  expect(
    (await owner.api.from("shipment_documents").select("id").eq("id", documentId)).data,
  ).toHaveLength(1);

  const file = new Blob(["%PDF-1.4"], { type: "application/pdf" });
  expect(
    (
      await stranger.api.storage.from("shipment-documents").upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.api.storage.from("shipment-documents").upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      })
    ).error,
  ).toBeNull();

  expect(
    (await owner.api.rpc("finalize_shipment_document", { document_id: documentId })).error,
  ).toBeNull();
  expect(
    (await owner.api.rpc("delete_shipment_document_metadata", { document_id: documentId })).error,
  ).not.toBeNull();
  const ready = await owner.api
    .from("shipment_documents")
    .select("upload_status,uploaded_at")
    .eq("id", documentId)
    .single();
  expect(ready.error).toBeNull();
  expect(ready.data?.upload_status).toBe("ready");
  expect(ready.data?.uploaded_at).toBeTruthy();

  const ownerDownload = await owner.api.storage.from("shipment-documents").download(storagePath);
  expect(ownerDownload.error).toBeNull();
  expect(await ownerDownload.data?.text()).toBe("%PDF-1.4");
  expect(
    (await stranger.api.storage.from("shipment-documents").download(storagePath)).error,
  ).not.toBeNull();
  expect(
    (await stranger.api.storage.from("shipment-documents").remove([storagePath])).error,
  ).toBeNull();
  expect(
    (await owner.api.storage.from("shipment-documents").download(storagePath)).error,
  ).toBeNull();

  const anonymous = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  expect((await anonymous.from("shipment_documents").select("id")).error).not.toBeNull();
  expect(
    (
      await anonymous.from("shipment_documents").insert({
        id: crypto.randomUUID(),
        shipment_id: shipmentId,
        storage_path: `anonymous/${shipmentId}/${crypto.randomUUID()}`,
        original_name: "anonymous.pdf",
        mime_type: "application/pdf",
        size_bytes: 8,
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await anonymous.rpc("finalize_shipment_document", { document_id: documentId })).error,
  ).not.toBeNull();
  expect(
    (
      await anonymous.rpc("delete_shipment_document_metadata", { document_id: documentId })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await anonymous.storage.from("shipment-documents").upload(storagePath, file, {
        contentType: "application/pdf",
      })
    ).error,
  ).not.toBeNull();
  expect(
    (await anonymous.storage.from("shipment-documents").download(storagePath)).error,
  ).not.toBeNull();
  expect(
    (await anonymous.storage.from("shipment-documents").remove([storagePath])).error,
  ).toBeNull();
  expect(
    (await owner.api.storage.from("shipment-documents").download(storagePath)).error,
  ).toBeNull();

  const invalidMimeId = crypto.randomUUID();
  const invalidMimePath = `${owner.user.id}/${shipmentId}/${invalidMimeId}`;
  expect(
    (
      await owner.api.from("shipment_documents").insert({
        id: invalidMimeId,
        shipment_id: shipmentId,
        storage_path: invalidMimePath,
        original_name: "declared-as-pdf.pdf",
        mime_type: "application/pdf",
        size_bytes: 10,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.storage
        .from("shipment-documents")
        .upload(invalidMimePath, new Blob(["plain text"], { type: "text/plain" }), {
          contentType: "text/plain",
        })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.api.rpc("delete_shipment_document_metadata", { document_id: invalidMimeId })
    ).error,
  ).toBeNull();

  const oversizedId = crypto.randomUUID();
  const oversizedPath = `${owner.user.id}/${shipmentId}/${oversizedId}`;
  expect(
    (
      await owner.api.from("shipment_documents").insert({
        id: oversizedId,
        shipment_id: shipmentId,
        storage_path: oversizedPath,
        original_name: "oversized.pdf",
        mime_type: "application/pdf",
        size_bytes: 1,
      })
    ).error,
  ).toBeNull();
  expect(
    (
      await owner.api.storage
        .from("shipment-documents")
        .upload(oversizedPath, new Blob([new Uint8Array(6 * 1024 * 1024 + 1)]), {
          contentType: "application/pdf",
        })
    ).error,
  ).not.toBeNull();
  expect(
    (
      await owner.api.rpc("delete_shipment_document_metadata", { document_id: oversizedId })
    ).error,
  ).toBeNull();

  expect((await owner.api.from("shipments").delete().eq("id", shipmentId)).error?.code).toBe(
    "23503",
  );

  await signIn(page, owner.email);
  await page.goto(`/shipments/${shipmentId}`);
  const documents = page.getByRole("list", { name: "Shipment documents" });
  await expect(documents.getByText("proof-of-delivery.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download proof-of-delivery.pdf" })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete proof-of-delivery.pdf" }).click();
  await expect(documents.getByText("proof-of-delivery.pdf")).toBeHidden();
  expect(
    (await owner.api.from("shipment_documents").select("id").eq("id", documentId)).data,
  ).toEqual([]);
  expect(
    (await owner.api.storage.from("shipment-documents").download(storagePath)).error,
  ).not.toBeNull();

  await page.getByLabel("Upload document").setInputFiles({
    name: "cmr-scan.png",
    mimeType: "image/png",
    buffer: Buffer.from("png transport document"),
  });
  await expect(documents.getByText("cmr-scan.png")).toBeVisible();
  const uploadedThroughUi = await owner.api
    .from("shipment_documents")
    .select("id,upload_status,storage_path")
    .eq("original_name", "cmr-scan.png")
    .single();
  expect(uploadedThroughUi.error).toBeNull();
  expect(uploadedThroughUi.data?.upload_status).toBe("ready");
  expect(
    (
      await owner.api.storage
        .from("shipment-documents")
        .download(uploadedThroughUi.data!.storage_path)
    ).error,
  ).toBeNull();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete cmr-scan.png" }).click();
  await expect(documents.getByText("cmr-scan.png")).toBeHidden();
});
