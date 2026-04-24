"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MapPin, ShieldCheck, Star } from "lucide-react";
import { RequestModal, type RequestFormPayload } from "@/components/request-modal";
import { SafetyBanner } from "@/components/ui/safety-banner";
import { TrustBadge } from "@/components/ui/trust-badge";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import { LISTING_IMAGE_FALLBACK_URL } from "@/lib/config";
import { formatCurrency, getId } from "@/lib/utils";
import type { Conversation, Listing, RentalRequest, User } from "@/types/domain";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);

  const listingQuery = useQuery({
    queryKey: ["listing", params.id],
    queryFn: () => api.get<Listing>(`/api/listings/${params.id}`),
  });

  const requestsQuery = useQuery({
    queryKey: ["listing-requests", params.id, user?._id],
    enabled: Boolean(token && user),
    queryFn: () =>
      api.get<RentalRequest[]>(
        `/api/requests?role=all&listingId=${encodeURIComponent(params.id)}`,
        token,
      ),
  });

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?._id],
    enabled: Boolean(token && user),
    queryFn: () => api.get<Conversation[]>("/api/conversations", token),
  });

  const listing = listingQuery.data?.data;
  const owner = listing?.ownerId as User | undefined;
  const pricingOptions =
    listing?.pricingOptions && listing.pricingOptions.length > 0
      ? [...listing.pricingOptions]
      : listing
        ? [{ unit: listing.rentUnit, price: listing.rentPrice }]
        : [];
  const pricingOrder = { day: 1, week: 2, month: 3 };
  const sortedPricingOptions = pricingOptions.sort(
    (left, right) => pricingOrder[left.unit] - pricingOrder[right.unit],
  );
  const galleryPhotos =
    listing?.photos && listing.photos.length > 0
      ? listing.photos.slice(0, 3)
      : [LISTING_IMAGE_FALLBACK_URL];

  const myRequest = useMemo(() => {
    const all = requestsQuery.data?.data || [];
    return all.find((request) => getId(request.renterId) === user?._id);
  }, [requestsQuery.data?.data, user?._id]);

  const conversationForRequest = useMemo(() => {
    if (!myRequest) return null;
    const allConversations = conversationsQuery.data?.data || [];
    return allConversations.find(
      (conversation) => getId(conversation.requestId) === myRequest._id,
    );
  }, [conversationsQuery.data?.data, myRequest]);

  async function handleRequestSubmit(payload: RequestFormPayload) {
    if (!token || !user) {
      router.push("/login");
      return;
    }
    try {
      const response = await api.post<{ request: RentalRequest; conversationId: string }>(
        "/api/requests",
        {
          listingId: params.id,
          ...payload,
        },
        token,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["listing-requests", params.id, user._id] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user._id] }),
      ]);
      router.push(`/chat/${response.data.conversationId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const payloadData = (error.payload as { data?: { conversationId?: string } })?.data;
        if (payloadData?.conversationId) {
          router.push(`/chat/${payloadData.conversationId}`);
          return;
        }
      }
      alert(error instanceof Error ? error.message : "Unable to create request.");
    }
  }

  if (listingQuery.isLoading || !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-[460px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-1 sm:grid-cols-3">
            {galleryPhotos.map((photo, index) => (
              <img
                key={`${photo}-${index}`}
                src={photo}
                alt={`${listing.title} ${index + 1}`}
                className={`h-52 w-full object-cover sm:h-64 ${index === 0 ? "sm:col-span-2 sm:row-span-2 sm:h-full" : ""}`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = LISTING_IMAGE_FALLBACK_URL;
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{listing.category}</p>
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {listing.locality}, {listing.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {formatCurrency(listing.rentPrice)}
              </p>
              <p className="text-sm text-slate-500">per {listing.rentUnit}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {owner?.isPhoneVerified && <TrustBadge type="phone" />}
            {owner?.kycStatus === "verified" && <TrustBadge type="identity" />}
            {listing.isVerifiedOwner && <TrustBadge type="trusted" />}
            {listing.deliveryAvailable && <TrustBadge type="delivery" />}
            <TrustBadge type="deposit" />
          </div>

          {sortedPricingOptions.length > 0 && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Rent Pricing Options</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sortedPricingOptions.map((option) => (
                  <span
                    key={option.unit}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      option.unit === listing.rentUnit
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {formatCurrency(option.price)} / {option.unit}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Condition</p>
              <p className="font-semibold text-slate-900">{listing.condition}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Replacement Value</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(listing.replacementValue)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Deposit</p>
              <p className="font-semibold text-slate-900">
                {formatCurrency(listing.depositAmount)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Availability</p>
              <p className="font-semibold text-slate-900">
                {listing.availabilityStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-700">{listing.description}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Rules</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {listing.rules.map((rule) => (
                  <li key={rule}>• {rule}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Accessories</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {listing.accessories.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <SafetyBanner />
          </div>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Owner Profile</h2>
          <div className="mt-3 flex items-center gap-3">
            <img src={owner?.profilePhoto} alt={owner?.name} className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-slate-900">{owner?.name}</p>
              <p className="text-sm text-slate-500">
                {owner?.city}, {owner?.locality}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <Star className="h-4 w-4 text-amber-500" />
            {owner?.lenderRating?.toFixed(1)} lender rating
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Booking Action</p>
          {myRequest && conversationForRequest ? (
            <Link
              href={`/chat/${conversationForRequest._id}`}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Chat
            </Link>
          ) : (
            <button
              onClick={() => setShowRequestModal(true)}
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Request Item
            </button>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {myRequest
              ? `Request status: ${myRequest.status.replace("_", " ")}`
              : "Submit dates and purpose to start secure in-app chat."}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
          <p className="font-semibold text-slate-900">Trust & Safety</p>
          <ul className="mt-2 space-y-2 text-slate-600">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
              Verified profiles get priority exposure.
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              Keep all conversation and payments inside the app.
            </li>
          </ul>
          <div className="mt-4 flex gap-2">
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
              Report Listing
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
              Report User
            </button>
          </div>
        </div>
      </aside>

      <RequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleRequestSubmit}
      />
    </div>
  );
}
