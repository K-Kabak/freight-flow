"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Building2, LayoutDashboard, Settings, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { href:"/dashboard", label:"Dashboard", icon:LayoutDashboard }, { href:"/shipments", label:"Shipments", icon:Boxes },
  { href:"/clients", label:"Clients", icon:Building2 }, { href:"/carriers", label:"Carriers", icon:Truck },
  { href:"/analytics", label:"Analytics", icon:BarChart3 }, { href:"/settings", label:"Settings", icon:Settings },
];
export function AppSidebar({ open, close, isDemo }: { open:boolean; close:()=>void; isDemo:boolean }) {
  const path = usePathname();
  return <><div onClick={close} className={cn("fixed inset-0 z-30 bg-slate-950/30 lg:hidden", open?"block":"hidden")} /><aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0", open?"translate-x-0":"-translate-x-full")}>
    <div className="flex h-20 items-center justify-between px-6"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900"><span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Truck size={19}/></span><span className="text-lg">FreightFlow</span></Link><button onClick={close} className="lg:hidden"><X size={20}/></button></div>
    <nav className="flex-1 space-y-1 px-3">{items.map(({href,label,icon:Icon})=>{const active=path===href||path.startsWith(href+"/");return <Link key={href} href={href} onClick={close} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active?"bg-emerald-50 text-emerald-800":"text-slate-600 hover:bg-slate-50 hover:text-slate-900")}><Icon size={18}/>{label}</Link>})}</nav>
    <div className="m-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-900">{isDemo?"Demo workspace":"Private workspace"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{isDemo?"Portfolio data is read-only.":"Shipment data is stored in your Supabase account."}</p></div>
  </aside></>;
}
