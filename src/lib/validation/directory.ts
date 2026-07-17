import { z } from "zod";

const contactFields = {
  company_name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  contact_person: z.string().trim().min(2, "Enter a contact person.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(5, "Enter a valid phone number.").max(40),
};

export const clientFormSchema = z.object({
  ...contactFields,
  tax_id: z.string().trim().min(3, "Enter a valid Tax / VAT ID.").max(40),
});

export const carrierFormSchema = z.object({
  ...contactFields,
  country: z.string().trim().min(2, "Enter a country.").max(80),
  vehicle_type: z.string().trim().min(2, "Enter a vehicle type.").max(80),
  rating: z.coerce.number().int().min(1).max(5),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type CarrierFormValues = z.infer<typeof carrierFormSchema>;
