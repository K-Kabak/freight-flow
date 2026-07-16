import { Info } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DirectoryTable } from "@/components/directory-table";
export default function CarriersPage(){return <><PageHeader title="Carriers" description="Demo preview — carrier management follows the shipment milestone."><Button variant="outline" disabled><Info size={16}/>Demo data</Button></PageHeader><DirectoryTable type="carriers"/></>}
