import { describe, expect, it } from "vitest";
import {
  calculateMarginPercent,
  calculateProfit,
  convertToReportingCurrency,
  fromMinorUnits,
  toMinorUnits,
} from "./calculations";

describe("freight calculations", () => {
  it("calculates profit after all costs", () => {
    expect(calculateProfit(4200, 3300, 150)).toBe(750);
  });

  it("calculates and rounds margin", () => {
    expect(calculateMarginPercent(750, 4200)).toBe(17.86);
  });

  it("returns zero margin for zero revenue", () => {
    expect(calculateMarginPercent(-100, 0)).toBe(0);
  });

  it("preserves a loss", () => {
    expect(calculateProfit(100, 120, 10)).toBe(-30);
  });

  it("converts using the stored FX snapshot", () => {
    expect(convertToReportingCurrency(100, 4.28)).toBe(428);
  });

  it("rounds half cents away from zero", () => {
    expect(toMinorUnits(1.005)).toBe(101);
    expect(toMinorUnits(-1.005)).toBe(-101);
    expect(fromMinorUnits(101)).toBe(1.01);
  });

  it("supports small stored exchange rates", () => {
    expect(convertToReportingCurrency(10_000, 0.000_001)).toBe(0.01);
  });
});
