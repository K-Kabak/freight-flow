import type { Carrier, Client, Shipment } from "@/types";

export const shipments: Shipment[] = [
  { id:"1", referenceNumber:"FR-001", pickupCity:"Gdańsk", deliveryCity:"Berlin", clientId:"1", client:"IKEA Distribution", carrierId:"1", carrier:"Kowalski Transport", pickupDate:"2026-07-18", deliveryDate:"2026-07-19", clientPrice:4200, carrierCost:3300, additionalCosts:150, profit:750, marginPercent:17.86, currency:"PLN", exchangeRateToBase:1, status:"In Transit", notes:"Dock 4 delivery" },
  { id:"2", referenceNumber:"FR-002", pickupCity:"Poznań", deliveryCity:"Prague", clientId:"2", client:"FreshMarket Logistics", carrierId:"2", carrier:"EuroTrans", pickupDate:"2026-07-20", deliveryDate:"2026-07-21", clientPrice:3600, carrierCost:2850, additionalCosts:100, profit:650, marginPercent:18.06, currency:"PLN", exchangeRateToBase:1, status:"Accepted" },
  { id:"3", referenceNumber:"FR-003", pickupCity:"Warsaw", deliveryCity:"Hamburg", clientId:"3", client:"Nordic Furniture", carrierId:"3", carrier:"Baltic Cargo", pickupDate:"2026-07-22", deliveryDate:"2026-07-24", clientPrice:5100, carrierCost:4100, additionalCosts:220, profit:780, marginPercent:15.29, currency:"PLN", exchangeRateToBase:1, status:"New" },
  { id:"4", referenceNumber:"FR-004", pickupCity:"Wrocław", deliveryCity:"Vienna", clientId:"2", client:"FreshMarket Logistics", carrierId:"1", carrier:"Kowalski Transport", pickupDate:"2026-07-12", deliveryDate:"2026-07-13", clientPrice:4900, carrierCost:3600, additionalCosts:180, profit:1120, marginPercent:22.86, currency:"PLN", exchangeRateToBase:1, status:"Delivered" },
  { id:"5", referenceNumber:"FR-005", pickupCity:"Łódź", deliveryCity:"Munich", clientId:"1", client:"IKEA Distribution", carrierId:"4", carrier:"NorthWay Logistics", pickupDate:"2026-07-15", deliveryDate:"2026-07-17", clientPrice:1320, carrierCost:980, additionalCosts:45, profit:295, marginPercent:22.35, currency:"EUR", exchangeRateToBase:4.28, status:"Issue" },
  { id:"6", referenceNumber:"FR-006", pickupCity:"Kraków", deliveryCity:"Brno", clientId:"4", client:"Vistula Retail", carrierId:"2", carrier:"EuroTrans", pickupDate:"2026-07-25", deliveryDate:"2026-07-26", clientPrice:3850, carrierCost:2950, additionalCosts:120, profit:780, marginPercent:20.26, currency:"PLN", exchangeRateToBase:1, status:"Accepted" },
];

export const clients: Client[] = [
  { id:"1", companyName:"IKEA Distribution", taxId:"PL5260001691", contactPerson:"Anna Nowak", email:"anna@ikea.example", phone:"+48 600 210 480", totalShipments:18, totalRevenue:86400, averageMargin:21.4 },
  { id:"2", companyName:"FreshMarket Logistics", taxId:"PL7831824410", contactPerson:"Marek Zieliński", email:"marek@freshmarket.example", phone:"+48 601 330 119", totalShipments:12, totalRevenue:54800, averageMargin:19.8 },
  { id:"3", companyName:"Nordic Furniture", taxId:"DE291820011", contactPerson:"Lena Hoffmann", email:"lena@nordic.example", phone:"+49 151 440 829", totalShipments:9, totalRevenue:43600, averageMargin:17.6 },
  { id:"4", companyName:"Vistula Retail", taxId:"PL6762489012", contactPerson:"Piotr Lis", email:"piotr@vistula.example", phone:"+48 609 814 200", totalShipments:7, totalRevenue:29200, averageMargin:20.3 },
];

export const carriers: Carrier[] = [
  { id:"1", companyName:"Kowalski Transport", country:"Poland", contactPerson:"Jan Kowalski", email:"office@kowalski.example", phone:"+48 602 112 908", vehicleType:"Curtainsider", rating:5, completedShipments:31 },
  { id:"2", companyName:"EuroTrans", country:"Czech Republic", contactPerson:"Petr Novák", email:"dispatch@eurotrans.example", phone:"+420 602 441 190", vehicleType:"Refrigerated", rating:4, completedShipments:24 },
  { id:"3", companyName:"Baltic Cargo", country:"Poland", contactPerson:"Tomasz Maj", email:"ops@baltic.example", phone:"+48 608 111 330", vehicleType:"Mega trailer", rating:4, completedShipments:19 },
  { id:"4", companyName:"NorthWay Logistics", country:"Germany", contactPerson:"Felix Braun", email:"felix@northway.example", phone:"+49 171 882 410", vehicleType:"Box truck", rating:5, completedShipments:28 },
];

export const monthlyPerformance = [
  { month:"Feb", revenue:36200, costs:28100, profit:8100 }, { month:"Mar", revenue:41500, costs:31900, profit:9600 },
  { month:"Apr", revenue:39800, costs:30100, profit:9700 }, { month:"May", revenue:47200, costs:36100, profit:11100 },
  { month:"Jun", revenue:44900, costs:33800, profit:11100 }, { month:"Jul", revenue:48200, costs:36700, profit:11500 },
];
