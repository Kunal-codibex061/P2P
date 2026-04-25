"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Typewriter from "typewriter-effect";
import { categoryImageMap } from "@/lib/category-media";
import { formatCurrency } from "@/lib/utils";
import type { Category, Listing } from "@/types/domain";

interface LandingHeroProps {
  listings: Listing[];
  categories: Category[];
}

const typewriterPhrases = [
  "Find camera",
  "Find sofa",
  "Find projector",
  "Find party lights",
  "Find drill machine",
];

const quickCategoryPills = [
  { label: "Cameras", query: "camera" },
  { label: "Tools", query: "tools" },
  { label: "Furniture", query: "furniture" },
  { label: "Event Gear", query: "event gear" },
  { label: "Laptops", query: "laptop" },
  { label: "Speakers", query: "speaker" },
  { label: "Projectors", query: "projector" },
  { label: "Gaming", query: "gaming console" },
  { label: "Appliances", query: "home appliances" },
  { label: "Outdoor", query: "camping gear" },
  { label: "Power Backup", query: "inverter" },
  { label: "Cleaning", query: "vacuum cleaner" },
];

export function LandingHero({ listings, categories }: LandingHeroProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [searchText, setSearchText] = useState("");
  const categoryFallback = "/images/categories/furniture.jpg";

  const heroListings = useMemo(() => listings.slice(0, 3), [listings]);
  const fallbackCards = useMemo(
    () =>
      categories.slice(0, 3).map((category) => ({
        title: category.label,
        image: categoryImageMap[category.key]?.imageUrl || "",
      })),
    [categories],
  );
  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchText.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border accent-border-soft bg-gradient-to-br from-[color:var(--accent-soft)] via-white to-sky-50 p-6 shadow-sm sm:p-10 lg:min-h-[calc(100svh-8.5rem)]">
      {shouldReduceMotion ? (
        <>
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#0078FA]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[#0078FA]/12 blur-3xl" />
        </>
      ) : (
        <>
          <motion.div
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#0078FA]/20 blur-3xl"
            animate={{ y: [0, 8, 0], x: [0, -6, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-[#0078FA]/12 blur-3xl"
            animate={{ y: [0, -8, 0], x: [0, 5, 0] }}
            transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="grid items-start gap-8 lg:h-full lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          className="space-y-6 lg:space-y-7 lg:py-2"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <motion.div
            className="space-y-4"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.02 }}
          >
            <h1 className="max-w-xl text-3xl font-bold tracking-tight leading-[1.04] text-slate-900 sm:text-5xl">
              Rent useful things from verified neighbors in minutes.
            </h1>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              Cameras, tools, furniture, electronics, and event gear - local, dependable, and
              designed around trust.
            </p>
          </motion.div>

          <motion.form
            onSubmit={submitSearch}
            className="max-w-xl rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.08 }}
            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          >
            <div className="flex items-center gap-2">
              <Search className="ml-2 h-4 w-4 text-slate-400" />
              <div className="relative w-full">
                {!shouldReduceMotion && !searchText ? (
                  <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    <Typewriter
                      options={{
                        autoStart: true,
                        loop: true,
                        delay: 60,
                        deleteSpeed: 40,
                        cursor: "|",
                      }}
                      onInit={(typewriter) => {
                        typewriter
                          .typeString(typewriterPhrases[0])
                          .pauseFor(1400)
                          .deleteAll()
                          .typeString(typewriterPhrases[1])
                          .pauseFor(1400)
                          .deleteAll()
                          .typeString(typewriterPhrases[2])
                          .pauseFor(1400)
                          .deleteAll()
                          .typeString(typewriterPhrases[3])
                          .pauseFor(1400)
                          .deleteAll()
                          .typeString(typewriterPhrases[4])
                          .pauseFor(1400)
                          .deleteAll()
                          .start();
                      }}
                    />
                  </span>
                ) : null}
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={shouldReduceMotion ? "Find camera, sofa, projector..." : ""}
                  className="w-full bg-transparent py-2 text-sm text-slate-800"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium !text-white transition hover:bg-slate-700"
              >
                Search
                <ArrowRight className="h-4 w-4 text-white" />
              </button>
            </div>
          </motion.form>

          <motion.div
            className="flex flex-wrap gap-2.5"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.12 }}
          >
            <motion.div whileHover={shouldReduceMotion ? undefined : { y: -2 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
              <Link
                href="/explore"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white hover:bg-slate-700"
              >
                Explore Rentals
              </Link>
            </motion.div>
            <motion.div whileHover={shouldReduceMotion ? undefined : { y: -2 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}>
              <Link
                href="/listings/new"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                List Your Item
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="max-w-xl"
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: 0.16 }}
          >
            <div className="flex flex-wrap gap-2">
              {quickCategoryPills.map((pill, idx) => {
                const pillNode = (
                  <Link
                    key={pill.label}
                    href={`/search?q=${encodeURIComponent(pill.query)}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                  >
                    {pill.label}
                  </Link>
                );
                if (shouldReduceMotion) {
                  return pillNode;
                }
                return (
                  <motion.div
                    key={pill.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05, duration: 0.24 }}
                  >
                    {pillNode}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </motion.div>

        <div className="relative mx-auto w-full max-w-sm lg:h-full lg:py-2">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#66B2FF]/40 to-[#B8D9FF]/35 blur-2xl" />
          <div className="relative space-y-3 lg:flex lg:h-full lg:flex-col lg:pb-2">
            {(heroListings.length > 0
              ? heroListings.map((listing) => ({
                  title: listing.title,
                  image: listing.photos[0] || "",
                  price: `${formatCurrency(listing.rentPrice)} / ${listing.rentUnit}`,
                  locality: `${listing.locality}, ${listing.city}`,
                }))
              : fallbackCards.map((card) => ({
                  title: card.title,
                  image: card.image,
                  price: "Fresh rentals daily",
                  locality: "Tap to explore listings",
                }))
            ).map((card, index) => {
              const cardNode = (
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                  <div className="h-24 bg-slate-100 sm:h-28 xl:h-32">
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = categoryFallback;
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{card.title}</p>
                    <p className="text-xs font-medium text-slate-700">{card.price}</p>
                    <p className="text-xs text-slate-500">{card.locality}</p>
                  </div>
                </div>
              );

              if (shouldReduceMotion) {
                return (
                  <div key={`${card.title}-${index}`} className="lg:flex-1">
                    {cardNode}
                  </div>
                );
              }

              return (
                <motion.div
                  key={`${card.title}-${index}`}
                  initial={{ opacity: 0, y: 24, rotate: index % 2 === 0 ? -1.2 : 1.2 }}
                  animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -1.2 : 1.2 }}
                  transition={{ duration: 0.45, delay: 0.08 + index * 0.08 }}
                  whileHover={{ y: -6, rotate: 0, scale: 1.012 }}
                  className="lg:flex-1"
                >
                  {cardNode}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
