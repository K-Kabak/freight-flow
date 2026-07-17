import { describe, expect, it } from "vitest";
import type { Shipment } from "@/types";
import { aggregateReportingData, calculateClientFinancials } from "./reporting-calculations";

function shipment(overrides: Partial<Shipment> = {}): Shipment {
  return {
    id: crypto.randomUUID(),
    referenceNumber: "FR-001",
    pickupCity: "Warsaw",
    deliveryCity: "Berlin",
    clientId: "client-1",
    client: "Acme",
    carrierId: "carrier-1",
    carrier: "Carrier One",
    pickupDate: "2026-07-10",
    deliveryDate: "2026-07-11",
    clientPrice: 1000,
    carrierCost: 700,
    additionalCosts: 100,
    profit: 200,
    marginPercent: 20,
    currency: "USD",
    exchangeRateToBase: 0.9,
    status: "New",
    ...overrides,
  };
}

describe("reporting aggregation", () => {
  it("returns deterministic empty reporting periods", () => {
    const report = aggregateReportingData([], new Date("2026-01-15T23:30:00Z"), []);

    expect(report).toMatchObject({
      revenue: 0,
      costs: 0,
      profit: 0,
      averageMargin: 0,
      active: 0,
      completedThisMonth: 0,
      shipmentCount: 0,
    });
    expect(report.monthly.map((point) => point.month)).toEqual([
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
    ]);
  });

  it("aggregates FX snapshots, statuses, clients and carriers", () => {
    const rows = [
      shipment({ status: "Delivered" }),
      shipment({
        id: "shipment-2",
        referenceNumber: "FR-002",
        client: "Beta",
        carrier: "Carrier Two",
        pickupDate: "2026-06-30",
        deliveryDate: "2026-07-01",
        clientPrice: 500,
        carrierCost: 550,
        additionalCosts: 0,
        profit: -50,
        currency: "EUR",
        exchangeRateToBase: 1,
        status: "Issue",
      }),
    ];

    const report = aggregateReportingData(
      rows,
      new Date("2026-07-17T00:30:00Z"),
      ["Carrier One", "Carrier Two"],
    );

    expect(report).toMatchObject({
      revenue: 1400,
      costs: 1270,
      profit: 130,
      averageMargin: 9.29,
      active: 1,
      completedThisMonth: 1,
      shipmentCount: 2,
    });
    expect(report.statuses.find(({ name }) => name === "Delivered")?.value).toBe(1);
    expect(report.profitByClient).toEqual([
      { name: "Acme", profit: 180 },
      { name: "Beta", profit: -50 },
    ]);
    expect(report.topCarriers[0]).toEqual({ name: "Carrier One", completed: 1 });
    expect(report.monthly.at(-1)).toMatchObject({ month: "Jul", revenue: 900, profit: 180 });
  });

  it("keeps aggregate profit equal to rounded revenue less rounded costs", () => {
    const report = aggregateReportingData(
      [
        shipment({
          clientPrice: 0.05,
          carrierCost: 0.02,
          additionalCosts: 0.02,
          profit: 0.01,
          exchangeRateToBase: 0.1,
        }),
      ],
      new Date("2026-07-17T00:00:00Z"),
      ["Carrier One"],
    );

    expect(report.revenue).toBe(0.01);
    expect(report.costs).toBe(0);
    expect(report.profit).toBe(report.revenue - report.costs);
  });

  it("calculates weighted client margin from converted minor units", () => {
    expect(
      calculateClientFinancials([
        shipment(),
        shipment({ clientPrice: 100, carrierCost: 120, additionalCosts: 0, exchangeRateToBase: 1 }),
      ]),
    ).toEqual({ totalShipments: 2, totalRevenue: 1000, averageMargin: 16 });
  });

  it("uses stable alphabetical tie breakers and limits rankings", () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      shipment({
        id: `shipment-${index}`,
        referenceNumber: `FR-00${index}`,
        client: `Client ${String.fromCharCode(71 - index)}`,
        carrier: `Carrier ${index}`,
        clientPrice: 100,
        carrierCost: 80,
        additionalCosts: 0,
        exchangeRateToBase: 1,
      }),
    );
    const report = aggregateReportingData(
      rows,
      new Date("2026-07-17T00:00:00Z"),
      rows.map((row) => row.carrier),
    );

    expect(report.topClients).toHaveLength(5);
    expect(report.topClients.map(({ name }) => name)).toEqual([
      "Client A",
      "Client B",
      "Client C",
      "Client D",
      "Client E",
    ]);
    expect(report.recent).toHaveLength(4);
  });
});
