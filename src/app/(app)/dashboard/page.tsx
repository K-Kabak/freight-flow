import Link from "next/link";
import {
  ArrowUpRight,
  CircleDollarSign,
  PackageCheck,
  Percent,
  Plus,
  Route,
  WalletCards,
} from "lucide-react";
import { PerformanceChart } from "@/components/analytics/performance-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { shipments } from "@/data/mock-data";
import { formatMoney } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Operations overview"
        description="Sample KPIs and charts; live shipment management is available in Shipments."
      >
        <Link href="/shipments/new">
          <Button><Plus size={17} />Add shipment</Button>
        </Link>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Active Shipments" value="7" detail="Sample data" icon={Route} />
        <KpiCard label="Completed This Month" value="24" detail="Sample data" icon={PackageCheck} />
        <KpiCard label="Monthly Revenue" value="PLN 48,200" detail="Sample data" icon={CircleDollarSign} />
        <KpiCard label="Monthly Costs" value="PLN 36,700" detail="Sample data" icon={WalletCards} tone="amber" />
        <KpiCard label="Monthly Profit" value="PLN 11,500" detail="Sample data" icon={ArrowUpRight} />
        <KpiCard label="Average Margin" value="23.8%" detail="Sample data" icon={Percent} tone="blue" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-semibold text-slate-900">Financial performance</h2>
              <p className="mt-1 text-xs text-slate-500">Sample six-month revenue, costs and profit</p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span>● Revenue</span><span className="text-slate-400">● Costs</span><span className="text-amber-500">● Profit</span>
            </div>
          </CardHeader>
          <CardContent><PerformanceChart /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <h2 className="font-semibold">Shipment preview</h2>
              <p className="mt-1 text-xs text-slate-500">Sample operational data</p>
            </div>
            <Link href="/shipments" className="text-xs font-semibold text-emerald-700">Open live list</Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {shipments.slice(0, 4).map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
                <div>
                  <p className="text-sm font-semibold">{shipment.referenceNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">{shipment.pickupCity} → {shipment.deliveryCity}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={shipment.status} />
                  <p className="mt-1.5 text-xs font-medium">{formatMoney(shipment.profit, shipment.currency)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
