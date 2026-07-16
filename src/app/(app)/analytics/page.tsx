import { CircleDollarSign, Info, PackageCheck, Percent, TrendingUp } from "lucide-react";
import { ProfitChart, StatusChart } from "@/components/analytics/breakdown-charts";
import { PerformanceChart } from "@/components/analytics/performance-chart";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { carriers, clients } from "@/data/mock-data";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Sample reporting preview; live Supabase aggregates are planned for Stage 2.">
        <Button variant="outline" disabled><Info size={16} />Demo data</Button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Monthly Revenue" value="PLN 48,200" detail="Sample data" icon={CircleDollarSign} />
        <KpiCard label="Monthly Profit" value="PLN 11,500" detail="Sample data" icon={TrendingUp} />
        <KpiCard label="Average Margin" value="23.8%" detail="Sample data" icon={Percent} tone="blue" />
        <KpiCard label="Shipments" value="40" detail="Sample data" icon={PackageCheck} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="xl:col-span-2"><CardHeader><div><h2 className="font-semibold">Revenue, costs &amp; profit</h2><p className="text-xs text-slate-500">Sample six-month performance</p></div></CardHeader><CardContent><PerformanceChart /></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Shipments by status</h2></CardHeader><CardContent><StatusChart /></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Profit by client</h2></CardHeader><CardContent><ProfitChart /></CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Top clients by revenue</h2></CardHeader><CardContent className="space-y-4">{clients.slice(0, 3).map((client, index) => <div className="flex items-center justify-between" key={client.id}><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span><span className="text-sm font-medium">{client.companyName}</span></div><span className="text-sm font-semibold">PLN {client.totalRevenue.toLocaleString()}</span></div>)}</CardContent></Card>
        <Card><CardHeader><h2 className="font-semibold">Top carriers</h2></CardHeader><CardContent className="space-y-4">{[...carriers].sort((a, b) => b.completedShipments - a.completedShipments).slice(0, 3).map((carrier, index) => <div className="flex items-center justify-between" key={carrier.id}><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span><span className="text-sm font-medium">{carrier.companyName}</span></div><span className="text-sm text-slate-500">{carrier.completedShipments} completed</span></div>)}</CardContent></Card>
      </div>
    </>
  );
}
