import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DirectoryTable } from "./directory-table";
import { ShipmentsTable } from "./shipments/shipments-table";

afterEach(cleanup);

describe("table semantics", () => {
  it("labels directory filters and removes disabled pagination links", () => {
    render(
      <DirectoryTable
        type="clients"
        query=""
        sort="name"
        data={{
          items: [],
          total: 0,
          page: 1,
          pageCount: 1,
          isDemo: true,
        }}
      />,
    );

    expect(screen.getByRole("form", { name: "Filter clients" })).toBeVisible();
    expect(screen.getByLabelText("Search clients")).toBeVisible();
    expect(screen.getByRole("table", { name: "Client directory" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Next" })).not.toBeInTheDocument();
  });

  it("provides shipment filter and table names", () => {
    render(
      <ShipmentsTable
        shipments={[]}
        total={0}
        page={1}
        pageCount={1}
        isDemo
        query=""
        status="All"
        sort="pickup"
      />,
    );

    expect(screen.getByRole("form", { name: "Filter shipments" })).toBeVisible();
    expect(screen.getByLabelText("Filter by status")).toBeVisible();
    expect(screen.getByRole("table", { name: "Shipments and their financial status" })).toBeVisible();
  });
});
