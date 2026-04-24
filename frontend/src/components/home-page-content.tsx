"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedSection } from "@/components/landing/animated-section";
import { CategoryShowcase } from "@/components/landing/category-showcase";
import { LandingHero } from "@/components/landing/landing-hero";
import { ListingCard } from "@/components/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import type { Category, Listing } from "@/types/domain";

export function HomePageContent() {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const listingsQuery = useQuery({
    queryKey: ["home-listings-available"],
    queryFn: () => api.get<Listing[]>("/api/listings?availability=available"),
  });

  const categories = categoriesQuery.data?.data.categories || [];
  const listings = listingsQuery.data?.data || [];
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
            href="/search"
            className="accent-text text-sm font-medium hover:text-[color:var(--accent-hover)]"
          >
            Browse all
          </Link>
        </div>
        {listingsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No listings found"
            description="Try exploring categories to discover nearby inventory."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
