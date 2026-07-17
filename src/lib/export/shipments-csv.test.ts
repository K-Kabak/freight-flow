import { describe, expect, it } from "vitest";
import { buildShipmentsCsv, csvCell } from "./shipments-csv";
import type { Shipment } from "@/types";

const shipment: Shipment = {
  id: "11111111-1111-4111-8111-111111111111",
  referenceNumber: "FF-100",
  pickupCity: "Warsaw",
  deliveryCity: "Berlin",
  clientId: "22222222-2222-4222-8222-222222222222",
  client: "Example Client",
  carrierId: "33333333-3333-4333-8333-333333333333",
  carrier: "Example Carrier",
  pickupDate: "2026-09-01",
  deliveryDate: "2026-09-02",
  clientPrice: 4200,
  carrierCost: 3300,
  additionalCosts: 100,
  profit: 800,
  marginPercent: 19.05,
  currency: "PLN",
  exchangeRateToBase: 1,
  status: "Delivered",
  notes: "Signed CMR",
};

describe("shipment CSV export", () => {
  it("quotes values and preserves embedded quotes", () => {
    expect(csvCell('Carrier "North"')).toBe('"Carrier ""North"""');
  });

  it.each(["=1+1", "+SUM(A1:A2)", "-2+3", "@cmd", "  =HYPERLINK()", "\t@SUM(1)"])(
    "neutralizes formula-like text: %s",
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("does not modify negative numeric values", () => {
    expect(csvCell(-125)).toBe('"-125"');
  });

  it("builds a UTF-8 Excel-compatible export with financial fields", () => {
    const csv = buildShipmentsCsv([shipment]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Reference","Status","Pickup city"');
    expect(csv).toContain('"FF-100","Delivered","Warsaw","Berlin"');
    expect(csv).toContain('"4200","3300","100","800","19.05","1","Signed CMR"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });
});
