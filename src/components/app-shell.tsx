"use client";

import { useCallback, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { signOut } from "@/app/actions";
import { AppSidebar } from "./app-sidebar";

export function AppShell({
  children,
  fullName,
  email,
  isDemo,
}: {
  children: React.ReactNode;
  fullName: string;
  email: string;
  isDemo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => menuButton.current?.focus());
  }, []);

  return (
    <div className="min-h-screen">
      <AppSidebar open={open} close={close} isDemo={isDemo} />
      <div className="lg:pl-64 print:pl-0">
        <header className="sticky top-0 z-20 flex h-20 items-center border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8 print:hidden">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="app-navigation"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
            >
              {initials}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
              <p className="text-xs text-slate-500">{isDemo ? "Demo workspace" : email}</p>
            </div>
            {!isDemo && (
              <form action={signOut}>
                <button className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </header>
        <main className="p-4 sm:p-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
