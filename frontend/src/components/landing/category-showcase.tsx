"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 pt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Browse lanes</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Pick a need, not a catalog aisle</h2>
        </div>
        <Link href="/explore" className="shrink-0 text-sm font-black text-blue-700 hover:text-blue-900">
          View all categories
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => {
            const media = categoryImageMap[category.key];
            const card = (
              <Link
                key={category.key}
                href={`/categories/${category.key}`}
                className="group grid h-full grid-cols-[7rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="h-28 overflow-hidden rounded-xl bg-slate-100">
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
                <div className="flex min-w-0 flex-col justify-between p-3">
                  <div>
                    <p className="line-clamp-2 text-base font-black text-slate-950">{category.label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {category.subcategories.length} focused collections
                    </p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-blue-700">
                    Browse <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
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
    </section>
  );
}
