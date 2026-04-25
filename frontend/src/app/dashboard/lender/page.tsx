"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { LifecycleStepper } from "@/components/ui/lifecycle-stepper";
import { RequestStatusActions } from "@/components/request-status-actions";
import { api } from "@/lib/api";
import { LISTING_IMAGE_FALLBACK_URL } from "@/lib/config";
import { formatCurrency, shortDate, titleCase } from "@/lib/utils";
import type { Listing, RentalRequest, User } from "@/types/domain";

export default function LenderDashboardPage() {
  const { token, user } = useAuth();

  const listingsQuery = useQuery({
    queryKey: ["my-listings", user?._id],
    queryFn: () =>
      api.get<Listing[]>(
        `/api/listings?ownerId=${encodeURIComponent(user!._id)}&moderationStatus=approved`,
        token,
      ),
    enabled: Boolean(token && user?._id),
  });

  const requestsQuery = useQuery({
    queryKey: ["requests", "lender", user?._id],
    queryFn: () => api.get<RentalRequest[]>("/api/requests?role=lender", token),
    enabled: Boolean(token && user?._id),
  });

  const listings = listingsQuery.data?.data || [];
  const requests = requestsQuery.data?.data || [];
  const estimatedEarnings = requests
    .filter((request) => request.status === "completed")
    .reduce((total, request) => total + request.quotedRent, 0);

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Lender Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage listings, respond to incoming requests, and track rental lifecycle.
          </p>
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-white p-4">
            <p className="text-xs text-slate-500">Estimated earnings (completed rentals)</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(estimatedEarnings)}</p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My Listings</h2>
            <Link href="/listings/new" className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
              Create listing
            </Link>
          </div>
          {listings.length === 0 ? (
            <EmptyState
              compact
              compactLayout="full"
              title="No listings yet"
              description="Publish your first big-ticket item."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Link
                  key={listing._id}
                  href={`/listings/${listing._id}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={listing.photos[0] || LISTING_IMAGE_FALLBACK_URL}
                    alt={listing.title}
                    className="h-36 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = LISTING_IMAGE_FALLBACK_URL;
                    }}
                  />
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 font-medium text-slate-900">{listing.title}</p>
                    <p className="text-xs text-slate-500">
                      {listing.locality}, {listing.city}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(listing.rentPrice)} / {listing.rentUnit}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 pb-8">
          <h2 className="text-lg font-semibold text-slate-900">Incoming Requests</h2>
          {requests.length === 0 ? (
            <EmptyState
              compact
              compactLayout="full"
              title="No incoming requests"
              description="New renter requests will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {requests.map((request) => {
                const listing = request.listingId as Listing;
                const renter = request.renterId as User;
                return (
                  <div key={request._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{listing.title}</p>
                        <p className="text-xs text-slate-500">
                          From {renter.name} · {shortDate(request.startDate)} - {shortDate(request.endDate)}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {titleCase(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Purpose: {request.purpose} · Quoted rent {formatCurrency(request.quotedRent)}
                    </p>
                    <div className="mt-3">
                      <LifecycleStepper status={request.status} />
                    </div>
                    <RequestStatusActions requestId={request._id} status={request.status} token={token!} role="lender" />
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </RequireAuth>
  );
}
