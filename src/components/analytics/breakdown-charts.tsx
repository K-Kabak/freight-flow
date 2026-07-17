"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Currency, ShipmentStatus } from "@/types";

const colors = ["#2563eb", "#7c3aed", "#b45309", "#178563", "#64748b", "#dc2626"];

export function StatusChart({ data }: { data: { name: ShipmentStatus; value: number }[] }) {
  return <div className="h-64"><div aria-hidden="true" className="h-52"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={3}>{data.map((item,index)=><Cell fill={colors[index]} key={item.name}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><ul aria-label="Shipment status totals" className="flex flex-wrap justify-center gap-3">{data.map((item,index)=><li key={item.name} className="text-xs text-slate-600"><i aria-hidden="true" className="mr-1 inline-block size-2 rounded-full" style={{background:colors[index]}}/>{item.name}: {item.value}</li>)}</ul></div>;
}

export function ProfitChart({ data, currency }: { data: { name: string; profit: number }[]; currency: Currency }) {
  return <><div aria-hidden="true" className="h-72"><ResponsiveContainer><BarChart data={data} margin={{left:-15}}><CartesianGrid vertical={false} stroke="#eef0f3"/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false} tickFormatter={value=>`${value/1000}k`}/><Tooltip formatter={value=>`${currency} ${Number(value).toLocaleString()}`}/><Bar dataKey="profit" fill="#176b57" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><table className="sr-only"><caption>Profit by client in {currency}</caption><thead><tr><th scope="col">Client</th><th scope="col">Profit</th></tr></thead><tbody>{data.map(item=><tr key={item.name}><th scope="row">{item.name}</th><td>{item.profit}</td></tr>)}</tbody></table></>;
}
