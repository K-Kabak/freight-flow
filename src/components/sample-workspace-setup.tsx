"use client";

import { Database, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createSampleWorkspace } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function SampleWorkspaceSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function loadSampleData() {
    setLoading(true);
    try {
      const result = await createSampleWorkspace();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Sample workspace created");
      router.refresh();
    } catch {
      toast.error("The sample workspace could not be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="sample-workspace-title"
      className="mb-6 flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 id="sample-workspace-title" className="font-semibold text-emerald-950">
          Explore a complete sample workspace
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-emerald-900">
          Add isolated portfolio data to this empty account: four clients, four carriers and ten
          shipments with realistic statuses, currencies and margins.
        </p>
      </div>
      <Button type="button" onClick={loadSampleData} disabled={loading} className="shrink-0">
        {loading ? <LoaderCircle className="animate-spin" size={17} /> : <Database size={17} />}
        {loading ? "Loading sample data…" : "Load sample workspace"}
      </Button>
    </section>
  );
}
