import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/utils";
import type { ItemRequestStatus } from "@/types/domain";

const defaultSteps: ItemRequestStatus[] = ["open", "responded", "accepted", "active", "completed"];

function getTimeline(status: ItemRequestStatus): ItemRequestStatus[] {
  if (status === "cancelled" || status === "expired" || status === "rejected") {
    return ["open", status];
  }
  if (status === "chatting") {
    return ["open", "responded", "chatting"];
  }
  if (status === "requested") {
    return ["requested", "chatting", "accepted", "active", "completed"];
  }
  return defaultSteps;
}

export function RequestTimeline({ status }: { status: ItemRequestStatus }) {
  const timeline = getTimeline(status);
  const activeIndex = timeline.indexOf(status);

  return (
    <div className="space-y-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}>
        {timeline.map((step, index) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full",
              index <= activeIndex ? "bg-[#0078FA]" : "bg-slate-200",
            )}
          />
        ))}
      </div>
      <div
        className="grid gap-1 text-[11px] text-slate-500"
        style={{ gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))` }}
      >
        {timeline.map((step) => (
          <p key={step} className="truncate">
            {titleCase(step)}
          </p>
        ))}
      </div>
    </div>
  );
}
