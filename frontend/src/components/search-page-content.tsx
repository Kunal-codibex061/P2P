"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import {
  clearListingFilters,
  countActiveFilters,
  parseListingFiltersFromParams,
  toListingsApiQueryString,
  toRouteQueryString,
  type ListingFiltersV2,
} from "@/lib/listing-filters";
import type { Category, Listing, ListingFacets } from "@/types/domain";

const emptyFacets: ListingFacets = {
  priceRange: null,
  subcategories: [],
  conditions: [],
  cities: [],
  localities: [],
  rentUnits: [],
  specifications: {},
};

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(
    () => parseListingFiltersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[]; collections: string[] }>("/api/categories"),
  });

  const categories = categoriesQuery.data?.data.categories || [];
  const categoryLabels = categories.map((item) => item.label);
  const selectedCategory = categories.find((item) => item.label === filters.category);

  const listingsQueryString = useMemo(() => toListingsApiQueryString(filters), [filters]);

  const listingsQuery = useQuery({
    queryKey: ["search-listings-v2", listingsQueryString],
    queryFn: () => api.get<Listing[]>(`/api/listings?${listingsQueryString}`),
  });

  const facetsQuery = useQuery({
    queryKey: ["search-listings-facets", listingsQueryString],
    queryFn: () => api.get<ListingFacets>(`/api/listings/facets?${listingsQueryString}`),
  });

  function onFiltersChange(next: ListingFiltersV2) {
    const nextQueryString = toRouteQueryString(next);
    router.replace(nextQueryString ? `/search?${nextQueryString}` : "/search");
  }

  const listings = listingsQuery.data?.data || [];
  const facets = facetsQuery.data?.data || emptyFacets;
  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <motion.div
        className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        <h1 className="text-xl font-semibold text-slate-900">
          Search Results {filters.q ? `for "${filters.q}"` : ""}
        </h1>
        <p className="text-sm text-slate-500">
          {listingsQuery.isLoading ? "Searching..." : `${listings.length} listings found`}
        </p>
      </motion.div>

      <motion.div
        className="mb-3 flex items-center justify-between lg:hidden"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.06 }}
      >
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        {activeFilterCount > 0 ? (
          <span className="text-xs text-slate-500">{activeFilterCount} active</span>
        ) : null}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <motion.aside
          className="hidden lg:sticky lg:top-24 lg:block lg:h-fit"
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.24, delay: 0.08 }}
        >
          <FilterSidebar
            filters={filters}
            facets={facets}
            categories={categoryLabels}
            showCategoryFilter
            categorySpecsOrder={selectedCategory?.filterSpecs || []}
            idPrefix="search-desktop"
            onChange={onFiltersChange}
            onClear={() => onFiltersChange(clearListingFilters())}
          />
        </motion.aside>

        <motion.section
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.1 }}
        >
          {listingsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <EmptyState
                title="No matching listings found"
                description="Try wider filters or a different search phrase."
              />
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing, index) =>
                shouldReduceMotion ? (
                  <ListingCard key={listing._id} listing={listing} />
                ) : (
                  <motion.div
                    key={listing._id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.24,
                      delay: Math.min(index * 0.04, 0.22),
                      ease: "easeOut",
                    }}
                  >
                    <ListingCard listing={listing} />
                  </motion.div>
                ),
              )}
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed inset-0 z-[70] bg-slate-900/40 lg:hidden"
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
              initial={shouldReduceMotion ? undefined : { x: 34 }}
              animate={shouldReduceMotion ? undefined : { x: 0 }}
              exit={shouldReduceMotion ? undefined : { x: 34 }}
              transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.84 }}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">Filters</p>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterSidebar
                  filters={filters}
                  facets={facets}
                  categories={categoryLabels}
                  showCategoryFilter
                  categorySpecsOrder={selectedCategory?.filterSpecs || []}
                  idPrefix="search-mobile"
                  onChange={onFiltersChange}
                  onClear={() => onFiltersChange(clearListingFilters())}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
