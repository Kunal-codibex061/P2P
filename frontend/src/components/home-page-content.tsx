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
import {
  readStoredRentalIntent,
  RENTAL_INTENT_CHANGE_EVENT,
  SEARCH_CITY_CHANGE_EVENT,
  SEARCH_CITY_STORAGE_KEY,
  type RentalIntent,
} from "@/lib/rental-intent";
import type { Category, Listing } from "@/types/domain";

const INITIAL_VISIBLE_LISTINGS = 12;
const LOAD_MORE_LISTINGS_STEP = 12;
const CATEGORY_RAIL_VISIBLE_ITEMS = 10;

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

function CategoryListingRail({
  category,
  listings,
  selectedCity,
}: {
  category: Category;
  listings: Listing[];
  selectedCity: string;
}) {
  const href = selectedCity
    ? `/categories/${category.key}?city=${encodeURIComponent(selectedCity)}`
    : `/categories/${category.key}`;

  return (
    <section className="space-y-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              Category Spotlight
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-950">{category.label}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {selectedCity ? `Top picks in ${selectedCity}` : "Top picks near you"}
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            View category
          </Link>
        </div>

        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max items-stretch gap-3 sm:gap-4">
            {listings.slice(0, CATEGORY_RAIL_VISIBLE_ITEMS).map((listing) => (
              <div key={listing._id} className="w-[292px] shrink-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePageContent() {
  const [rentalIntent, setRentalIntent] = useState<RentalIntent>(() => readStoredRentalIntent());
  const selectedCity = rentalIntent.city || "";

  useEffect(() => {
    function syncIntentFromStorage() {
      setRentalIntent(readStoredRentalIntent());
    }

    function onStorage(event: StorageEvent) {
      if (event.key === SEARCH_CITY_STORAGE_KEY) {
        setRentalIntent((current) => ({
          ...current,
          city: (event.newValue || "").trim() || undefined,
        }));
      }
    }

    window.addEventListener(SEARCH_CITY_CHANGE_EVENT, syncIntentFromStorage);
    window.addEventListener(RENTAL_INTENT_CHANGE_EVENT, syncIntentFromStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SEARCH_CITY_CHANGE_EVENT, syncIntentFromStorage);
      window.removeEventListener(RENTAL_INTENT_CHANGE_EVENT, syncIntentFromStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["home-listings-available", rentalIntent.city, rentalIntent.startDate, rentalIntent.endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("availability", "available");
      if (rentalIntent.city) params.set("city", rentalIntent.city);
      if (rentalIntent.startDate) params.set("startDate", rentalIntent.startDate);
      if (rentalIntent.endDate) params.set("endDate", rentalIntent.endDate);
      return api.get<Listing[]>(`/api/listings?${params.toString()}`);
    },
  });

  const categories = useMemo(
    () => categoriesQuery.data?.data.categories || [],
    [categoriesQuery.data?.data.categories],
  );
  const listings = useMemo(() => listingsQuery.data?.data ?? [], [listingsQuery.data?.data]);
  const categoryWiseListings = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          listings: listings.filter((listing) => listing.category === category.label),
        }))
        .filter((entry) => entry.listings.length > 0),
    [categories, listings],
  );

  return (
    <div className="flex w-full flex-col gap-8 overflow-hidden">
      <LandingHero />

      <AnimatedSection delay={0.05}>
        <CategoryShowcase categories={categories} selectedCity={selectedCity} />
      </AnimatedSection>

      <section className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-8">
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

      {!listingsQuery.isLoading && categoryWiseListings.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-10">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              Curated Collections
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Explore By Category</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Handpicked listings arranged category-wise for faster browsing.
            </p>
          </div>

          {categoryWiseListings.map((entry) => (
            <AnimatedSection key={entry.category.key} delay={0.02}>
              <CategoryListingRail
                category={entry.category}
                listings={entry.listings}
                selectedCity={selectedCity}
              />
            </AnimatedSection>
          ))}
        </section>
      ) : null}
    </div>
  );
}
