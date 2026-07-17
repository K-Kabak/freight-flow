import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ShipmentForm } from "./shipment-form";

const mocks = vi.hoisted(() => ({
  upsertShipment: vi.fn(),
  createStarterDirectory: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/app/actions", () => ({
  upsertShipment: mocks.upsertShipment,
  createStarterDirectory: mocks.createStarterDirectory,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const props = {
  clients: [{ id: "11111111-1111-4111-8111-111111111111", companyName: "Client" }],
  carriers: [{ id: "22222222-2222-4222-8222-222222222222", companyName: "Carrier" }],
  reportingCurrency: "PLN" as const,
  isDemo: false,
};

describe("ShipmentForm", () => {
  it("requires a manual FX snapshot only for a foreign currency", () => {
    render(<ShipmentForm {...props} />);

    expect(screen.queryByLabelText(/in reporting currency/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "EUR" } });
    expect(screen.getByLabelText("1 EUR in reporting currency (PLN)")).toBeRequired();
  });

  it("renders accessible action errors and restores the submit button", async () => {
    mocks.upsertShipment.mockResolvedValue({
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { reference_number: ["Reference is already used."] },
    });
    render(<ShipmentForm {...props} />);

    const submit = screen.getByRole("button", { name: "Create shipment" });
    fireEvent.submit(submit.closest("form")!);

    const reference = screen.getByLabelText("Reference number");
    expect(await screen.findByText("Reference is already used.")).toBeVisible();
    expect(reference).toHaveFocus();
    expect(reference).toHaveAttribute("aria-describedby", "reference_number-error");
    await waitFor(() => expect(submit).toBeEnabled());
  });
});
