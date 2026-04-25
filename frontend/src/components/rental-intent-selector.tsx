"use client";

import { CalendarDays, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DateRangeSelectorModal } from "@/components/date-range-selector-modal";
import {
  formatIntentDate,
  locationOptions,
  mergeRentalIntent,
  persistRentalIntent,
  readStoredRentalIntent,
  serializeRentalIntent,
  type RentalIntent,
} from "@/lib/rental-intent";
import { cn } from "@/lib/utils";

interface RentalIntentSelectorProps {
  initialIntent?: RentalIntent;
  className?: string;
  variant?: "hero" | "navbar" | "panel";
  placeholder?: string;
  onSearch?: (intent: RentalIntent) => void;
}

function dateRangeLabel(intent: RentalIntent) {
  if (intent.startDate && intent.endDate) {
    return `${formatIntentDate(intent.startDate)} - ${formatIntentDate(intent.endDate)}`;
  }
  return "Select dates";
}

export function RentalIntentSelector({
  initialIntent,
  className,
  variant = "hero",
  placeholder = "Search cameras, sofas, projectors...",
  onSearch,
}: RentalIntentSelectorProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<RentalIntent>(() =>
    mergeRentalIntent(readStoredRentalIntent(), initialIntent || {}),
  );
  const [dateModalOpen, setDateModalOpen] = useState(false);

  function updateIntent(updates: RentalIntent) {
    setIntent((current) => ({ ...current, ...updates }));
  }

  function submitSearch() {
    const next = {
      q: intent.q?.trim() || undefined,
      city: intent.city?.trim() || undefined,
      startDate: intent.startDate,
      endDate: intent.endDate,
    };
    persistRentalIntent(next);
    if (onSearch) {
      onSearch(next);
      return;
    }
    const params = serializeRentalIntent(next);
    router.push(params.toString() ? `/search?${params.toString()}` : "/search");
  }

  const isNavbar = variant === "navbar";

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        className={cn(
          "w-full rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]",
          isNavbar ? "p-1.5" : "p-2",
          className,
        )}
      >
        <div
          className={cn(
            "grid items-center gap-2",
            isNavbar
              ? "grid-cols-1 md:grid-cols-[9.5rem_13.5rem_minmax(12rem,1fr)_auto]"
              : "grid-cols-1 sm:grid-cols-[11rem_15rem_minmax(14rem,1fr)_auto]",
          )}
        >
          <label className="relative block">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={intent.city || ""}
              onChange={(event) => updateIntent({ city: event.target.value || undefined })}
              className={cn(
                "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-100/80 pl-9 pr-8 text-sm font-bold text-slate-900 transition hover:bg-slate-50",
                isNavbar && "h-10 rounded-xl text-xs",
              )}
            >
              {locationOptions.map((city) => (
                <option key={city || "all"} value={city}>
                  {city || "Select Location"}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setDateModalOpen(true)}
            className={cn(
              "flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-900 transition hover:border-lime-300 hover:bg-lime-50",
              isNavbar && "h-10 rounded-xl text-xs",
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-600" />
            <span className="truncate">{dateRangeLabel(intent)}</span>
          </button>

          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={intent.q || ""}
              onChange={(event) => updateIntent({ q: event.target.value })}
              placeholder={placeholder}
              className={cn(
                "h-12 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400",
                isNavbar && "h-10 rounded-xl text-xs",
              )}
            />
          </label>

          <button
            type="submit"
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black !text-white transition hover:bg-blue-800",
              isNavbar && "h-10 rounded-xl px-3 text-xs",
            )}
          >
            {isNavbar ? <SlidersHorizontal className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            <span>{isNavbar ? "Find" : "Search"}</span>
          </button>
        </div>
      </form>

      <DateRangeSelectorModal
        key={`${intent.startDate || "none"}-${intent.endDate || "none"}-${dateModalOpen ? "open" : "closed"}`}
        open={dateModalOpen}
        startDate={intent.startDate}
        endDate={intent.endDate}
        onClose={() => setDateModalOpen(false)}
        onApply={(range) => updateIntent(range)}
      />
    </>
  );
}
