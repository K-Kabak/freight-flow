export const shipmentStatuses = ["New", "Accepted", "In Transit", "Delivered", "Cancelled", "Issue"] as const;
export const currencies = ["PLN", "EUR", "USD"] as const;
export type ShipmentStatus = (typeof shipmentStatuses)[number];
export type Currency = (typeof currencies)[number];

export interface Shipment {
  id: string; referenceNumber: string; pickupCity: string; deliveryCity: string;
  clientId: string; client: string; carrierId: string; carrier: string;
  pickupDate: string; deliveryDate: string; clientPrice: number; carrierCost: number;
  additionalCosts: number; profit: number; marginPercent: number; currency: Currency;
  exchangeRateToBase: number; status: ShipmentStatus; notes?: string;
}
export interface Client { id: string; companyName: string; taxId: string; contactPerson: string; email: string; phone: string; totalShipments: number; totalRevenue: number; averageMargin: number; }
export interface Carrier { id: string; companyName: string; country: string; contactPerson: string; email: string; phone: string; vehicleType: string; rating: number; completedShipments: number; }
