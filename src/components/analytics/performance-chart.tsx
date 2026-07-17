"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyPoint } from "@/lib/data/reporting";
import type { Currency } from "@/types";

export function PerformanceChart({ data, currency }: { data: MonthlyPoint[]; currency: Currency }) {
  return (
    <>
      <div aria-hidden="true" className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -12, right: 8, top: 10 }}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#176b57" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#176b57" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef0f3" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip formatter={(value) => `${currency} ${Number(value).toLocaleString()}`} />
            <Area type="monotone" dataKey="revenue" stroke="#176b57" strokeWidth={2.5} fill="url(#revenue)" />
            <Area type="monotone" dataKey="costs" stroke="#64748b" strokeWidth={2} fill="transparent" />
            <Area type="monotone" dataKey="profit" stroke="#b45309" strokeWidth={2} fill="transparent" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Monthly revenue, costs and profit in {currency}</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th><th scope="col">Costs</th><th scope="col">Profit</th></tr></thead>
        <tbody>{data.map((point)=><tr key={point.month}><th scope="row">{point.month}</th><td>{point.revenue}</td><td>{point.costs}</td><td>{point.profit}</td></tr>)}</tbody>
      </table>
    </>
  );
}
