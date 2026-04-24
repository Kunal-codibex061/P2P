"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, ShieldCheck, Truck, Wallet, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Typewriter from "typewriter-effect";
import { categoryImageMap } from "@/lib/category-media";
import { formatCurrency } from "@/lib/utils";
import type { Category, Listing } from "@/types/domain";

interface LandingHeroProps {
  listings: Listing[];
  categories: Category[];
}

const trustChips = [
  { label: "Verified lenders", icon: ShieldCheck },
  { label: "Local pickup", icon: MapPin },
  { label: "Secure deposit", icon: Wallet },
  { label: "Delivery available", icon: Truck },
];

const typewriterPhrases = [
  "Find camera",
  "Find sofa",
  "Find projector",
  "Find party lights",
  "Find drill machine",
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
    <section className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-6 shadow-sm sm:p-10">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Trusted P2P rental marketplace
          </p>
          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Rent useful things from verified neighbors in minutes.
          </h1>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            Cameras, tools, furniture, electronics, and event gear - local, dependable, and
            designed around trust.
          </p>

          <form onSubmit={submitSearch} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
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
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/explore"
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

          <div className="flex flex-wrap gap-2">
            {trustChips.map((chip, idx) => {
              const Icon = chip.icon;
              if (shouldReduceMotion) {
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    <Icon className="h-3.5 w-3.5 text-orange-600" />
                    {chip.label}
                  </span>
                );
              }
              return (
                <motion.span
                  key={chip.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + idx * 0.06, duration: 0.28 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <Icon className="h-3.5 w-3.5 text-orange-600" />
                  {chip.label}
                </motion.span>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-200/50 to-amber-100/50 blur-2xl" />
          <div className="relative space-y-3">
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
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
                  <div className="h-32 bg-slate-100">
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
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{card.title}</p>
                    <p className="text-xs font-medium text-slate-700">{card.price}</p>
                    <p className="text-xs text-slate-500">{card.locality}</p>
                  </div>
                </div>
              );

              if (shouldReduceMotion) {
                return <div key={`${card.title}-${index}`}>{cardNode}</div>;
              }

              return (
                <motion.div
                  key={`${card.title}-${index}`}
                  initial={{ opacity: 0, y: 24, rotate: index % 2 === 0 ? -1.8 : 1.8 }}
                  animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -1.8 : 1.8 }}
                  transition={{ duration: 0.45, delay: 0.08 + index * 0.08 }}
                  whileHover={{ y: -4, rotate: 0 }}
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
