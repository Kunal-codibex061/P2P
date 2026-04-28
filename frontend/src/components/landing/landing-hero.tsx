"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function LandingHero() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#f7fbff]">
      <div className="pointer-events-none absolute inset-0 hero-orbit-grid opacity-80" />
      <div className="pointer-events-none absolute left-1/2 top-28 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full border border-blue-100/80" />
      <div className="pointer-events-none absolute left-1/2 top-40 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full border border-lime-200/70" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-7xl flex-col px-4 pb-8 pt-12 sm:pt-16 lg:pt-20">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-black text-blue-900 shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-700" />
              Local rentals, chosen by date
            </div>

            <h1 className="mt-6 text-balance text-5xl font-black leading-[0.96] text-slate-950 sm:text-6xl lg:text-7xl">
              Rent what you need.
              <span className="block text-blue-700">Nearby.</span>
              <span className="block">For the days you need it.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg">
              Borrow items across major categories from verified people around you, without buying
              things you only need once.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-black !text-white transition hover:bg-blue-800"
              >
                Start searching <ArrowRight className="h-4 w-4 !text-white" />
              </Link>
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:border-lime-300 hover:bg-lime-50"
              >
                List your item
              </Link>
            </div>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/78 p-4 shadow-sm backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="mt-2 text-sm font-black text-slate-950">Verified-first trust</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Profiles, deposits, and in-app chat.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/78 p-4 shadow-sm backdrop-blur">
                <CalendarDays className="h-5 w-5 text-blue-700" />
                <p className="mt-2 text-sm font-black text-slate-950">Built around dates</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Search by city, item, and rental window.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="relative min-h-[26rem] lg:min-h-[34rem]"
          >
            <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_30px_100px_rgba(15,23,42,0.10)]" />
            <div className="absolute left-1/2 top-1/2 h-[19rem] w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/70" />
            <motion.img
              src="/images/hero/rental-gear-cutouts.png"
              alt="Rental gear including cameras, tools, gaming and event equipment"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -10, 0],
                      rotate: [-1, 1, -1],
                    }
              }
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 w-[min(740px,92vw)] -translate-x-1/2 -translate-y-1/2"
            />
            <div className="absolute right-2 top-8 rounded-2xl border border-lime-200 bg-lime-100/90 p-4 shadow-lg backdrop-blur sm:right-10">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime-800">Rent smart</p>
              <p className="mt-1 text-sm font-black text-lime-950">Pay for use, not ownership</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
