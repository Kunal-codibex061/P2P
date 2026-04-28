const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
}

export const API_BASE_URL = apiBaseUrl;

export const LISTING_IMAGE_FALLBACK_URL =
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80";
