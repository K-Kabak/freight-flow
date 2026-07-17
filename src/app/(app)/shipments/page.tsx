import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { Button, buttonClassName } from "@/components/ui/button";
import { getShipments } from "@/lib/data/shipments";

type SearchParams = { q?: string; status?: string; sort?: string; page?: string };

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = params.q ?? "";
  const status = params.status ?? "All";
  const sort = params.sort ?? "pickup";
  const result = await getShipments({
    q: query,
    status,
    sort,
    page: Number(params.page) || 1,
  });
  const exportParams = new URLSearchParams({ q: query, status, sort });

  return (
    <>
      <PageHeader title="Shipments" description="Track every load, status and margin in one place.">
        {result.isDemo ? (
          <Button disabled>Read-only demo</Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/shipments/export?${exportParams.toString()}`}
              className={buttonClassName({ variant: "outline" })}
            >
              <Download aria-hidden="true" size={16} />
              Export CSV
            </Link>
            <Link href="/shipments/new" className={buttonClassName()}>
              <Plus aria-hidden="true" size={16} />
              Add shipment
            </Link>
          </div>
        )}
      </PageHeader>
      <ShipmentsTable
        shipments={result.shipments}
        total={result.total}
        page={result.page}
        pageCount={result.pageCount}
        isDemo={result.isDemo}
        query={query}
        status={status}
        sort={sort}
      />
    </>
  );
}
