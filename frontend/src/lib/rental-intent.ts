export interface RentalIntent {
  q?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
}

export const RENTAL_INTENT_STORAGE_KEY = "renteasy-rental-intent";
export const SEARCH_CITY_STORAGE_KEY = "rentora-search-city";
export const SEARCH_CITY_CHANGE_EVENT = "rentora-search-city-changed";
export const RENTAL_INTENT_CHANGE_EVENT = "renteasy-rental-intent-changed";

export const locationOptions = ["", "Delhi"];

function clean(value?: string | null) {
  const next = value?.trim();
  return next ? next : undefined;
}

export function readRentalIntentFromParams(params: URLSearchParams): RentalIntent {
  return {
    q: clean(params.get("q")),
    city: clean(params.get("city")),
    startDate: clean(params.get("startDate")),
    endDate: clean(params.get("endDate")),
  };
}

export function serializeRentalIntent(intent: RentalIntent) {
  const params = new URLSearchParams();
  if (intent.q) params.set("q", intent.q);
  if (intent.city) params.set("city", intent.city);
  if (intent.startDate) params.set("startDate", intent.startDate);
  if (intent.endDate) params.set("endDate", intent.endDate);
  return params;
}

export function mergeRentalIntent(base: RentalIntent, updates: RentalIntent): RentalIntent {
  return {
    q: clean(updates.q) ?? clean(base.q),
    city: clean(updates.city) ?? clean(base.city),
    startDate: clean(updates.startDate) ?? clean(base.startDate),
    endDate: clean(updates.endDate) ?? clean(base.endDate),
  };
}

export function readStoredRentalIntent(): RentalIntent {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(RENTAL_INTENT_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as RentalIntent) : {};
    return {
      q: clean(parsed.q),
      city: clean(parsed.city) ?? clean(window.localStorage.getItem(SEARCH_CITY_STORAGE_KEY)),
      startDate: clean(parsed.startDate),
      endDate: clean(parsed.endDate),
    };
  } catch {
    return {
      city: clean(window.localStorage.getItem(SEARCH_CITY_STORAGE_KEY)),
    };
  }
}

export function persistRentalIntent(intent: RentalIntent) {
  if (typeof window === "undefined") return;
  const next = {
    q: clean(intent.q),
    city: clean(intent.city),
    startDate: clean(intent.startDate),
    endDate: clean(intent.endDate),
  };
  window.localStorage.setItem(RENTAL_INTENT_STORAGE_KEY, JSON.stringify(next));
  window.localStorage.setItem(SEARCH_CITY_STORAGE_KEY, next.city || "");
  window.dispatchEvent(new CustomEvent(RENTAL_INTENT_CHANGE_EVENT, { detail: next }));
  window.dispatchEvent(new CustomEvent(SEARCH_CITY_CHANGE_EVENT, { detail: { city: next.city || "" } }));
}

export function formatIntentDate(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
