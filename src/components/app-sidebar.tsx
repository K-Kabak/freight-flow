"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { BarChart3, Boxes, Building2, LayoutDashboard, Settings, Truck, X } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Boxes },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/carriers", label: "Carriers", icon: Truck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  open,
  close,
  isDemo,
}: {
  open: boolean;
  close: () => void;
  isDemo: boolean;
}) {
  const path = usePathname();
  const sidebar = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [...(sidebar.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [])];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [close, open]);

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={close}
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/30 lg:hidden print:hidden",
          open ? "block" : "hidden",
        )}
      />
      <aside
        id="app-navigation"
        ref={sidebar}
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-white">
              <Truck size={19} aria-hidden="true" />
            </span>
            <span className="text-lg">FreightFlow</span>
          </Link>
          <button
            ref={closeButton}
            type="button"
            aria-label="Close navigation"
            onClick={close}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Workspace">
          {items.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="m-4 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-900">
            {isDemo ? "Demo workspace" : "Private workspace"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isDemo
              ? "Portfolio data is read-only."
              : "Shipment data is stored in your Supabase account."}
          </p>
        </div>
      </aside>
    </>
  );
}
