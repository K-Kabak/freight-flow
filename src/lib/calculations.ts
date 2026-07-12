export function calculateProfit(clientPrice: number, carrierCost: number, additionalCosts: number): number {
  return Number((clientPrice - carrierCost - additionalCosts).toFixed(2));
}

export function calculateMarginPercent(profit: number, clientPrice: number): number {
  if (clientPrice === 0) return 0;
  return Number(((profit / clientPrice) * 100).toFixed(2));
}

export function convertToReportingCurrency(value: number, exchangeRateToBase: number): number {
  return Number((value * exchangeRateToBase).toFixed(2));
}
