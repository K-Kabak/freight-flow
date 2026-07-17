import { fromMinorUnits, toMinorUnits } from "@/lib/calculations";
import type { Shipment, ShipmentStatus } from "@/types";

export type MonthlyPoint = { month: string; revenue: number; costs: number; profit: number };

export type ReportingSummary = {
  active: number;
  completedThisMonth: number;
  revenue: number;
  costs: number;
  profit: number;
  averageMargin: number;
  shipmentCount: number;
  monthly: MonthlyPoint[];
  statuses: { name: ShipmentStatus; value: number }[];
  profitByClient: { name: string; profit: number }[];
  topClients: { name: string; revenue: number }[];
  topCarriers: { name: string; completed: number }[];
  recent: Shipment[];
};

const statuses: ShipmentStatus[] = [
  "New",
  "Accepted",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Issue",
];

type FinancialShipment = Pick<
  Shipment,
  "clientPrice" | "carrierCost" | "additionalCosts" | "exchangeRateToBase"
>;

function convertedAmounts(shipment: FinancialShipment) {
  const revenue = toMinorUnits(shipment.clientPrice, shipment.exchangeRateToBase);
  const costs = toMinorUnits(
    shipment.carrierCost + shipment.additionalCosts,
    shipment.exchangeRateToBase,
  );
  return { revenue, costs, profit: revenue - costs };
}

function sumMoney(shipments: FinancialShipment[]) {
  const minor = shipments.reduce(
    (totals, shipment) => {
      const values = convertedAmounts(shipment);
      totals.revenue += values.revenue;
      totals.costs += values.costs;
      totals.profit += values.profit;
      return totals;
    },
    { revenue: 0, costs: 0, profit: 0 },
  );

  return {
    revenue: fromMinorUnits(minor.revenue),
    costs: fromMinorUnits(minor.costs),
    profit: fromMinorUnits(minor.profit),
  };
}

export function calculateClientFinancials(shipments: FinancialShipment[]) {
  const totals = sumMoney(shipments);
  return {
    totalShipments: shipments.length,
    totalRevenue: totals.revenue,
    averageMargin: totals.revenue
      ? Number(((totals.profit / totals.revenue) * 100).toFixed(2))
      : 0,
  };
}

export function aggregateReportingData(
  shipments: Shipment[],
  now: Date,
  carrierNames: string[],
): ReportingSummary {
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const totals = sumMoney(shipments);
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      month: date.toLocaleString("en", { month: "short", timeZone: "UTC" }),
      ...sumMoney(shipments.filter((shipment) => shipment.pickupDate.startsWith(key))),
    };
  });

  const clients = new Map<string, { revenue: number; profit: number }>();
  for (const shipment of shipments) {
    const current = clients.get(shipment.client) ?? { revenue: 0, profit: 0 };
    const values = convertedAmounts(shipment);
    current.revenue += values.revenue;
    current.profit += values.profit;
    clients.set(shipment.client, current);
  }

  const clientTotals = [...clients].map(([name, values]) => ({
    name,
    revenue: fromMinorUnits(values.revenue),
    profit: fromMinorUnits(values.profit),
  }));

  return {
    active: shipments.filter((shipment) => !["Delivered", "Cancelled"].includes(shipment.status))
      .length,
    completedThisMonth: shipments.filter(
      (shipment) =>
        shipment.status === "Delivered" && shipment.deliveryDate.startsWith(currentMonth),
    ).length,
    ...totals,
    averageMargin: totals.revenue
      ? Number(((totals.profit / totals.revenue) * 100).toFixed(2))
      : 0,
    shipmentCount: shipments.length,
    monthly,
    statuses: statuses.map((name) => ({
      name,
      value: shipments.filter((shipment) => shipment.status === name).length,
    })),
    profitByClient: clientTotals
      .map(({ name, profit }) => ({ name, profit }))
      .sort((a, b) => b.profit - a.profit || a.name.localeCompare(b.name))
      .slice(0, 5),
    topClients: clientTotals
      .map(({ name, revenue }) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name))
      .slice(0, 5),
    topCarriers: carrierNames
      .map((name) => ({
        name,
        completed: shipments.filter(
          (shipment) => shipment.carrier === name && shipment.status === "Delivered",
        ).length,
      }))
      .sort((a, b) => b.completed - a.completed || a.name.localeCompare(b.name))
      .slice(0, 5),
    recent: [...shipments]
      .sort(
        (a, b) =>
          b.pickupDate.localeCompare(a.pickupDate) ||
          a.referenceNumber.localeCompare(b.referenceNumber),
      )
      .slice(0, 4),
  };
}
