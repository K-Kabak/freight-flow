import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ShipmentsTable } from "@/components/shipments/shipments-table";

export default function ShipmentsPage() {
  return <><PageHeader title="Shipments" description="Track every load, status and margin in one place."><Link href="/shipments/new"><Button><Plus size={16}/>Add shipment</Button></Link></PageHeader><ShipmentsTable/></>;
}
