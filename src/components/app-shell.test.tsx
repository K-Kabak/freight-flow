import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@/app/actions", () => ({ signOut: vi.fn() }));

afterEach(cleanup);

describe("AppShell keyboard navigation", () => {
  it("moves focus into the mobile navigation and returns it on Escape", async () => {
    render(
      <AppShell fullName="Test User" email="test@example.com" isDemo>
        <p>Content</p>
      </AppShell>,
    );
    const opener = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(opener);
    const closeButtons = screen.getAllByRole("button", { name: "Close navigation" });
    await waitFor(() => expect(closeButtons[1]).toHaveFocus());
    expect(opener).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(opener).toHaveFocus());
    expect(opener).toHaveAttribute("aria-expanded", "false");
  });
});
