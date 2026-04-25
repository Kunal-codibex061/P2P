"use client";

import { useRouter } from "next/navigation";
import { Megaphone, Package, Plus } from "lucide-react";
import { useAuth } from "./auth-provider";
import { RequestItemWizard } from "./request-item-wizard";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ItemRequest } from "@/types/domain";

export function FloatingActions() {
  const router = useRouter();
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [openRequestWizard, setOpenRequestWizard] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement | null>(null);

  const canShowRenterFab = Boolean(user);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (fabRef.current && !fabRef.current.contains(target)) {
        setFabMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function handleRequestSuccess(request: ItemRequest) {
    void request;
    setFabMenuOpen(false);
    router.push("/requested-items");
  }

  return (
    <>
      {canShowRenterFab && (
        <div
          ref={fabRef}
          className="fixed right-5 z-[60] flex flex-col items-end gap-2 bottom-[max(6rem,calc(1rem+env(safe-area-inset-bottom)))] sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
        >
          <AnimatePresence>
            {fabMenuOpen ? (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.92 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.8 }}
                className="w-52 space-y-2 rounded-3xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-md"
              >
                <motion.button
                  type="button"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: 16 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.03, duration: 0.2 }}
                  onClick={() => {
                    setFabMenuOpen(false);
                    router.push("/listings/new");
                  }}
                  className="group w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                      <Package className="h-4 w-4" />
                    </span>
                    List Item
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  initial={shouldReduceMotion ? undefined : { opacity: 0, x: 16 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.07, duration: 0.2 }}
                  onClick={() => {
                    setFabMenuOpen(false);
                    setOpenRequestWizard(true);
                  }}
                  className="group w-full rounded-2xl bg-slate-900 px-3 py-2.5 text-left text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15 text-white transition group-hover:bg-white/25">
                      <Megaphone className="h-4 w-4" />
                    </span>
                    Request Item
                  </span>
                </motion.button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.button
            type="button"
            title="Quick actions"
            aria-label="Quick actions"
            onClick={() => setFabMenuOpen((prev) => !prev)}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl ring-4 ring-white/80 transition hover:bg-slate-700"
          >
            <motion.span
              animate={shouldReduceMotion ? undefined : { rotate: fabMenuOpen ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Plus className="h-5 w-5" />
            </motion.span>
          </motion.button>
        </div>
      )}

      <RequestItemWizard
        open={openRequestWizard}
        onClose={() => setOpenRequestWizard(false)}
        onSuccess={handleRequestSuccess}
      />
    </>
  );
}
