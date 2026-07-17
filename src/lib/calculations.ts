export function toMinorUnits(value: number, exchangeRateToBase = 1): number {
  const converted = value * exchangeRateToBase;
  const roundedMagnitude = Math.round((Math.abs(converted) + Number.EPSILON) * 100);
  return converted < 0 ? -roundedMagnitude : roundedMagnitude;
}

export function fromMinorUnits(value: number): number {
  return value / 100;
}

export function calculateProfit(clientPrice: number, carrierCost: number, additionalCosts: number): number {
  return fromMinorUnits(toMinorUnits(clientPrice - carrierCost - additionalCosts));
}

export function calculateMarginPercent(profit: number, clientPrice: number): number {
  if (clientPrice === 0) return 0;
  return fromMinorUnits(toMinorUnits((profit / clientPrice) * 100));
}

export function convertToReportingCurrency(value: number, exchangeRateToBase: number): number {
  return fromMinorUnits(toMinorUnits(value, exchangeRateToBase));
}
