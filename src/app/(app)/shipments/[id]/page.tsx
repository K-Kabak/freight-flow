import Link from "next/link";
import { Printer } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ShipmentDocuments } from "@/components/shipments/shipment-documents";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { ShipmentStatusTimeline } from "@/components/shipments/shipment-status-timeline";
import { buttonClassName } from "@/components/ui/button";
import {
  getDirectoryOptions,
  getShipment,
  getShipmentDocuments,
  getShipmentStatusEvents,
} from "@/lib/data/shipments";

export default async function EditShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ shipment, isDemo }, { clients, carriers, reportingCurrency }, events, documents] =
    await Promise.all([
      getShipment(id),
      getDirectoryOptions(),
      getShipmentStatusEvents(id),
      getShipmentDocuments(id),
    ]);
  if (!shipment) notFound();

  return (
    <>
      <PageHeader
        title={`${isDemo ? "View" : "Edit"} ${shipment.referenceNumber}`}
        description={
          isDemo ? "Read-only demo shipment." : "Update operational details, pricing or status."
        }
      >
        {!isDemo ? (
          <Link
            href={`/shipments/${id}/summary`}
            className={buttonClassName({ variant: "outline" })}
          >
            <Printer aria-hidden="true" className="size-4" />
            Print summary
          </Link>
        ) : null}
      </PageHeader>
      <div className="space-y-6">
        <ShipmentForm
          shipment={shipment}
          clients={clients}
          carriers={carriers}
          reportingCurrency={reportingCurrency}
          isDemo={isDemo}
        />
        {!isDemo ? <ShipmentDocuments shipmentId={id} documents={documents} /> : null}
        {!isDemo ? <ShipmentStatusTimeline events={events} /> : null}
      </div>
    </>
  );
}
