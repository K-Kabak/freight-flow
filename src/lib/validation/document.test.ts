import { describe, expect, it } from "vitest";
import { documentMetadataSchema, MAX_DOCUMENT_BYTES } from "./document";

const valid = {
  shipmentId: "11111111-1111-4111-8111-111111111111",
  originalName: "signed-cmr.pdf",
  mimeType: "application/pdf" as const,
  sizeBytes: 1024,
};

describe("document metadata schema", () => {
  it("accepts the supported document contract", () => {
    expect(documentMetadataSchema.parse(valid)).toEqual(valid);
  });

  it("rejects unsupported content types and oversized files", () => {
    expect(documentMetadataSchema.safeParse({ ...valid, mimeType: "text/html" }).success).toBe(
      false,
    );
    expect(
      documentMetadataSchema.safeParse({ ...valid, sizeBytes: MAX_DOCUMENT_BYTES + 1 }).success,
    ).toBe(false);
  });

  it("rejects path separators in the displayed file name", () => {
    expect(documentMetadataSchema.safeParse({ ...valid, originalName: "../cmr.pdf" }).success).toBe(
      false,
    );
  });
});
