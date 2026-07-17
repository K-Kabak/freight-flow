import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { PrintSummaryButton } from "@/components/shipments/print-summary-button";
import { StatusBadge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { getShipment } from "@/lib/data/shipments";
import { formatDate } from "@/lib/utils";

const moneyFormatter = (currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default async function ShipmentSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { shipment, isDemo } = await getShipment(id);
  if (!shipment || isDemo) notFound();

  const money = moneyFormatter(shipment.currency);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/shipments/${id}`} className={buttonClassName({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to shipment
        </Link>
        <PrintSummaryButton />
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3 text-emerald-800">
              <span className="grid size-10 place-items-center rounded-xl bg-brand text-white">
                <Truck aria-hidden="true" className="size-5" />
              </span>
              <span className="text-xl font-bold">FreightFlow</span>
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Transport order summary
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{shipment.referenceNumber}</h1>
          </div>
          <div className="sm:text-right">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current status
            </p>
            <StatusBadge status={shipment.status} />
          </div>
        </header>

        <section className="grid gap-8 border-b border-slate-200 py-8 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Route</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">Pickup</dt>
                <dd className="mt-1 font-semibold text-slate-900">{shipment.pickupCity}</dd>
                <dd className="text-sm text-slate-600">{formatDate(shipment.pickupDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Delivery</dt>
                <dd className="mt-1 font-semibold text-slate-900">{shipment.deliveryCity}</dd>
                <dd className="text-sm text-slate-600">{formatDate(shipment.deliveryDate)}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Parties
            </h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-xs text-slate-500">Client</dt>
                <dd className="mt-1 font-semibold text-slate-900">{shipment.client}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Carrier</dt>
                <dd className="mt-1 font-semibold text-slate-900">{shipment.carrier}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border-b border-slate-200 py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Financial summary
          </h2>
          <dl className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Client price</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {money.format(shipment.clientPrice)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Carrier cost</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {money.format(shipment.carrierCost)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Additional costs</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {money.format(shipment.additionalCosts)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Profit / margin</dt>
              <dd className="mt-1 font-semibold text-emerald-800">
                {money.format(shipment.profit)} / {shipment.marginPercent}%
              </dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-slate-500">
            Currency: {shipment.currency} | FX snapshot to reporting currency: {shipment.exchangeRateToBase}
          </p>
        </section>

        <section className="py-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notes</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {shipment.notes || "No additional instructions."}
          </p>
        </section>

        <footer className="border-t border-slate-200 pt-5 text-xs text-slate-500">
          Generated from the authenticated FreightFlow workspace. Verify operational details before dispatch.
        </footer>
      </article>
    </div>
  );
}
