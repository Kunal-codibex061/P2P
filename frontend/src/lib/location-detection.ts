interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
}

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  bombay: "Mumbai",
  mumbai: "Mumbai",
  delhi: "Delhi",
  "new delhi": "Delhi",
  pune: "Pune",
};

function clean(value?: string | null) {
  const next = value?.trim();
  return next ? next : undefined;
}

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCity(raw?: string | null): string | undefined {
  const cleaned = clean(raw);
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  if (CITY_ALIASES[lower]) return CITY_ALIASES[lower];

  const aliasMatch = Object.entries(CITY_ALIASES).find(([alias]) => lower.includes(alias));
  if (aliasMatch) return aliasMatch[1];

  return toTitleCase(cleaned);
}

function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.navigator?.geolocation) {
      reject(new Error("Geolocation is unavailable"));
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10_000,
      },
    );
  });
}

async function reverseGeocodeCity(latitude: number, longitude: number): Promise<string | undefined> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  });

  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
  if (!response.ok) return undefined;

  const payload = (await response.json()) as ReverseGeocodeResponse;
  const normalizedCity = normalizeCity(payload.city);
  const normalizedLocality = normalizeCity(payload.locality);
  const normalizedSubdivision = normalizeCity(payload.principalSubdivision);

  // Reverse geocoders can collapse nearby NCR locations into Delhi.
  // Prefer locality when city is Delhi but locality is a distinct city (e.g. Noida, Gurugram).
  if (normalizedCity === "Delhi" && normalizedLocality && normalizedLocality !== "Delhi") {
    return normalizedLocality;
  }

  return normalizedCity ?? normalizedLocality ?? normalizedSubdivision;
}

export async function detectCityFromCurrentPosition(): Promise<string | undefined> {
  if (typeof window === "undefined") return undefined;
  try {
    const { latitude, longitude } = await getCoordinates();
    return await reverseGeocodeCity(latitude, longitude);
  } catch {
    return undefined;
  }
}
