import { cn } from "@/lib/utils";
export function Button({ className, variant="primary", ...props }: React.ComponentProps<"button"> & { variant?: "primary"|"outline"|"ghost"|"danger" }) {
  const variants = { primary:"bg-brand text-white hover:bg-emerald-800", outline:"border border-slate-200 bg-white hover:bg-slate-50", ghost:"hover:bg-slate-100", danger:"bg-red-600 text-white hover:bg-red-700" };
  return <button className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", variants[variant], className)} {...props} />;
}
