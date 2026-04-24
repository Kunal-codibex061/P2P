"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { api } from "@/lib/api";
import type { Category, Listing } from "@/types/domain";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const category = categoriesQuery.data?.data.categories.find((item) => item.key === params.slug);

  const listingsQuery = useQuery({
    queryKey: ["category-listings", category?.label],
    enabled: Boolean(category?.label),
    queryFn: () => api.get<Listing[]>(`/api/listings?category=${encodeURIComponent(category!.label)}`),
  });

  const listings = listingsQuery.data?.data || [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Category</p>
        <h1 className="text-2xl font-bold text-slate-900">{category?.label || "Loading..."}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore trusted listings in this category near you.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(category?.subcategories || []).map((sub) => (
            <span
              key={sub}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
            >
              {sub}
            </span>
          ))}
        </div>
      </section>

      {listingsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No items listed yet"
          description="Try another category or check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}

      <Link
        href="/listings"
        className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Back to all listings
      </Link>
    </div>
  );
}
