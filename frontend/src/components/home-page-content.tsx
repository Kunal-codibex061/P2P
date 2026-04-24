"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  Drill,
  Gamepad2,
  Home,
  LampDesk,
  MapPin,
  PartyPopper,
  Search,
  Tent,
} from "lucide-react";
import { api } from "@/lib/api";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import type { Category, Listing } from "@/types/domain";

interface ListingFilters {
  category?: string;
  city?: string;
  locality?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  verifiedOnly?: boolean;
  deliveryAvailable?: boolean;
  q?: string;
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  furniture: LampDesk,
  "cameras-creator-gear": Camera,
  "electronics-gaming": Gamepad2,
  "home-appliances": Home,
  "tools-diy": Drill,
  "events-outdoor": Tent,
};

const defaultFilters: ListingFilters = {
  availability: "available",
};

function filtersFromParams(params: URLSearchParams): ListingFilters {
  return {
    category: params.get("category") || undefined,
    city: params.get("city") || undefined,
    locality: params.get("locality") || undefined,
    q: params.get("q") || undefined,
    minPrice: params.get("minPrice") || undefined,
    maxPrice: params.get("maxPrice") || undefined,
    availability: params.get("availability") || "available",
    verifiedOnly: params.get("verifiedOnly") === "true",
    deliveryAvailable: params.get("deliveryAvailable") === "true",
  };
}

function toQuery(filters: ListingFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

export function HomePageContent() {
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [filters, setFilters] = useState<ListingFilters>(defaultFilters);

  useEffect(() => {
    const next = filtersFromParams(new URLSearchParams(searchParams.toString()));
    const frame = requestAnimationFrame(() => setFilters(next));
    return () => cancelAnimationFrame(frame);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("focus") !== "search") return;
    requestAnimationFrame(() => {
      searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      searchInputRef.current?.focus();
    });
  }, [searchParams]);

  const queryString = useMemo(() => toQuery(filters), [filters]);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<{ categories: Category[]; collections: string[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["home-listings", queryString],
    queryFn: () => api.get<Listing[]>(`/api/listings?${queryString}`),
  });

  const categories = categoriesQuery.data?.data.categories || [];
  const collections = categoriesQuery.data?.data.collections || [];
  const listings = listingsQuery.data?.data || [];

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm sm:p-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-200/30 blur-2xl" />
        <p className="mb-2 inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-800">
          Trusted P2P rental marketplace
        </p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Rent big useful things from verified people near you.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Furniture, cameras, gaming consoles, tools, appliances, and event gear - all high-value,
          all local, all trust-first.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/#explore-rentals"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Explore Rentals
          </Link>
          <Link
            href="/listings/new"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            List Your Item
          </Link>
        </div>
      </section>

      <section
        id="explore-rentals"
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Explore Rentals</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 lg:col-span-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              id="home-filters-search"
              ref={searchInputRef}
              value={filters.q || ""}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              className="w-full bg-transparent text-sm"
              placeholder="Search item, category..."
            />
          </div>

          <select
            value={filters.category || ""}
            onChange={(event) =>
              setFilters({ ...filters, category: event.target.value || undefined })
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.key} value={category.label}>
                {category.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 lg:col-span-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <input
              value={filters.city || ""}
              onChange={(event) => setFilters({ ...filters, city: event.target.value })}
              className="w-full bg-transparent text-sm"
              placeholder="City"
            />
          </div>

          <input
            value={filters.locality || ""}
            onChange={(event) => setFilters({ ...filters, locality: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-2"
            placeholder="Locality"
          />

          <input
            type="number"
            value={filters.minPrice || ""}
            onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-1"
            placeholder="Min"
          />

          <input
            type="number"
            value={filters.maxPrice || ""}
            onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm lg:col-span-1"
            placeholder="Max"
          />

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 lg:col-span-1">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={Boolean(filters.verifiedOnly)}
                onChange={(event) =>
                  setFilters({ ...filters, verifiedOnly: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Verified
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 lg:col-span-1">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={Boolean(filters.deliveryAvailable)}
                onChange={(event) =>
                  setFilters({ ...filters, deliveryAvailable: event.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300"
              />
              Delivery
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Categories</h2>
          <Link
            href="/#explore-rentals"
            className="text-sm font-medium text-orange-700 hover:text-orange-800"
          >
            Explore rentals
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = iconMap[category.key] || PartyPopper;
            return (
              <Link
                key={category.key}
                href={`/categories/${category.key}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-orange-100 p-2 text-orange-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{category.label}</p>
                    <p className="text-xs text-slate-500">
                      {category.subcategories.length} sub-types
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Use-Case Collections</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Link
              href={`/?q=${encodeURIComponent(collection)}#explore-rentals`}
              key={collection}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:border-orange-200"
            >
              {collection}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4 pb-8">
        <h2 className="text-xl font-semibold text-slate-900">Listings Near You</h2>
        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="Try broadening your filter values to discover nearby inventory."
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
  );
}
