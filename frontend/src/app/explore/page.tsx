"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { categoryImageMap } from "@/lib/category-media";
import type { Category } from "@/types/domain";

export default function ExplorePage() {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[]; collections: string[] }>("/api/categories"),
  });

  const categories = categoriesQuery.data?.data.categories || [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Explore Rentals</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse categories and jump into listings that match what you need.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const categoryImage = categoryImageMap[category.key];
            return (
              <Link
                key={category.key}
                href={`/categories/${category.key}`}
                className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-slate-50"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 sm:h-24 sm:w-24">
                  <img
                    src={categoryImage?.imageUrl}
                    alt={categoryImage?.alt || category.label}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <p className="text-center text-sm font-medium text-slate-900">{category.label}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

