"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, PlusSquare } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, shortDate } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import type { ItemRequest, Listing } from "@/types/domain";
import { RequestStatusBadge } from "./request-status-badge";
import { EmptyState } from "./ui/empty-state";

interface ResponseDraft {
  itemRequestId: string;
  listingId: string;
  message: string;
}

const initialResponseDraft: ResponseDraft = {
  itemRequestId: "",
  listingId: "",
  message: "",
};

export function PublicItemRequestsPanel() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ResponseDraft>(initialResponseDraft);

  const openRequestsQuery = useQuery({
    queryKey: ["item-requests", "public", user?._id],
    queryFn: () => api.get<ItemRequest[]>("/api/item-requests/public", token),
    enabled: Boolean(token && user?._id),
  });

  const myListingsQuery = useQuery({
    queryKey: ["my-listings", user?._id],
    queryFn: () =>
      api.get<Listing[]>(
        `/api/listings?ownerId=${encodeURIComponent(user!._id)}&moderationStatus=approved`,
        token,
      ),
    enabled: Boolean(token && user?._id),
  });

  const requestOptions = useMemo(
    () => openRequestsQuery.data?.data || [],
    [openRequestsQuery.data?.data],
  );
  const listingOptions = useMemo(
    () => myListingsQuery.data?.data || [],
    [myListingsQuery.data?.data],
  );

  const selectedRequest = useMemo(
    () => requestOptions.find((request) => request._id === draft.itemRequestId),
    [requestOptions, draft.itemRequestId],
  );
  const selectedListing = useMemo(
    () => listingOptions.find((listing) => listing._id === draft.listingId),
    [listingOptions, draft.listingId],
  );

  const respondMutation = useMutation({
    mutationFn: () =>
      api.post<{ conversationId: string }>(
        `/api/item-requests/${draft.itemRequestId}/respond`,
        {
          listingId: draft.listingId || undefined,
          message: draft.message,
          proposedRent: selectedListing?.rentPrice || selectedRequest?.budgetAmount || 0,
          proposedDeposit: selectedListing?.depositAmount || 0,
        },
        token,
      ),
    onSuccess: async () => {
      setDraft(initialResponseDraft);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["item-requests", "public", user?._id] }),
        queryClient.invalidateQueries({ queryKey: ["item-requests", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user?._id] }),
      ]);
    },
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Public Requests</h2>
          <p className="text-xs text-slate-500">
            Open requests posted by other users that you can respond to.
          </p>
        </div>
        <Link
          href="/listings/new"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <PlusSquare className="h-3.5 w-3.5" />
          Create listing
        </Link>
      </div>

      {requestOptions.length === 0 ? (
        <EmptyState
          compact
          title="No public requests right now"
          description="New item requests from other users will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {requestOptions.slice(0, 8).map((request) => (
            <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{request.title}</p>
                  <p className="text-xs text-slate-500">
                    {request.category}
                    {request.subcategory ? ` / ${request.subcategory}` : ""} · {request.locality},{" "}
                    {request.city}
                  </p>
                </div>
                <RequestStatusBadge status={request.status} />
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {shortDate(request.startDate)} - {shortDate(request.endDate)} · Budget{" "}
                <strong>{formatCurrency(request.budgetAmount)}</strong>
              </div>
              <p className="mt-2 text-sm text-slate-600">{request.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/requested-items/${request._id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  View request
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      itemRequestId: request._id,
                      listingId: "",
                      message: `Hi, I can help with "${request.title}".`,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Respond
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft.itemRequestId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Respond to public request</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Attach listing (optional)</span>
              <select
                value={draft.listingId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, listingId: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Message only</option>
                {listingOptions.map((listing) => (
                  <option key={listing._id} value={listing._id}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Suggested rent:{" "}
              <strong>
                {formatCurrency(selectedListing?.rentPrice || selectedRequest?.budgetAmount || 0)}
              </strong>
            </div>
          </div>
          <label className="mt-3 block space-y-1">
            <span className="text-xs font-medium text-slate-600">Message</span>
            <textarea
              value={draft.message}
              onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
              className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            You can respond even without a listing. Add a listing later in chat if needed.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(initialResponseDraft)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={respondMutation.isPending || draft.message.trim().length < 3}
              onClick={() => respondMutation.mutate()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              Send response
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
