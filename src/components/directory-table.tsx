"use client";
import { useState } from "react";
import { Search, Star } from "lucide-react";
import { clients, carriers } from "@/data/mock-data";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";

export function DirectoryTable({ type }: { type: "clients" | "carriers" }) {
  const [query, setQuery] = useState("");
  const matches = (name: string) => name.toLowerCase().includes(query.toLowerCase());
  const headers = type === "clients" ? ["Company", "Tax ID", "Contact", "Total shipments", "Revenue", "Avg. margin"] : ["Company", "Country", "Contact", "Vehicle type", "Rating", "Completed"];
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="relative border-b p-4"><Search className="absolute left-7 top-7 text-slate-400" size={16}/><Input value={query} onChange={event => setQuery(event.target.value)} className="max-w-md pl-9" placeholder={`Search ${type}…`}/></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{headers.map(header => <th className="px-5 py-3" key={header}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
      {type === "clients" ? clients.filter(client => matches(client.companyName)).map(client => <tr className="hover:bg-slate-50" key={client.id}><td className="px-5 py-4 font-semibold">{client.companyName}</td><td className="px-5 py-4 text-slate-500">{client.taxId}</td><td className="px-5 py-4"><p>{client.contactPerson}</p><p className="text-xs text-slate-500">{client.email}</p></td><td className="px-5 py-4">{client.totalShipments}</td><td className="px-5 py-4 font-medium">{formatMoney(client.totalRevenue)}</td><td className="px-5 py-4 text-emerald-700">{client.averageMargin}%</td></tr>) : carriers.filter(carrier => matches(carrier.companyName)).map(carrier => <tr className="hover:bg-slate-50" key={carrier.id}><td className="px-5 py-4 font-semibold">{carrier.companyName}</td><td className="px-5 py-4">{carrier.country}</td><td className="px-5 py-4"><p>{carrier.contactPerson}</p><p className="text-xs text-slate-500">{carrier.email}</p></td><td className="px-5 py-4">{carrier.vehicleType}</td><td className="px-5 py-4"><span className="flex items-center gap-1 font-medium"><Star size={15} className="fill-amber-400 text-amber-400"/>{carrier.rating}.0</span></td><td className="px-5 py-4">{carrier.completedShipments}</td></tr>)}
    </tbody></table></div>
  </div>;
}
