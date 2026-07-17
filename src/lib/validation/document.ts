import { z } from "zod";

export const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;
export const documentMimeTypes = ["application/pdf", "image/jpeg", "image/png"] as const;

export const documentMetadataSchema = z.object({
  shipmentId: z.string().uuid(),
  originalName: z
    .string()
    .trim()
    .min(1, "Choose a file to upload.")
    .max(255, "The file name is too long.")
    .refine((name) => !/[\\/]/.test(name), "The file name is invalid."),
  mimeType: z.enum(documentMimeTypes, {
    error: "Only PDF, JPEG and PNG files are supported.",
  }),
  sizeBytes: z
    .number()
    .int()
    .min(1, "The file is empty.")
    .max(MAX_DOCUMENT_BYTES, "The file cannot exceed 6 MiB."),
});
