import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  compact?: boolean;
  compactLayout?: "centered" | "full";
}

export function EmptyState({
  title,
  description,
  compact = false,
  compactLayout = "centered",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center",
        compact
          ? compactLayout === "full"
            ? "min-h-56 w-full justify-center py-10"
            : "mx-auto min-h-56 w-full max-w-3xl justify-center py-10"
          : "py-12",
      )}
    >
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}
