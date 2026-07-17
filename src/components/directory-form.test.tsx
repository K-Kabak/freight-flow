import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DirectoryForm } from "./directory-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  upsertClient: vi.fn(),
  upsertCarrier: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh, back: vi.fn() }),
}));
vi.mock("@/app/actions", () => ({
  upsertClient: mocks.upsertClient,
  upsertCarrier: mocks.upsertCarrier,
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DirectoryForm", () => {
  it("associates server field errors and focuses the first invalid control", async () => {
    mocks.upsertClient.mockResolvedValue({
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { company_name: ["Enter at least 2 characters."] },
    });
    render(<DirectoryForm type="client" />);

    fireEvent.submit(screen.getByRole("button", { name: "Create client" }).closest("form")!);

    const company = screen.getByLabelText("Company name");
    expect(await screen.findByText("Enter at least 2 characters.")).toBeVisible();
    expect(company).toHaveAttribute("aria-invalid", "true");
    expect(company).toHaveAttribute("aria-describedby", "company_name-error");
    expect(company).toHaveFocus();
    expect(screen.getByText("Check the highlighted fields.")).toHaveAttribute("role", "alert");
  });

  it("recovers from an unexpected rejected action", async () => {
    mocks.upsertCarrier.mockRejectedValue(new Error("network unavailable"));
    render(<DirectoryForm type="carrier" />);

    const submit = screen.getByRole("button", { name: "Create carrier" });
    fireEvent.submit(submit.closest("form")!);

    expect(await screen.findByText("The request could not be completed. Please try again.")).toBeVisible();
    await waitFor(() => expect(submit).toBeEnabled());
    expect(mocks.toastError).toHaveBeenCalled();
  });
});
