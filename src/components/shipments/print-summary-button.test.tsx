import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PrintSummaryButton } from "./print-summary-button";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PrintSummaryButton", () => {
  it("opens the browser print dialog", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<PrintSummaryButton />);

    fireEvent.click(screen.getByRole("button", { name: "Print / Save as PDF" }));

    expect(print).toHaveBeenCalledOnce();
  });
});
