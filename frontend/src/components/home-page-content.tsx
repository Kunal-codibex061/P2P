"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedSection } from "@/components/landing/animated-section";
import { CategoryShowcase } from "@/components/landing/category-showcase";
import { LandingHero } from "@/components/landing/landing-hero";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import type { Category, Listing } from "@/types/domain";

const SEARCH_CITY_STORAGE_KEY = "rentora-search-city";
const SEARCH_CITY_CHANGE_EVENT = "rentora-search-city-changed";
const INITIAL_VISIBLE_LISTINGS = 12;
const LOAD_MORE_LISTINGS_STEP = 12;

function FreshListingsGrid({ listings }: { listings: Listing[] }) {
  const [visibleListingsCount, setVisibleListingsCount] = useState(INITIAL_VISIBLE_LISTINGS);
  const loadMoreAnchorRef = useRef<HTMLDivElement | null>(null);

  const visibleListings = useMemo(
    () => listings.slice(0, visibleListingsCount),
    [listings, visibleListingsCount],
  );
  const hasMoreListings = visibleListingsCount < listings.length;

  useEffect(() => {
    if (!hasMoreListings || !loadMoreAnchorRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const shouldLoadMore = entries.some((entry) => entry.isIntersecting);
        if (!shouldLoadMore) return;
        setVisibleListingsCount((current) =>
          Math.min(current + LOAD_MORE_LISTINGS_STEP, listings.length),
        );
      },
      { root: null, rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(loadMoreAnchorRef.current);
    return () => observer.disconnect();
  }, [hasMoreListings, listings.length, visibleListingsCount]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleListings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} />
        ))}
      </div>
      {hasMoreListings ? (
        <div ref={loadMoreAnchorRef} className="flex justify-center py-2">
          <span className="text-xs text-slate-500">Loading more listings...</span>
        </div>
      ) : null}
    </>
  );
}

export function HomePageContent() {
  const [selectedCity, setSelectedCity] = useState(() =>
    typeof window !== "undefined"
      ? (window.localStorage.getItem(SEARCH_CITY_STORAGE_KEY) || "").trim()
      : "",
  );

  useEffect(() => {
    function syncCityFromStorage() {
      setSelectedCity((window.localStorage.getItem(SEARCH_CITY_STORAGE_KEY) || "").trim());
    }

    function onStorage(event: StorageEvent) {
      if (event.key === SEARCH_CITY_STORAGE_KEY) {
        setSelectedCity((event.newValue || "").trim());
      }
    }

    window.addEventListener(SEARCH_CITY_CHANGE_EVENT, syncCityFromStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SEARCH_CITY_CHANGE_EVENT, syncCityFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["home-listings-available", selectedCity],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("availability", "available");
      if (selectedCity) params.set("city", selectedCity);
      return api.get<Listing[]>(`/api/listings?${params.toString()}`);
    },
  });

  const categories = categoriesQuery.data?.data.categories || [];
  const listings = useMemo(() => listingsQuery.data?.data ?? [], [listingsQuery.data?.data]);
  const previewListings = listings.slice(0, 6);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:py-8">
      <LandingHero listings={previewListings} categories={categories} />

      <AnimatedSection delay={0.05}>
        <CategoryShowcase categories={categories} />
      </AnimatedSection>

      <section className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Fresh Listings Near You</h2>
          <Link
            href={selectedCity ? `/search?city=${encodeURIComponent(selectedCity)}` : "/search"}
            className="accent-text text-sm font-medium hover:text-[color:var(--accent-hover)]"
          >
            Browse all
          </Link>
        </div>
        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: INITIAL_VISIBLE_LISTINGS }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No listings found"
            description={
              selectedCity
                ? `No listings are available in ${selectedCity} yet. Try another location or explore all categories.`
                : "Try exploring categories to discover nearby inventory."
            }
          />
        ) : (
          <FreshListingsGrid key={selectedCity || "all-locations"} listings={listings} />
        )}
      </section>
    </div>
  );
}
