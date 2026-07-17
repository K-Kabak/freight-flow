import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SettingsForm } from "./settings-form";

const mocks = vi.hoisted(() => ({ updateProfile: vi.fn() }));

vi.mock("@/app/actions", () => ({ updateProfile: mocks.updateProfile }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SettingsForm", () => {
  it("shows profile validation errors without leaving the form busy", async () => {
    mocks.updateProfile.mockResolvedValue({
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: { full_name: ["Enter at least 2 characters."] },
    });
    render(<SettingsForm fullName="A" email="owner@example.com" currency="PLN" />);

    const submit = screen.getByRole("button", { name: "Save settings" });
    fireEvent.submit(submit.closest("form")!);

    expect(await screen.findByText("Enter at least 2 characters.")).toBeVisible();
    expect(screen.getByLabelText("Full name")).toHaveFocus();
    await waitFor(() => expect(submit).toBeEnabled());
  });
});
