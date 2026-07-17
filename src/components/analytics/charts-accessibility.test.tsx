import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { PerformanceChart } from "./performance-chart";
import { ProfitChart, StatusChart } from "./breakdown-charts";

afterEach(cleanup);

describe("chart alternatives", () => {
  it("exposes financial chart values in semantic tables", () => {
    render(
      <>
        <PerformanceChart
          currency="EUR"
          data={[{ month: "Jul", revenue: 900, costs: 720, profit: 180 }]}
        />
        <ProfitChart currency="EUR" data={[{ name: "Client", profit: 180 }]} />
      </>,
    );

    expect(screen.getByRole("table", { name: "Monthly revenue, costs and profit in EUR" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Profit by client in EUR" })).toBeInTheDocument();
  });

  it("includes status names and values in visible text", () => {
    render(<StatusChart data={[{ name: "Delivered", value: 3 }]} />);
    expect(screen.getByText("Delivered: 3")).toBeVisible();
  });
});
