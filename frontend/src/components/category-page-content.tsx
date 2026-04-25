"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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

export function CategoryPageContent({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const category = categoriesQuery.data?.data.categories.find((item) => item.key === slug);

  const filters = useMemo(
    () =>
      parseListingFiltersFromParams(new URLSearchParams(searchParams.toString()), {
        fixedCategory: category?.label,
      }),
    [searchParams, category?.label],
  );

  const listingsQueryString = useMemo(
    () =>
      category?.label
        ? toListingsApiQueryString(filters, { fixedCategory: category.label })
        : "",
    [filters, category?.label],
  );

  const listingsQuery = useQuery({
    queryKey: ["category-listings-v2", category?.label, listingsQueryString],
    enabled: Boolean(category?.label),
    queryFn: () => api.get<Listing[]>(`/api/listings?${listingsQueryString}`),
  });

  const facetsQuery = useQuery({
    queryKey: ["category-listings-facets", category?.label, listingsQueryString],
    enabled: Boolean(category?.label),
    queryFn: () => api.get<ListingFacets>(`/api/listings/facets?${listingsQueryString}`),
  });

  function onFiltersChange(next: ListingFiltersV2) {
    if (!category?.label) return;
    const nextQueryString = toRouteQueryString(next, { includeCategory: false });
    router.replace(nextQueryString ? `/categories/${slug}?${nextQueryString}` : `/categories/${slug}`);
  }

  const listings = listingsQuery.data?.data || [];
  const facets = facetsQuery.data?.data || emptyFacets;
  const activeFilterCount = countActiveFilters(filters, { excludeCategory: true });

  if (categoriesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <EmptyState title="Category not found" description="Try exploring another category." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Category</p>
        <h1 className="text-2xl font-bold text-slate-900">{category.label}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore trusted listings in this category with relevant filters.
        </p>
      </section>

      <div className="mb-3 flex items-center justify-between lg:hidden">
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
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
          <FilterSidebar
            filters={filters}
            facets={facets}
            categories={[]}
            categorySpecsOrder={category.filterSpecs || []}
            idPrefix="category-desktop"
            onChange={onFiltersChange}
            onClear={() => onFiltersChange(clearListingFilters(category.label))}
          />
        </aside>

        <section>
          {listingsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title="No items listed yet"
              description="Try adjusting filters or checking back later."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Link
        href="/explore"
        className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Back to all categories
      </Link>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/40 lg:hidden">
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
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
                categories={[]}
                categorySpecsOrder={category.filterSpecs || []}
                idPrefix="category-mobile"
                onChange={onFiltersChange}
                onClear={() => onFiltersChange(clearListingFilters(category.label))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
