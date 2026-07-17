"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintSummaryButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      <Printer aria-hidden="true" className="size-4" />
      Print / Save as PDF
    </Button>
  );
}
