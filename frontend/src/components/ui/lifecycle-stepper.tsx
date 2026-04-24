import type { RequestStatus } from "@/types/domain";
import { cn, titleCase } from "@/lib/utils";

const steps: { key: RequestStatus; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "confirmed", label: "Pickup Pending" },
  { key: "active", label: "Active Rental" },
  { key: "return_pending", label: "Return Pending" },
  { key: "completed", label: "Completed" },
];

const rank: Record<string, number> = {
  requested: 0,
  accepted: 1,
  confirmed: 2,
  active: 3,
  return_pending: 4,
  completed: 5,
};

export function LifecycleStepper({ status }: { status: RequestStatus }) {
  if (["rejected", "cancelled", "disputed"].includes(status)) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        Booking closed with status: {titleCase(status)}
      </div>
    );
  }
  const activeRank = rank[status] ?? 0;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={cn(
            "rounded-lg border px-2 py-1 text-center text-[11px] font-medium",
            index <= activeRank
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-500",
          )}
        >
          {step.label}
        </div>
      ))}
    </div>
  );
}
