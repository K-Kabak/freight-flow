import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ShipmentDocuments } from "./shipment-documents";

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  finalize: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/app/actions", () => ({
  prepareShipmentDocument: mocks.prepare,
  finalizeShipmentDocument: mocks.finalize,
  deleteShipmentDocument: mocks.remove,
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({ upload: mocks.upload, download: mocks.download }),
    },
  }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.toastSuccess },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const shipmentId = "11111111-1111-4111-8111-111111111111";

describe("ShipmentDocuments", () => {
  it("uploads directly to Storage before finalizing the document", async () => {
    mocks.prepare.mockResolvedValue({
      ok: true,
      document: {
        id: "22222222-2222-4222-8222-222222222222",
        storagePath: `${shipmentId}/${shipmentId}/document`,
      },
    });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.finalize.mockResolvedValue({ ok: true });
    render(<ShipmentDocuments shipmentId={shipmentId} documents={[]} />);

    const file = new File(["%PDF-1.4"], "proof.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });

    await waitFor(() => expect(mocks.finalize).toHaveBeenCalled());
    expect(mocks.prepare).toHaveBeenCalledWith({
      shipmentId,
      originalName: "proof.pdf",
      mimeType: "application/pdf",
      sizeBytes: file.size,
    });
    expect(mocks.upload).toHaveBeenCalledWith(
      `${shipmentId}/${shipmentId}/document`,
      file,
      { contentType: "application/pdf", upsert: false },
    );
    expect(mocks.upload.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.finalize.mock.invocationCallOrder[0],
    );
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Document uploaded");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("rejects unsupported files before creating metadata", async () => {
    render(<ShipmentDocuments shipmentId={shipmentId} documents={[]} />);

    const file = new File(["plain text"], "notes.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only PDF, JPEG and PNG files are supported.",
    );
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("removes pending metadata when the Storage upload fails", async () => {
    const documentId = "22222222-2222-4222-8222-222222222222";
    mocks.prepare.mockResolvedValue({
      ok: true,
      document: { id: documentId, storagePath: `${shipmentId}/${shipmentId}/document` },
    });
    mocks.upload.mockResolvedValue({ error: { message: "denied" } });
    mocks.remove.mockResolvedValue({ ok: true });
    render(<ShipmentDocuments shipmentId={shipmentId} documents={[]} />);

    const file = new File(["image"], "proof.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload document"), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("The file could not be uploaded");
    expect(mocks.remove).toHaveBeenCalledWith(documentId);
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
});
