"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, PlusSquare } from "lucide-react";
import { api } from "@/lib/api";
import { buildListingResponseHandoffHref } from "@/lib/listing-response-handoff";
import { formatCurrency, shortDate } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import type { ItemRequest, Listing, OpenRequestResponse, User } from "@/types/domain";
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

interface PublicItemRequestsPanelProps {
  maxItems?: number;
  showPageLink?: boolean;
}

interface RespondToOpenRequestResult {
  response: OpenRequestResponse;
  conversationId: string;
}

function quickRepliesForRequest(request?: ItemRequest) {
  const title = request?.title || "this request";
  const category = (request?.category || "").toLowerCase();

  const base = [
    `Hi! I can help with "${title}". Is your timing still the same?`,
    `I can support this request. Can you confirm pickup vs delivery preference?`,
    `This is available from my side. Please share expected handover time and location.`,
  ];

  if (category.includes("electronics") || category.includes("gaming")) {
    return [
      ...base,
      "I can arrange this with proper condition checks. Do you need accessories too?",
    ];
  }

  if (category.includes("furniture")) {
    return [
      ...base,
      "I can help with this item. Please confirm floor/access details for pickup or delivery.",
    ];
  }

  return [...base, "I can proceed on this. Please share any specific requirements before we finalize."];
}

export function PublicItemRequestsPanel({
  maxItems = 8,
  showPageLink = true,
}: PublicItemRequestsPanelProps = {}) {
  const router = useRouter();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeRespondRequestId, setActiveRespondRequestId] = useState<string | null>(null);
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
  const visibleRequests = useMemo(
    () => (maxItems ? requestOptions.slice(0, maxItems) : requestOptions),
    [maxItems, requestOptions],
  );
  const hasMore = Boolean(maxItems && requestOptions.length > maxItems);

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
      api.post<RespondToOpenRequestResult>(
        `/api/item-requests/${draft.itemRequestId}/respond`,
        {
          listingId: draft.listingId,
          message: draft.message,
          proposedRent: selectedListing?.rentPrice || selectedRequest?.budgetAmount || 0,
          proposedDeposit: selectedListing?.depositAmount || 0,
        },
        token,
      ),
    onSuccess: async (response) => {
      const conversationId = response.data.conversationId;
      setActiveRespondRequestId(null);
      setDraft(initialResponseDraft);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["item-requests", "public", user?._id] }),
        queryClient.invalidateQueries({ queryKey: ["item-requests", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user?._id] }),
      ]);
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      }
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
        <div className="flex flex-wrap items-center gap-2">
          {showPageLink ? (
            <Link
              href="/public-requests"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Open full feed
            </Link>
          ) : null}
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <PlusSquare className="h-3.5 w-3.5" />
            Create listing
          </Link>
        </div>
      </div>

      {requestOptions.length === 0 ? (
        <EmptyState
          compact
          title="No public requests right now"
          description="New item requests from other users will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {visibleRequests.map((request) => {
            const requester = request.requesterId as User | string;
            const requesterName = typeof requester === "string" ? "Requester" : requester.name;
            return (
              <article key={request._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{request.title}</p>
                    <p className="text-xs text-slate-500">
                      {request.category}
                      {request.subcategory ? ` / ${request.subcategory}` : ""} · {request.locality},{" "}
                      {request.city}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Posted by {requesterName} · {shortDate(request.createdAt)}
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
                  {request.primaryConversationId ? (
                    <Link
                      href={`/chat/${request.primaryConversationId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Open Chat
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRespondRequestId(request._id);
                      setDraft({
                        itemRequestId: request._id,
                        listingId: "",
                        message: `Hi, I can help with "${request.title}". Before we proceed, can you confirm preferred timing and pickup/delivery details?`,
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold !text-white hover:bg-slate-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Respond
                  </button>
                </div>

                {activeRespondRequestId === request._id ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                    <p className="text-sm font-semibold text-slate-900">Respond to request</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Pick a quick reply or write your own response. This opens chat instantly.
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {quickRepliesForRequest(request).map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setDraft((prev) => ({ ...prev, message: reply }))}
                          className={`rounded-full border px-2.5 py-1 text-xs transition ${
                            draft.message === reply
                              ? "border-slate-900 bg-slate-900 !text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-medium text-slate-600">Attach listing (required)</span>
                        <select
                          value={draft.listingId}
                          onChange={(event) =>
                            setDraft((prev) => ({ ...prev, listingId: event.target.value }))
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Select listing</option>
                          {listingOptions.map((listing) => (
                            <option key={listing._id} value={listing._id}>
                              {listing.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                        Suggested rent:{" "}
                        <strong>
                          {formatCurrency(selectedListing?.rentPrice || selectedRequest?.budgetAmount || 0)}
                        </strong>
                      </div>
                    </div>

                    <label className="mt-2 block space-y-1">
                      <span className="text-xs font-medium text-slate-600">Message</span>
                      <textarea
                        value={draft.message}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, message: event.target.value }))
                        }
                        className="h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            buildListingResponseHandoffHref({
                              respondToItemRequestId: draft.itemRequestId,
                              responseMessage: draft.message,
                            }),
                          )
                        }
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Create listing instead
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRespondRequestId(null);
                          setDraft(initialResponseDraft);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={respondMutation.isPending || draft.message.trim().length < 3}
                        onClick={() => {
                          if (!draft.listingId) {
                            router.push(
                              buildListingResponseHandoffHref({
                                respondToItemRequestId: draft.itemRequestId,
                                responseMessage: draft.message,
                              }),
                            );
                            return;
                          }
                          respondMutation.mutate();
                        }}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold !text-white hover:bg-slate-700 disabled:opacity-60"
                      >
                        {respondMutation.isPending
                          ? "Sending..."
                          : draft.listingId
                            ? "Respond and open chat"
                            : "Create listing to continue"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      {hasMore ? (
        <p className="text-xs text-slate-500">
          Showing latest {maxItems} requests. Open full feed to view all.
        </p>
      ) : null}

    </section>
  );
}
