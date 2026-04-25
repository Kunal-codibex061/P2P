"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatCurrency, getId, shortDate } from "@/lib/utils";
import type { Conversation, ItemRequest, Listing, OpenRequestResponse, User } from "@/types/domain";
import { RequestStatusBadge } from "@/components/request-status-badge";
import { RequestTimeline } from "@/components/request-timeline";
import { MatchingListings } from "@/components/matching-listings";

interface ItemRequestDetailPayload extends ItemRequest {
  responses: OpenRequestResponse[];
  conversations: Conversation[];
}

export default function RequestedItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { token } = useAuth();

  const detailQuery = useQuery({
    queryKey: ["item-request", params.id],
    queryFn: () => api.get<ItemRequestDetailPayload>(`/api/item-requests/${params.id}`, token),
    enabled: Boolean(token && params.id),
  });

  const matchesQuery = useQuery({
    queryKey: ["item-request-matches", params.id],
    queryFn: () => api.get<Listing[]>(`/api/item-requests/${params.id}/matches`, token),
    enabled: Boolean(token && params.id),
  });

  const request = detailQuery.data?.data;
  const responses = request?.responses || [];
  const matches = matchesQuery.data?.data || [];

  return (
    <RequireAuth>
      {!request ? (
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">
                  {request.category}
                  {request.subcategory ? ` / ${request.subcategory}` : ""}
                </p>
                <h1 className="text-2xl font-bold text-slate-900">{request.title}</h1>
                <p className="mt-1 text-sm text-slate-600">{request.purpose}</p>
              </div>
              <RequestStatusBadge status={request.status} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Dates</p>
                <p className="text-sm font-semibold text-slate-900">
                  {shortDate(request.startDate)} - {shortDate(request.endDate)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Budget</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(request.budgetAmount)} / {request.budgetUnit}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-semibold text-slate-900">
                  {request.locality}, {request.city}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Urgency</p>
                <p className="text-sm font-semibold text-slate-900">{request.urgency}</p>
              </div>
            </div>

            <div className="mt-4">
              <RequestTimeline status={request.status} />
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Message to lenders</p>
              <p className="text-sm text-slate-700">{request.message}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                KYC willingness: {request.kycWillingness ? "Yes" : "No"}
              </span>
              {request.referenceImageUrl ? (
                <Link
                  href={request.referenceImageUrl}
                  target="_blank"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Reference URL
                </Link>
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Responses from Lenders</h2>
            {responses.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                No lender responses yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {responses.map((response) => {
                  const lender = response.lenderId as User;
                  const listing = response.listingId as Listing | null;
                  const chatConversation = request.conversations?.find(
                    (item) => getId(item.lenderId) === getId(lender?._id ? lender : response.lenderId),
                  );
                  return (
                    <div key={response._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{lender?.name || "Lender"}</p>
                          <p className="text-xs text-slate-500">
                            {lender?.city}, {lender?.locality}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">{shortDate(response.createdAt)}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{response.message}</p>
                      <p className="mt-2 text-sm text-slate-700">
                        Proposed rent {formatCurrency(response.proposedRent)} · Deposit{" "}
                        {formatCurrency(response.proposedDeposit)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {listing ? (
                          <Link
                            href={`/listings/${listing._id}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            View Listing
                          </Link>
                        ) : null}
                        {chatConversation ? (
                          <Link
                            href={`/chat/${chatConversation._id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3 pb-8">
            <h2 className="text-lg font-semibold text-slate-900">Matching Listings</h2>
            <MatchingListings listings={matches} />
          </section>
        </div>
      )}
    </RequireAuth>
  );
}
