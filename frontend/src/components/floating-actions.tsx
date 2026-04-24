"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardPlus, MessageCircle, Plus, SearchCode } from "lucide-react";
import { useAuth } from "./auth-provider";
import { RequestItemWizard } from "./request-item-wizard";
import { useEffect, useRef, useState } from "react";
import type { ItemRequest } from "@/types/domain";

const renterVisiblePathPatterns = [
  /^\/$/,
  /^\/explore$/,
  /^\/search$/,
  /^\/listings(?:\/.*)?$/,
  /^\/categories\/.+$/,
  /^\/dashboard\/renter$/,
  /^\/requested-items(?:\/.*)?$/,
];

function shouldShowRequestButton(pathname: string): boolean {
  return renterVisiblePathPatterns.some((pattern) => pattern.test(pathname));
}

export function FloatingActions() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [openRequestWizard, setOpenRequestWizard] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement | null>(null);

  if (pathname.startsWith("/chat")) {
    return null;
  }

  const canShowRenterFab = Boolean(user) && shouldShowRequestButton(pathname);

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
      {!pathname.startsWith("/chat") && (
        <Link
          href="/chat"
          title="Open chats"
          aria-label="Open chats"
          className="fixed right-4 top-[96px] z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:bg-slate-100"
        >
          <MessageCircle className="h-5 w-5" />
        </Link>
      )}

      {canShowRenterFab && (
        <div
          ref={fabRef}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2"
        >
          {fabMenuOpen && (
            <div className="animate-fab-pop w-52 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setFabMenuOpen(false);
                  router.push("/listings/new");
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <ClipboardPlus className="h-4 w-4 text-slate-500" />
                List Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setFabMenuOpen(false);
                  setOpenRequestWizard(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <SearchCode className="h-4 w-4 text-slate-200" />
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
            <Plus className={`h-5 w-5 transition-transform duration-200 ${fabMenuOpen ? "rotate-45" : ""}`} />
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
