"use client";

import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteShipmentDocument,
  finalizeShipmentDocument,
  prepareShipmentDocument,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { documentMetadataSchema, MAX_DOCUMENT_BYTES } from "@/lib/validation/document";
import type { ShipmentDocument } from "@/types";

const formatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ShipmentDocuments({
  shipmentId,
  documents,
}: {
  shipmentId: string;
  documents: ShipmentDocument[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File | undefined) {
    setError(null);
    if (!file) return;

    const metadata = documentMetadataSchema.safeParse({
      shipmentId,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!metadata.success) {
      setError(metadata.error.issues[0]?.message ?? "The file is invalid.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("Document storage is unavailable.");
      return;
    }

    setIsUploading(true);
    const prepared = await prepareShipmentDocument(metadata.data);
    if (!prepared.ok) {
      setError(prepared.message);
      setIsUploading(false);
      return;
    }

    const { error: uploadError } = await supabase.storage
      .from("shipment-documents")
      .upload(prepared.document.storagePath, file, {
        contentType: metadata.data.mimeType,
        upsert: false,
      });
    if (uploadError) {
      await deleteShipmentDocument(prepared.document.id);
      setError("The file could not be uploaded. Please try again.");
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const finalized = await finalizeShipmentDocument(prepared.document.id);
    if (!finalized.ok) {
      setError(finalized.message);
      setIsUploading(false);
      router.refresh();
      return;
    }

    toast.success("Document uploaded");
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function handleDownload(document: ShipmentDocument) {
    const supabase = createClient();
    if (!supabase) {
      setError("Document storage is unavailable.");
      return;
    }

    setError(null);
    setBusyId(document.id);
    const { data, error: downloadError } = await supabase.storage
      .from("shipment-documents")
      .download(document.storagePath);
    if (downloadError || !data) {
      setError("The document could not be downloaded.");
      setBusyId(null);
      return;
    }

    const url = URL.createObjectURL(data);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.originalName;
    link.click();
    URL.revokeObjectURL(url);
    setBusyId(null);
  }

  async function handleDelete(document: ShipmentDocument) {
    if (!window.confirm(`Delete ${document.originalName}?`)) return;
    setError(null);
    setBusyId(document.id);
    const result = await deleteShipmentDocument(document.id);
    if (!result.ok) {
      setError(result.message);
      setBusyId(null);
      return;
    }
    toast.success("Document deleted");
    setBusyId(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-wrap gap-4">
        <div>
          <h2 className="font-semibold">Transport documents</h2>
          <p className="text-xs text-slate-500">Private PDF, JPEG or PNG files, up to 6 MiB.</p>
        </div>
        <div>
          <input
            accept="application/pdf,image/jpeg,image/png"
            aria-describedby="document-upload-help"
            className="sr-only"
            disabled={isUploading}
            id="shipment-document"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <label
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
            htmlFor="shipment-document"
          >
            <Upload aria-hidden="true" className="size-4" />
            {isUploading ? "Uploading..." : "Upload document"}
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <p className="sr-only" id="document-upload-help">
          Maximum file size {formatBytes(MAX_DOCUMENT_BYTES)}. Accepted types: PDF, JPEG and PNG.
        </p>
        {error ? (
          <p className="mb-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {documents.length ? (
          <ul className="divide-y divide-slate-100" aria-label="Shipment documents">
            {documents.map((document) => (
              <li className="flex flex-wrap items-center gap-3 py-3" key={document.id}>
                <FileText aria-hidden="true" className="size-5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {document.originalName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(document.sizeBytes)} | {formatter.format(new Date(document.createdAt))}
                    {document.status === "pending" ? " | Processing" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {document.status === "ready" ? (
                    <Button
                      aria-label={`Download ${document.originalName}`}
                      disabled={busyId === document.id}
                      onClick={() => void handleDownload(document)}
                      type="button"
                      variant="outline"
                    >
                      <Download aria-hidden="true" className="size-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  ) : null}
                  <Button
                    aria-label={`Delete ${document.originalName}`}
                    disabled={busyId === document.id}
                    onClick={() => void handleDelete(document)}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-slate-500">No documents have been uploaded.</p>
        )}
      </CardContent>
    </Card>
  );
}
