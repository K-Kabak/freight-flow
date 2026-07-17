import Link from "next/link";
import { Search, Star } from "lucide-react";
import { DirectoryRowActions } from "@/components/directory-row-actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { DirectoryPage } from "@/lib/data/directories";
import { formatMoney } from "@/lib/utils";
import type { Carrier, Client } from "@/types";

type Props =
  | { type: "clients"; data: DirectoryPage<Client>; query: string; sort: string }
  | { type: "carriers"; data: DirectoryPage<Carrier>; query: string; sort: string };

export function DirectoryTable(props: Props) {
  const { type, data, query, sort } = props;
  const href = (page: number) =>
    `/${type}?q=${encodeURIComponent(query)}&sort=${sort}&page=${page}`;
  const headers =
    type === "clients"
      ? ["Company", "Tax ID", "Contact", "Shipments", "Revenue", "Avg. margin", "Actions"]
      : ["Company", "Country", "Contact", "Vehicle type", "Rating", "Completed", "Actions"];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {data.isDemo && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Read-only portfolio data. Sign in with Supabase configured to manage this directory.
        </div>
      )}
      <form aria-label={`Filter ${type}`} className="flex flex-col gap-3 border-b p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-3 text-slate-500" size={16} />
          <Input
            aria-label={`Search ${type}`}
            name="q"
            defaultValue={query}
            className="pl-9"
            placeholder={`Search ${type}…`}
          />
        </div>
        <Select aria-label={`Sort ${type}`} name="sort" defaultValue={sort} className="sm:w-44">
          <option value="name">Company name</option>
          {type === "clients" ? (
            <>
              <option value="revenue">Revenue</option>
              <option value="shipments">Shipments</option>
            </>
          ) : (
            <>
              <option value="rating">Rating</option>
              <option value="completed">Completed</option>
            </>
          )}
        </Select>
        <Button variant="outline">Apply</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <caption className="sr-only">
            {type === "clients" ? "Client directory" : "Carrier directory"}
          </caption>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {headers.map((header) => (
                <th scope="col" className="px-5 py-3" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {type === "clients"
              ? props.data.items.map((client) => (
                  <tr className="hover:bg-slate-50" key={client.id}>
                    <td className="px-5 py-4 font-semibold">
                      <Link
                        className="text-emerald-800 hover:underline"
                        href={`/clients/${client.id}`}
                      >
                        {client.companyName}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{client.taxId}</td>
                    <td className="px-5 py-4">
                      <p>{client.contactPerson}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </td>
                    <td className="px-5 py-4">{client.totalShipments}</td>
                    <td className="px-5 py-4 font-medium">{formatMoney(client.totalRevenue)}</td>
                    <td className="px-5 py-4 text-emerald-700">{client.averageMargin}%</td>
                    <td className="px-5 py-4">
                      {!data.isDemo && <DirectoryRowActions type="client" id={client.id} />}
                    </td>
                  </tr>
                ))
              : props.data.items.map((carrier) => (
                  <tr className="hover:bg-slate-50" key={carrier.id}>
                    <td className="px-5 py-4 font-semibold">
                      <Link
                        className="text-emerald-800 hover:underline"
                        href={`/carriers/${carrier.id}`}
                      >
                        {carrier.companyName}
                      </Link>
                    </td>
                    <td className="px-5 py-4">{carrier.country}</td>
                    <td className="px-5 py-4">
                      <p>{carrier.contactPerson}</p>
                      <p className="text-xs text-slate-500">{carrier.email}</p>
                    </td>
                    <td className="px-5 py-4">{carrier.vehicleType}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 font-medium">
                        <Star
                          aria-hidden="true"
                          size={15}
                          className="fill-amber-500 text-amber-600"
                        />
                        {carrier.rating}.0
                      </span>
                    </td>
                    <td className="px-5 py-4">{carrier.completedShipments}</td>
                    <td className="px-5 py-4">
                      {!data.isDemo && <DirectoryRowActions type="carrier" id={carrier.id} />}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!data.items.length && (
          <div className="p-12 text-center text-sm text-slate-500">No {type} found.</div>
        )}
      </div>
      <div className="flex items-center justify-between border-t px-5 py-4 text-sm text-slate-500">
        <span>{data.total} {type}</span>
        <nav aria-label={`${type} pages`} className="flex items-center gap-3">
          {data.page === 1 ? (
            <span aria-disabled="true" className="opacity-40">Previous</span>
          ) : (
            <Link href={href(data.page - 1)}>Previous</Link>
          )}
          <span>{data.page} / {data.pageCount}</span>
          {data.page === data.pageCount ? (
            <span aria-disabled="true" className="opacity-40">Next</span>
          ) : (
            <Link href={href(data.page + 1)}>Next</Link>
          )}
        </nav>
      </div>
    </div>
  );
}
