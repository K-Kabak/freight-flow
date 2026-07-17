import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { ShipmentRowActions } from "./shipment-row-actions";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate, formatMoney } from "@/lib/utils";
import { shipmentStatuses, type Shipment } from "@/types";

export function ShipmentsTable({
  shipments,
  total,
  page,
  pageCount,
  isDemo,
  query,
  status,
  sort,
}: {
  shipments: Shipment[];
  total: number;
  page: number;
  pageCount: number;
  isDemo: boolean;
  query: string;
  status: string;
  sort: string;
}) {
  const href = (target: number) =>
    `/shipments?q=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}&sort=${sort}&page=${target}`;
  const headers = [
    "Reference",
    "Route",
    "Client / Carrier",
    "Dates",
    "Revenue",
    "Profit",
    "Margin",
    "Status",
    ...(isDemo ? [] : ["Actions"]),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {isDemo && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Read-only demo data. Live workspaces load shipments from Supabase.
        </div>
      )}
      <form aria-label="Filter shipments" className="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} />
          <Input
            aria-label="Search shipments"
            name="q"
            defaultValue={query}
            placeholder="Search reference or route…"
            className="pl-9"
          />
        </div>
        <div className="relative sm:w-48">
          <SlidersHorizontal
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3 text-slate-500"
            size={16}
          />
          <Select aria-label="Filter by status" name="status" defaultValue={status} className="pl-9">
            <option>All</option>
            {shipmentStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Select>
        </div>
        <Select aria-label="Sort shipments" name="sort" defaultValue={sort} className="sm:w-44">
          <option value="pickup">Pickup date</option>
          <option value="reference">Reference</option>
          <option value="profit">Profit</option>
          <option value="status">Status</option>
        </Select>
        <Button variant="outline">Apply</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <caption className="sr-only">Shipments and their financial status</caption>
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {headers.map((header) => (
                <th scope="col" key={header} className="px-5 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <Link
                    className="font-semibold text-emerald-800 hover:underline"
                    href={`/shipments/${shipment.id}`}
                  >
                    {shipment.referenceNumber}
                  </Link>
                </td>
                <td className="px-5 py-4 font-medium">
                  {shipment.pickupCity} <span aria-hidden="true">→</span> {shipment.deliveryCity}
                </td>
                <td className="px-5 py-4">
                  <p>{shipment.client}</p>
                  <p className="mt-1 text-xs text-slate-500">{shipment.carrier}</p>
                </td>
                <td className="px-5 py-4">
                  <p>{formatDate(shipment.pickupDate)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    to {formatDate(shipment.deliveryDate)}
                  </p>
                </td>
                <td className="px-5 py-4 font-medium">
                  {formatMoney(shipment.clientPrice, shipment.currency)}
                </td>
                <td className="px-5 py-4 font-semibold text-emerald-700">
                  {formatMoney(shipment.profit, shipment.currency)}
                </td>
                <td className="px-5 py-4">{shipment.marginPercent}%</td>
                <td className="px-5 py-4">
                  <StatusBadge status={shipment.status} />
                </td>
                {!isDemo && (
                  <td className="px-5 py-4">
                    <ShipmentRowActions id={shipment.id} status={shipment.status} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!shipments.length && (
          <div className="p-12 text-center text-sm text-slate-500">
            No shipments match the current filters.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-slate-500">
        <span>{total} shipments</span>
        <nav aria-label="Shipment pages" className="flex items-center gap-3">
          {page === 1 ? (
            <span aria-disabled="true" className="opacity-40">Previous</span>
          ) : (
            <Link href={href(page - 1)}>Previous</Link>
          )}
          <span>{page} / {pageCount}</span>
          {page === pageCount ? (
            <span aria-disabled="true" className="opacity-40">Next</span>
          ) : (
            <Link href={href(page + 1)}>Next</Link>
          )}
        </nav>
      </div>
    </div>
  );
}
