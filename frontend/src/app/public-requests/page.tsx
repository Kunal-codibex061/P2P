"use client";

import { RequireAuth } from "@/components/require-auth";
import { PublicItemRequestsPanel } from "@/components/public-item-requests-panel";

export default function PublicRequestsPage() {
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Public Requests</h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse open community requests from other users and start a chat with a pre-requisite
            message.
          </p>
        </section>

        <section className="space-y-3 pb-8">
          <PublicItemRequestsPanel maxItems={80} showPageLink={false} />
        </section>
      </div>
    </RequireAuth>
  );
}
