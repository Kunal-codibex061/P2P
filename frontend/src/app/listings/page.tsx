"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import type { Listing } from "@/types/domain";

export default function ListingsPage() {
  const [queryString, setQueryString] = useState("availability=available");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("availability")) {
      params.set("availability", "available");
    }
    const timer = window.setTimeout(() => {
      setQueryString(params.toString());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const listingsQuery = useQuery({
    queryKey: ["listings-compat", queryString],
    queryFn: () => api.get<Listing[]>(`/api/listings?${queryString}`),
  });

  const listings = listingsQuery.data?.data || [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-8">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <h1 className="text-xl font-semibold text-slate-900">Explore Rentals</h1>
        <p className="text-sm text-slate-500">
          Use Search or Category pages for advanced filtering.
        </p>
        <Link
          href="/search"
          className="mt-2 inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Search Filters
        </Link>
      </div>

      {listingsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings found"
          description="Try search or category filters with a broader city or price range."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
