"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Handshake,
  LocateFixed,
  MapPin,
  Megaphone,
  MessageCircle,
  Search,
  Shield,
  UserCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  detectCityFromBrowserLocation,
  getBrowserLocationPermissionState,
  SEARCH_CITY_CHANGE_EVENT,
  SEARCH_CITY_SOURCE_STORAGE_KEY,
  SEARCH_CITY_STORAGE_KEY,
  toLocationOptions,
} from "@/lib/location";
import type { Listing } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const searchAreaRef = useRef<HTMLDivElement | null>(null);
  const hasAttemptedGeolocationRef = useRef(false);

  const [selectedCity, setSelectedCity] = useState("");
  const [citySource, setCitySource] = useState<"" | "manual" | "geo">("");
  const [cityReady, setCityReady] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [autoDetectingCity, setAutoDetectingCity] = useState(false);
  const locationOptions = useMemo(() => toLocationOptions(selectedCity), [selectedCity]);

  useEffect(() => {
    const storedCity = (window.localStorage.getItem(SEARCH_CITY_STORAGE_KEY) || "").trim();
    const storedSource = window.localStorage.getItem(SEARCH_CITY_SOURCE_STORAGE_KEY);
    if (storedSource === "manual" || storedSource === "geo") {
      setSelectedCity(storedCity);
      setCitySource(storedSource);
    } else {
      // Clear legacy values that were saved before source tracking existed.
      setSelectedCity("");
      setCitySource("");
      window.localStorage.removeItem(SEARCH_CITY_STORAGE_KEY);
      window.localStorage.removeItem(SEARCH_CITY_SOURCE_STORAGE_KEY);
    }
    setCityReady(true);
  }, []);

  useEffect(() => {
    if (!cityReady) return;
    if (selectedCity) {
      localStorage.setItem(SEARCH_CITY_STORAGE_KEY, selectedCity);
      if (citySource) {
        localStorage.setItem(SEARCH_CITY_SOURCE_STORAGE_KEY, citySource);
      }
    } else {
      localStorage.removeItem(SEARCH_CITY_STORAGE_KEY);
      localStorage.removeItem(SEARCH_CITY_SOURCE_STORAGE_KEY);
    }
    window.dispatchEvent(
      new CustomEvent(SEARCH_CITY_CHANGE_EVENT, {
        detail: { city: selectedCity },
      }),
    );
  }, [selectedCity, citySource, cityReady]);

  useEffect(() => {
    const queryText = new URLSearchParams(window.location.search).get("q") || "";
    setSearchInput(queryText);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setProfileOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let ignore = false;

    async function autoDetectCity() {
      if (!cityReady) return;
      if (citySource === "manual") return;
      if (hasAttemptedGeolocationRef.current) return;

      hasAttemptedGeolocationRef.current = true;
      const permissionState = await getBrowserLocationPermissionState();
      const canAttempt = permissionState === "granted" || permissionState === "prompt" || permissionState === "unknown";
      if (!canAttempt) return;

      setAutoDetectingCity(true);
      const detectedCity = await detectCityFromBrowserLocation();
      if (!ignore && detectedCity) {
        setSelectedCity(detectedCity);
        setCitySource("geo");
      }
      if (!ignore) {
        setAutoDetectingCity(false);
      }
    }

    void autoDetectCity();
    return () => {
      ignore = true;
    };
  }, [citySource, cityReady]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (searchAreaRef.current && !searchAreaRef.current.contains(target)) {
        setSearchFocused(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const suggestionsQuery = useQuery({
    queryKey: ["navbar-search-suggestions", debouncedSearch, selectedCity],
    enabled: debouncedSearch.length >= 2,
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("q", debouncedSearch);
      params.set("availability", "available");
      if (selectedCity) params.set("city", selectedCity);
      return api.get<Listing[]>(`/api/listings?${params.toString()}`);
    },
  });

  const suggestions = useMemo(() => {
    const listings = suggestionsQuery.data?.data || [];
    const unique = new Set<string>();
    return listings
      .filter((listing) => {
        if (unique.has(listing.title)) return false;
        unique.add(listing.title);
        return true;
      })
      .slice(0, 6);
  }, [suggestionsQuery.data?.data]);

  function submitSearch() {
    const q = searchInput.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCity) params.set("city", selectedCity);
    router.push(params.toString() ? `/search?${params.toString()}` : "/search");
    setSearchFocused(false);
  }

  async function useMyLocation() {
    const permissionState = await getBrowserLocationPermissionState();
    if (permissionState === "denied") {
      alert("Location access is blocked in your browser. Please allow location for this site and try again.");
      return;
    }

    setAutoDetectingCity(true);
    const detectedCity = await detectCityFromBrowserLocation();
    setAutoDetectingCity(false);

    if (detectedCity) {
      setSelectedCity(detectedCity);
      setCitySource("geo");
      return;
    }

    alert("Could not detect your city. Please check location permission and try again.");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0078FA] to-[#0063CF] text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm">RENTeasy</p>
            <p className="text-xs font-normal text-slate-500">Trusted local rentals</p>
          </div>
        </Link>

        <div ref={searchAreaRef} className="order-3 w-full md:order-2 md:flex-1">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative w-40 shrink-0 sm:w-44">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedCity}
                onChange={(event) => {
                  const nextCity = event.target.value;
                  setSelectedCity(nextCity);
                  setCitySource(nextCity ? "manual" : "");
                }}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-700"
              >
                {locationOptions.map((city) => (
                  <option key={city || "all"} value={city}>
                    {city || (autoDetectingCity ? "Detecting location..." : "Select Location")}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => void useMyLocation()}
              title="Use my location"
              aria-label="Use my location"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              disabled={autoDetectingCity}
            >
              <LocateFixed className={`h-4 w-4 ${autoDetectingCity ? "animate-pulse" : ""}`} />
            </button>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchInput}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search for items, categories..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-24 text-sm text-slate-700"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium !text-white hover:bg-slate-700"
              >
                Search
              </button>

              {searchFocused && debouncedSearch.length >= 2 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {suggestionsQuery.isLoading ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Searching...</div>
                  ) : suggestions.length === 0 ? (
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Search for "{debouncedSearch}"
                    </button>
                  ) : (
                    <>
                      {suggestions.map((listing) => (
                        <button
                          key={listing._id}
                          type="button"
                          onClick={() => {
                            router.push(`/listings/${listing._id}`);
                            setSearchFocused(false);
                          }}
                          className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50 last:border-b-0"
                        >
                          <p className="line-clamp-1 text-sm font-medium text-slate-900">
                            {listing.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {listing.locality}, {listing.city}
                          </p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={submitSearch}
                        className="accent-text accent-hover-bg-soft w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium"
                      >
                        View all results for "{debouncedSearch}"
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="order-2 flex items-center gap-2 md:order-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-2 py-1.5 transition",
                    profileOpen ? "accent-border-soft accent-bg-soft" : "hover:bg-slate-100",
                  )}
                >
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="hidden min-w-0 text-left leading-tight sm:block">
                    <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                      {user.name}
                    </p>
                    <p className="max-w-32 truncate text-xs text-slate-500">
                      {user.city} · {user.locality}
                    </p>
                  </div>
                  {user.kycStatus === "verified" ? (
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Shield className="h-4 w-4 text-amber-600" />
                  )}
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <Link
                      href="/profile/kyc"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <UserCircle2 className="h-4 w-4 text-slate-500" />
                      Profile & KYC
                    </Link>
                    <Link
                      href="/dashboard/renter"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <CircleUserRound className="h-4 w-4 text-slate-500" />
                      My Requests
                    </Link>
                    <Link
                      href="/requested-items"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <ClipboardList className="h-4 w-4 text-slate-500" />
                      Requested Items
                    </Link>
                    <Link
                      href="/public-requests"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Megaphone className="h-4 w-4 text-slate-500" />
                      Public Requests
                    </Link>
                    <Link
                      href="/dashboard/lender"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Handshake className="h-4 w-4 text-slate-500" />
                      My Lending
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      Chats
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/chat"
                title="Open chats"
                aria-label="Open chats"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium !text-white transition hover:bg-slate-700"
              >
                <MessageCircle className="h-5 w-5 text-white" />
                <span className="text-white">Chat</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium !text-white transition hover:bg-slate-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
