import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShipmentStatusTimeline } from "./shipment-status-timeline";

describe("ShipmentStatusTimeline", () => {
  it("renders chronological audit labels and actor fallbacks", () => {
    render(
      <ShipmentStatusTimeline
        events={[
          {
            id: "2",
            shipmentId: "shipment",
            fromStatus: "New",
            toStatus: "Accepted",
            kind: "changed",
            changedAt: "2026-07-17T12:30:00Z",
            actor: { fullName: "Dispatcher", email: "dispatcher@example.com" },
          },
          {
            id: "1",
            shipmentId: "shipment",
            fromStatus: null,
            toStatus: "New",
            kind: "baseline",
            changedAt: "2026-07-16T09:00:00Z",
            actor: null,
          },
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Status changed from New to");
    expect(items[0]).toHaveTextContent("Dispatcher");
    expect(items[1]).toHaveTextContent("History started at the current status");
    expect(items[1]).toHaveTextContent("System");
  });

  it("renders an explicit empty state", () => {
    render(<ShipmentStatusTimeline events={[]} />);
    expect(screen.getByText("No status history is available.")).toBeVisible();
  });
});
