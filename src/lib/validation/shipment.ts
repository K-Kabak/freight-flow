import { z } from "zod";

export const shipmentFormSchema = z.object({
  client_id: z.string().uuid("Select a client"), carrier_id: z.string().uuid("Select a carrier"),
  reference_number: z.string().trim().min(2).max(50), pickup_city: z.string().trim().min(2), delivery_city: z.string().trim().min(2),
  pickup_date: z.string().date(), delivery_date: z.string().date(), client_price: z.coerce.number().nonnegative(),
  carrier_cost: z.coerce.number().nonnegative(), additional_costs: z.coerce.number().nonnegative().default(0),
  currency: z.enum(["PLN","EUR","USD"]), exchange_rate_to_base: z.coerce.number().positive(),
  status: z.enum(["New","Accepted","In Transit","Delivered","Cancelled","Issue"]), notes: z.string().trim().max(2000).optional(),
}).refine(value => value.delivery_date >= value.pickup_date, { path:["delivery_date"], message:"Delivery cannot precede pickup" });

export type ShipmentFormValues = z.infer<typeof shipmentFormSchema>;
