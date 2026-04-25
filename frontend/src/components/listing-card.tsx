import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { LISTING_IMAGE_FALLBACK_URL } from "@/lib/config";
import type { Listing, User } from "@/types/domain";
import { formatCurrency } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const owner = listing.ownerId as User;

  return (
    <Link
      href={`/listings/${listing._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={listing.photos[0] || LISTING_IMAGE_FALLBACK_URL}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = LISTING_IMAGE_FALLBACK_URL;
          }}
        />
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/95 px-2 py-1 text-xs font-medium text-slate-800">
            {listing.category}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{listing.title}</h3>
          <div className="text-right">
            <p className="text-base font-bold text-slate-900">
              {formatCurrency(listing.rentPrice)}
            </p>
            <p className="text-xs text-slate-500">per {listing.rentUnit}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {listing.locality}, {listing.city}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {listing.isVerifiedOwner && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Trusted Lender
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Deposit Required
          </span>
        </div>

        <div className="flex items-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            {owner?.name || "Verified Lender"}
          </span>
        </div>
      </div>
    </Link>
  );
}
