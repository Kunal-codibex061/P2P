"use client";

import { Search, MessageCircle, HandCoins, Undo2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const steps = [
  { label: "Find", hint: "Pick your item nearby", icon: Search },
  { label: "Chat", hint: "Confirm details safely", icon: MessageCircle },
  { label: "Rent", hint: "Book and collect", icon: HandCoins },
  { label: "Return", hint: "Hand back on time", icon: Undo2 },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">How RENTeasy Works</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const node = (
            <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 inline-flex rounded-lg bg-white p-2 text-orange-700 shadow-sm">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {index + 1}. {step.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{step.hint}</p>
            </article>
          );

          if (shouldReduceMotion) return <div key={step.label}>{node}</div>;

          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.3, delay: index * 0.07 }}
            >
              {node}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
