import { NextResponse, type NextRequest } from "next/server";
import { buildShipmentsCsv } from "@/lib/export/shipments-csv";
import { getShipmentsForExport } from "@/lib/data/shipments";
import { createClient } from "@/lib/supabase/server";
import { shipmentStatuses } from "@/types";

const allowedSorts = new Set(["pickup", "reference", "profit", "status"]);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ message: "Export is unavailable in demo mode." }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Authentication required." }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.slice(0, 120) ?? "";
  const requestedStatus = request.nextUrl.searchParams.get("status") ?? "All";
  const status = shipmentStatuses.includes(requestedStatus as (typeof shipmentStatuses)[number])
    ? requestedStatus
    : "All";
  const requestedSort = request.nextUrl.searchParams.get("sort") ?? "pickup";
  const sort = allowedSorts.has(requestedSort) ? requestedSort : "pickup";
  const result = await getShipmentsForExport({ q, status, sort });
  if (result.isDemo) {
    return NextResponse.json({ message: "Export is unavailable in demo mode." }, { status: 503 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buildShipmentsCsv(result.shipments), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="freightflow-shipments-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
