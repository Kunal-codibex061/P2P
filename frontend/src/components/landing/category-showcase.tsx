"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { categoryImageMap } from "@/lib/category-media";
import type { Category } from "@/types/domain";

interface CategoryShowcaseProps {
  categories: Category[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const shouldReduceMotion = useReducedMotion();
  const categoryFallback = "/images/categories/furniture.jpg";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Explore by Category</h2>
        <Link href="/explore" className="text-sm font-medium text-orange-700 hover:text-orange-800">
          View all categories
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => {
            const media = categoryImageMap[category.key];
            const card = (
              <Link
                key={category.key}
                href={`/categories/${category.key}`}
                className="group block h-full rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:border-orange-200 hover:bg-white"
              >
                <div className="mb-3 h-28 overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={media?.imageUrl}
                    alt={media?.alt || category.label}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = categoryFallback;
                    }}
                  />
                </div>
                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{category.label}</p>
                <p className="mt-1 text-xs text-slate-500">{category.subcategories.length} subcategories</p>
              </Link>
            );

            if (shouldReduceMotion) return <div key={category.key}>{card}</div>;

            return (
              <motion.div
                key={category.key}
                className="h-full"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                {card}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
