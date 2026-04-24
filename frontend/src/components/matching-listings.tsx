import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LISTING_IMAGE_FALLBACK_URL } from "@/lib/config";
import type { Listing, User } from "@/types/domain";

interface MatchingListingsProps {
  listings: Listing[];
}

export function MatchingListings({ listings }: MatchingListingsProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <p className="text-sm font-semibold text-slate-900">No matching items yet.</p>
        <p className="mt-1 text-sm text-slate-600">
          We will notify you when lenders near you respond.
        </p>
        <Link
          href="/listings"
          className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
        >
          Browse similar items
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        const owner = listing.ownerId as User;
        return (
          <div key={listing._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img
              src={listing.photos[0] || LISTING_IMAGE_FALLBACK_URL}
              alt={listing.title}
              className="h-36 w-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = LISTING_IMAGE_FALLBACK_URL;
              }}
            />
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 font-semibold text-slate-900">{listing.title}</p>
              <p className="text-sm text-slate-700">
                {formatCurrency(listing.rentPrice)} / {listing.rentUnit}
              </p>
              <p className="text-xs text-slate-500">Deposit {formatCurrency(listing.depositAmount)}</p>
              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                {listing.locality}, {listing.city}
              </p>
              <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {owner?.name || "Verified Lender"}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/listings/${listing._id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  View Listing
                </Link>
                <Link
                  href={`/listings/${listing._id}`}
                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Request This Item
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
