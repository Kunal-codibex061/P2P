"use client";

import { CalendarDays, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateRangeSelectorModal } from "@/components/date-range-selector-modal";
import {
  formatIntentDate,
  locationOptions,
  mergeRentalIntent,
  persistRentalIntent,
  RENTAL_INTENT_CHANGE_EVENT,
  RENTAL_INTENT_STORAGE_KEY,
  readStoredRentalIntent,
  SEARCH_CITY_CHANGE_EVENT,
  SEARCH_CITY_STORAGE_KEY,
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
  showDateSelector?: boolean;
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
  showDateSelector = true,
}: RentalIntentSelectorProps) {
  const router = useRouter();
  const [intent, setIntent] = useState<RentalIntent>(() =>
    mergeRentalIntent(readStoredRentalIntent(), initialIntent || {}),
  );
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const cityOptions = useMemo(() => locationOptions, []);
  const selectedCityValue = cityOptions.includes(intent.city || "") ? intent.city || "" : "";

  useEffect(() => {
    function syncCityFromStorage() {
      const storedCity = readStoredRentalIntent().city;
      setIntent((current) => {
        if (current.city === storedCity) return current;
        return { ...current, city: storedCity };
      });
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== SEARCH_CITY_STORAGE_KEY && event.key !== RENTAL_INTENT_STORAGE_KEY) return;
      syncCityFromStorage();
    }

    window.addEventListener(SEARCH_CITY_CHANGE_EVENT, syncCityFromStorage);
    window.addEventListener(RENTAL_INTENT_CHANGE_EVENT, syncCityFromStorage);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(SEARCH_CITY_CHANGE_EVENT, syncCityFromStorage);
      window.removeEventListener(RENTAL_INTENT_CHANGE_EVENT, syncCityFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function updateIntent(updates: RentalIntent, options?: { persist?: boolean }) {
    setIntent((current) => {
      const next = { ...current, ...updates };
      if (options?.persist) {
        persistRentalIntent(next);
      }
      return next;
    });
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
              ? showDateSelector
                ? "grid-cols-1 md:grid-cols-[9.5rem_13.5rem_minmax(12rem,1fr)_auto]"
                : "grid-cols-1 md:grid-cols-[9.5rem_minmax(12rem,1fr)_auto]"
              : "grid-cols-1 sm:grid-cols-[11rem_15rem_minmax(14rem,1fr)_auto]",
          )}
        >
          <label className="relative block">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={selectedCityValue}
              onChange={(event) =>
                updateIntent(
                  { city: event.target.value || undefined },
                  { persist: true },
                )
              }
              className={cn(
                "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-100/80 pl-9 pr-8 text-sm font-bold text-slate-900 transition hover:bg-slate-50",
                isNavbar && "h-10 rounded-xl text-xs",
              )}
            >
              {cityOptions.map((city) => (
                <option key={city || "all"} value={city}>
                  {city || "Select Location"}
                </option>
              ))}
            </select>
          </label>

          {showDateSelector ? (
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
          ) : null}

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
            <Search className="h-4 w-4" />
            <span>{isNavbar ? "Find" : "Search"}</span>
          </button>
        </div>
      </form>

      {showDateSelector ? (
        <DateRangeSelectorModal
          key={`${intent.startDate || "none"}-${intent.endDate || "none"}-${dateModalOpen ? "open" : "closed"}`}
          open={dateModalOpen}
          startDate={intent.startDate}
          endDate={intent.endDate}
          onClose={() => setDateModalOpen(false)}
          onApply={(range) => updateIntent(range, { persist: true })}
        />
      ) : null}
    </>
  );
}
