"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus, Send, SquarePlus } from "lucide-react";

const HOME_SEARCH_INPUT_ID = "home-filters-search";

export function FloatingActions() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (fabRef.current && !fabRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function focusHomeSearch() {
    const input = document.getElementById(HOME_SEARCH_INPUT_ID) as HTMLInputElement | null;
    if (!input) return;
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  }

  function handleRequestItem() {
    setOpen(false);
    if (pathname === "/") {
      focusHomeSearch();
      return;
    }
    router.push("/?focus=search#explore-rentals");
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

      <div
        ref={fabRef}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end"
      >
        {open && (
          <div className="mb-3 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            <Link
              href="/listings/new"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              <SquarePlus className="h-4 w-4 text-orange-600" />
              Add Item
            </Link>
            <button
              type="button"
              onClick={handleRequestItem}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <Send className="h-4 w-4 text-orange-600" />
              Request Item
            </button>
          </div>
        )}

        <button
          type="button"
          title="Quick actions"
          aria-label="Quick actions"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-slate-700"
        >
          <Plus className={`h-6 w-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
        </button>
      </div>
    </>
  );
}
