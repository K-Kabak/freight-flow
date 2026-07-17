import type { Shipment } from "@/types";

const headers = [
  "Reference",
  "Status",
  "Pickup city",
  "Delivery city",
  "Pickup date",
  "Delivery date",
  "Client",
  "Carrier",
  "Currency",
  "Client price",
  "Carrier cost",
  "Additional costs",
  "Profit",
  "Margin percent",
  "FX rate to reporting currency",
  "Notes",
] as const;

export function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  const safe =
    typeof value === "string" && /^[\u0000-\u0020]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildShipmentsCsv(shipments: Shipment[]) {
  const rows = shipments.map((shipment) => [
    shipment.referenceNumber,
    shipment.status,
    shipment.pickupCity,
    shipment.deliveryCity,
    shipment.pickupDate,
    shipment.deliveryDate,
    shipment.client,
    shipment.carrier,
    shipment.currency,
    shipment.clientPrice,
    shipment.carrierCost,
    shipment.additionalCosts,
    shipment.profit,
    shipment.marginPercent,
    shipment.exchangeRateToBase,
    shipment.notes ?? "",
  ]);

  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map((value) => csvCell(value)).join(","))
    .join("\r\n")}\r\n`;
}
