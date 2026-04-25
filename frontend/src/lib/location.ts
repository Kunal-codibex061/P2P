export const BASE_LOCATION_OPTIONS: string[] = ["", "Bengaluru", "Mumbai", "Delhi", "Pune"];

export const SEARCH_CITY_STORAGE_KEY = "rentora-search-city";
export const SEARCH_CITY_CHANGE_EVENT = "rentora-search-city-changed";
export const SEARCH_CITY_SOURCE_STORAGE_KEY = "rentora-search-city-source";
export const GEOLOCATION_PROMPTED_STORAGE_KEY = "rentora-location-prompted";

const LOCATION_FETCH_TIMEOUT_MS = 9000;

const cityAliasMap: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  "new delhi": "Delhi",
  delhi: "Delhi",
  bombay: "Mumbai",
  mumbai: "Mumbai",
  poona: "Pune",
  pune: "Pune",
};

type ReverseGeoResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  localityInfo?: {
    informative?: Array<{ name?: string }>;
  };
};

function normalizeCityName(value: string) {
  return value.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

function mapDetectedCityName(value: string) {
  const normalized = normalizeCityName(value);
  if (!normalized) return null;

  if (cityAliasMap[normalized]) {
    return cityAliasMap[normalized];
  }

  for (const [alias, mapped] of Object.entries(cityAliasMap)) {
    if (normalized.includes(alias)) return mapped;
  }

  return value.trim();
}

function extractCityFromReverseGeo(payload: ReverseGeoResponse) {
  const candidates = [
    payload.city,
    payload.locality,
    payload.principalSubdivision,
    ...(payload.localityInfo?.informative?.map((entry) => entry.name) || []),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const mapped = mapDetectedCityName(candidate);
    if (mapped) return mapped;
  }

  return null;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: LOCATION_FETCH_TIMEOUT_MS,
      maximumAge: 1000 * 60 * 5,
    });
  });
}

export async function getBrowserLocationPermissionState(): Promise<PermissionState | "unknown"> {
  if (!("permissions" in navigator) || !navigator.permissions?.query) {
    return "unknown";
  }
  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state;
  } catch {
    return "unknown";
  }
}

export async function detectCityFromBrowserLocation() {
  try {
    const position = await getCurrentPosition();
    const params = new URLSearchParams({
      latitude: String(position.coords.latitude),
      longitude: String(position.coords.longitude),
      localityLanguage: "en",
    });
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as ReverseGeoResponse;
    return extractCityFromReverseGeo(payload);
  } catch {
    return null;
  }
}

export function toLocationOptions(selectedCity: string) {
  const base = [...BASE_LOCATION_OPTIONS];
  if (selectedCity && !base.includes(selectedCity)) {
    base.splice(1, 0, selectedCity);
  }
  return base;
}
