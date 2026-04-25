"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "./auth-provider";
import { RequestItemWizard } from "./request-item-wizard";
import { useEffect, useRef, useState } from "react";
import type { ItemRequest } from "@/types/domain";

export function FloatingActions() {
  const router = useRouter();
  const { user } = useAuth();
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
          {fabMenuOpen && (
            <div className="w-44 space-y-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setFabMenuOpen(false);
                  router.push("/listings/new");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                List Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setFabMenuOpen(false);
                  setOpenRequestWizard(true);
                }}
                className="w-full rounded-xl bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white hover:bg-slate-700"
              >
                Request Item
              </button>
            </div>
          )}
          <button
            type="button"
            title="Quick actions"
            aria-label="Quick actions"
            onClick={() => setFabMenuOpen((prev) => !prev)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-slate-700"
          >
            <Plus className="h-5 w-5" />
          </button>
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
