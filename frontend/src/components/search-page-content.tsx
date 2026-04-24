"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FilterSidebar, type ListingFilters } from "@/components/filter-sidebar";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { RequestItemWizard } from "@/components/request-item-wizard";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Category, Listing } from "@/types/domain";

function filtersFromParams(params: URLSearchParams): ListingFilters {
  return {
    category: params.get("category") || undefined,
    city: params.get("city") || undefined,
    locality: params.get("locality") || undefined,
    q: params.get("q") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    availability: params.get("availability") || undefined,
    verifiedOnly: params.get("verifiedOnly") === "true",
    deliveryAvailable: params.get("deliveryAvailable") === "true",
  };
}

function toQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    params.set(key, String(value));
  });
  return params.toString();
}

export function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [openRequestWizard, setOpenRequestWizard] = useState(false);

  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const queryString = useMemo(() => toQuery(filters), [filters]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[]; collections: string[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["search-listings", queryString],
    queryFn: () => api.get<Listing[]>(`/api/listings?${queryString}`),
  });

  const hasLocationFilters = Boolean(filters.city || filters.locality);
  const fallbackFilters = useMemo(() => {
    const { city: _city, locality: _locality, ...rest } = filters;
    return rest;
  }, [filters]);
  const fallbackQueryString = useMemo(() => toQuery(fallbackFilters), [fallbackFilters]);

  const fallbackListingsQuery = useQuery({
    queryKey: ["search-listings-fallback", fallbackQueryString],
    enabled:
      Boolean(filters.q) &&
      hasLocationFilters &&
      !listingsQuery.isLoading &&
      (listingsQuery.data?.data?.length || 0) === 0,
    queryFn: () => api.get<Listing[]>(`/api/listings?${fallbackQueryString}`),
  });

  function onFiltersChange(next: ListingFilters) {
    const nextQueryString = toQuery(next);
    router.replace(nextQueryString ? `/search?${nextQueryString}` : "/search");
  }

  const categories = categoriesQuery.data?.data.categories.map((item) => item.label) || [];
  const primaryListings = listingsQuery.data?.data || [];
  const fallbackListings = fallbackListingsQuery.data?.data || [];
  const isUsingFallbackResults = primaryListings.length === 0 && fallbackListings.length > 0;
  const listings = isUsingFallbackResults ? fallbackListings : primaryListings;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Search Results {filters.q ? `for "${filters.q}"` : ""}
        </h1>
        <p className="text-sm text-slate-500">
          {listingsQuery.isLoading ? "Searching..." : `${listings.length} listings found`}
        </p>
        {isUsingFallbackResults && (
          <p className="mt-1 text-xs text-orange-700">
            No exact matches in selected location. Showing results from nearby cities.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <FilterSidebar filters={filters} onChange={onFiltersChange} categories={categories} />
        </aside>

        <section>
          {listingsQuery.isLoading || fallbackListingsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                title="No matching listings found"
                description="Try wider filters or a different search phrase."
              />
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  setOpenRequestWizard(true);
                }}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Request Item
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>

      <RequestItemWizard
        open={openRequestWizard}
        onClose={() => setOpenRequestWizard(false)}
        onSuccess={() => {
          setOpenRequestWizard(false);
          router.push("/requested-items");
        }}
      />
    </div>
  );
}
