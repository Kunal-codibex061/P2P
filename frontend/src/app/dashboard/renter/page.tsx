"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { LifecycleStepper } from "@/components/ui/lifecycle-stepper";
import { RequestStatusActions } from "@/components/request-status-actions";
import { api } from "@/lib/api";
import { formatCurrency, getId, shortDate, titleCase } from "@/lib/utils";
import type { Listing, RentalRequest, User } from "@/types/domain";

const activeStatuses = ["accepted", "confirmed", "active", "return_pending"];

function RequestCard({ request, token }: { request: RentalRequest; token: string }) {
  const listing = request.listingId as Listing;
  const lender = request.lenderId as User;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/listings/${getId(request.listingId)}`}
            className="font-semibold text-slate-900 hover:text-[color:var(--accent)]"
          >
            {listing.title}
          </Link>
          <p className="text-xs text-slate-500">
            With {lender.name} · {listing.locality}, {listing.city}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {titleCase(request.status)}
        </span>
      </div>
      <div className="mt-2 text-sm text-slate-600">
        {shortDate(request.startDate)} - {shortDate(request.endDate)} · Rent{" "}
        <strong>{formatCurrency(request.quotedRent)}</strong>
      </div>
      <div className="mt-3">
        <LifecycleStepper status={request.status} />
      </div>
      <RequestStatusActions requestId={request._id} status={request.status} token={token} role="renter" />
    </div>
  );
}

export default function RenterDashboardPage() {
  const { token } = useAuth();

  const requestsQuery = useQuery({
    queryKey: ["requests", "renter"],
    queryFn: () => api.get<RentalRequest[]>("/api/requests?role=renter", token),
    enabled: Boolean(token),
  });

  const requests = requestsQuery.data?.data || [];
  const activeRequests = requests.filter((item) => activeStatuses.includes(item.status));
  const completedRequests = requests.filter((item) => item.status === "completed");

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Renter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Track all your requests, active rentals, and completed bookings.</p>
          <div className="mt-3">
            <Link
              href="/requested-items"
              className="inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Open Requested Items
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">My Requests</h2>
          {requests.length === 0 ? (
            <EmptyState
              compact
              compactLayout="full"
              title="No rental requests yet"
              description="Explore rentals and request your first item."
            />
          ) : (
            <div className="grid gap-3">
              {requests.map((request) => (
                <RequestCard key={request._id} request={request} token={token!} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Active Rentals</h2>
          {activeRequests.length === 0 ? (
            <EmptyState
              compact
              compactLayout="full"
              title="No active rentals"
              description="Accepted rentals will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {activeRequests.map((request) => (
                <RequestCard key={request._id} request={request} token={token!} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 pb-8">
          <h2 className="text-lg font-semibold text-slate-900">Completed Rentals</h2>
          {completedRequests.length === 0 ? (
            <EmptyState
              compact
              compactLayout="full"
              title="No completed rentals yet"
              description="Completed bookings will appear here."
            />
          ) : (
            <div className="grid gap-3">
              {completedRequests.map((request) => (
                <RequestCard key={request._id} request={request} token={token!} />
              ))}
            </div>
          )}
        </section>
      </div>
    </RequireAuth>
  );
}
