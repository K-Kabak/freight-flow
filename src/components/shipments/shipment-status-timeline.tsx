import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ShipmentStatusEvent } from "@/types";

const formatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function eventLabel(event: ShipmentStatusEvent) {
  if (event.kind === "baseline") return "History started at the current status";
  if (event.kind === "created") return "Shipment created with status";
  return `Status changed from ${event.fromStatus} to`;
}

function actorLabel(event: ShipmentStatusEvent) {
  if (!event.actor) return "System";
  return event.actor.fullName.trim() || event.actor.email;
}

export function ShipmentStatusTimeline({ events }: { events: ShipmentStatusEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="font-semibold">Status history</h2>
          <p className="text-xs text-slate-500">Immutable changes recorded by the database.</p>
        </div>
      </CardHeader>
      <CardContent>
        {events.length ? (
          <ol className="space-y-4" aria-label="Shipment status history">
            {events.map((event) => (
              <li className="relative border-l-2 border-emerald-100 pl-5" key={event.id}>
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-emerald-600 ring-4 ring-white"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-800">{eventLabel(event)}</p>
                  <StatusBadge status={event.toStatus} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatter.format(new Date(event.changedAt))} UTC · {actorLabel(event)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-4 text-sm text-slate-500">No status history is available.</p>
        )}
      </CardContent>
    </Card>
  );
}
