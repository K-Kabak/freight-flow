"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen">
    <AppSidebar open={open} close={() => setOpen(false)} />
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 flex h-20 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
        <button onClick={() => setOpen(true)} aria-label="Open navigation" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"><Menu size={21}/></button>
        <div className="ml-auto flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">AK</span><div className="hidden sm:block"><p className="text-sm font-semibold text-slate-900">Alex Kowalski</p><p className="text-xs text-slate-500">Demo workspace</p></div></div>
      </header>
      <main className="p-4 sm:p-8">{children}</main>
    </div>
  </div>;
}
