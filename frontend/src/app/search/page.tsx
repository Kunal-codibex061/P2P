"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FilterSidebar, type ListingFilters } from "@/components/filter-sidebar";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
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

export default function SearchPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ListingFilters>({});

  useEffect(() => {
    function syncFromWindowSearch() {
      setFilters(filtersFromParams(new URLSearchParams(window.location.search)));
    }

    syncFromWindowSearch();
    window.addEventListener("popstate", syncFromWindowSearch);
    return () => window.removeEventListener("popstate", syncFromWindowSearch);
  }, []);

  const queryString = useMemo(() => toQuery(filters), [filters]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[]; collections: string[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["search-listings", queryString],
    queryFn: () => api.get<Listing[]>(`/api/listings?${queryString}`),
  });

  function onFiltersChange(next: ListingFilters) {
    setFilters(next);
    const nextQueryString = toQuery(next);
    router.replace(nextQueryString ? `/search?${nextQueryString}` : "/search");
  }

  const categories = categoriesQuery.data?.data.categories.map((item) => item.label) || [];
  const listings = listingsQuery.data?.data || [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Search Results {filters.q ? `for "${filters.q}"` : ""}
        </h1>
        <p className="text-sm text-slate-500">
          {listingsQuery.isLoading ? "Searching..." : `${listings.length} listings found`}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[290px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <FilterSidebar filters={filters} onChange={onFiltersChange} categories={categories} />
        </aside>

        <section>
          {listingsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              title="No matching listings found"
              description="Try wider filters or a different search phrase."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
