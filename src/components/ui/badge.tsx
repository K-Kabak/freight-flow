import type { ShipmentStatus } from "@/types";
const styles: Record<ShipmentStatus,string> = { New:"bg-blue-50 text-blue-700", Accepted:"bg-violet-50 text-violet-700", "In Transit":"bg-amber-50 text-amber-700", Delivered:"bg-emerald-50 text-emerald-700", Cancelled:"bg-slate-100 text-slate-600", Issue:"bg-red-50 text-red-700" };
export function StatusBadge({ status }: { status: ShipmentStatus }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>; }
