import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/utils";
import type { ItemRequestStatus } from "@/types/domain";

const classesByStatus: Record<ItemRequestStatus, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  responded: "bg-indigo-50 text-indigo-700 border-indigo-200",
  chatting: "bg-violet-50 text-violet-700 border-violet-200",
  accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  active: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
  requested: "bg-sky-50 text-sky-700 border-sky-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export function RequestStatusBadge({ status }: { status: ItemRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        classesByStatus[status] || "bg-slate-100 text-slate-700 border-slate-200",
      )}
    >
      {titleCase(status)}
    </span>
  );
}
