"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { useAuth } from "./auth-provider";
import { RequestItemWizard } from "./request-item-wizard";
import { useState } from "react";
import type { ItemRequest } from "@/types/domain";

const renterVisiblePathPatterns = [
  /^\/$/,
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

  if (pathname.startsWith("/chat")) {
    return null;
  }

  const roleTags = user?.roleTags || [];
  const isLenderOnly =
    roleTags.includes("lender") && !roleTags.includes("hybrid") && !roleTags.includes("renter");
  const canShowRenterFab = Boolean(user) && !isLenderOnly && shouldShowRequestButton(pathname);

  function handleRequestSuccess(request: ItemRequest) {
    void request;
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
        <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50">
          <button
            type="button"
            title="Request Item"
            aria-label="Request Item"
            onClick={() => setOpenRequestWizard(true)}
            className="group inline-flex h-14 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-white shadow-xl transition hover:bg-slate-700"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden text-sm font-semibold sm:inline">Request Item</span>
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
