import { describe, expect, it } from "vitest";
import { safeDestination } from "./route";

describe("auth callback destination", () => {
  it("keeps internal paths with their query string", () => {
    expect(safeDestination("/reset-password?source=recovery")).toBe(
      "/reset-password?source=recovery",
    );
  });

  it.each([
    null,
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "/%5Cevil.example/path",
  ])("falls back for an unsafe destination: %s", (destination) => {
    expect(safeDestination(destination)).toBe("/dashboard");
  });
});
