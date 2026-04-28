"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Info, Loader2, X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { readListingResponseHandoffParams } from "@/lib/listing-response-handoff";
import type { Category, Listing } from "@/types/domain";

const rentUnits = ["day", "week", "month"] as const;
const conditions = ["Like New", "Good", "Fair"] as const;
type RentUnit = (typeof rentUnits)[number];

const photoAngles = [
  { key: "top", label: "Top View" },
  { key: "bottom", label: "Bottom View" },
  { key: "side1", label: "Side 1" },
  { key: "side2", label: "Side 2" },
  { key: "side3", label: "Side 3" },
  { key: "side4", label: "Side 4" },
] as const;
type PhotoAngleKey = (typeof photoAngles)[number]["key"];

const unitLabels: Record<RentUnit, string> = {
  day: "Per Day",
  week: "Per Week",
  month: "Per Month",
};

const categorySpecs: Record<string, string[]> = {
  Furniture: ["Material", "Dimensions"],
  "Cameras & Creator Gear": ["Brand", "Model", "Compatibility"],
  "Electronics & Gaming": ["Power", "Connectivity"],
  "Home Appliances": ["Capacity", "Power Rating"],
  "Tools & DIY": ["Tool Type", "Power Source"],
  "Events & Outdoor": ["Size", "Weather Use"],
};

const initialPhotoUrls: Record<PhotoAngleKey, string> = {
  top: "",
  bottom: "",
  side1: "",
  side2: "",
  side3: "",
  side4: "",
};

const initialUploadingState: Record<PhotoAngleKey, boolean> = {
  top: false,
  bottom: false,
  side1: false,
  side2: false,
  side3: false,
  side4: false,
};

interface CreateListingPageProps {
  mode?: "create" | "edit";
  listingId?: string;
}

interface ToastState {
  message: string;
  type: "error" | "success";
}

export default function CreateListingPage({ mode = "create", listingId }: CreateListingPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const isEditMode = mode === "edit" && Boolean(listingId);
  const handoff = readListingResponseHandoffParams(searchParams);
  const isRespondFlow = !isEditMode && Boolean(handoff);

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const categories = useMemo(() => data?.data.categories || [], [data?.data.categories]);
  const listingQuery = useQuery({
    queryKey: ["edit-listing", listingId],
    enabled: Boolean(isEditMode && listingId),
    queryFn: () => api.get<Listing>(`/api/listings/${listingId}`),
  });

  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    description: "",
    photoUrls: initialPhotoUrls,
    condition: "Like New",
    replacementValue: "",
    rentPricing: { day: "", week: "", month: "" } as Record<RentUnit, string>,
    enabledRentUnits: { day: true, week: false, month: false } as Record<RentUnit, boolean>,
    primaryRentUnit: "day" as RentUnit,
    depositAmount: "",
    city: "",
    locality: "",
    deliveryAvailable: false,
    rules: "",
    accessories: "",
    spec1: "",
    spec2: "",
  });
  const [photoUploading, setPhotoUploading] =
    useState<Record<PhotoAngleKey, boolean>>(initialUploadingState);
  const [saving, setSaving] = useState(false);
  const [hasHydratedExistingListing, setHasHydratedExistingListing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeCategory = useMemo(
    () => categories.find((category) => category.label === form.category),
    [categories, form.category],
  );
  const activeSpecs = categorySpecs[form.category] || [];
  const isLoadingExistingListing = isEditMode && !hasHydratedExistingListing && listingQuery.isLoading;

  useEffect(() => {
    if (!isEditMode || !listingQuery.data?.data || hasHydratedExistingListing) return;
    const listing = listingQuery.data.data;

    const pricingOptions =
      listing.pricingOptions && listing.pricingOptions.length > 0
        ? listing.pricingOptions
        : [{ unit: listing.rentUnit, price: listing.rentPrice }];
    const enabledRentUnits = { day: false, week: false, month: false } as Record<
      RentUnit,
      boolean
    >;
    const rentPricing = { day: "", week: "", month: "" } as Record<RentUnit, string>;
    pricingOptions.forEach((option) => {
      enabledRentUnits[option.unit] = true;
      rentPricing[option.unit] = String(option.price || "");
    });
    if (!enabledRentUnits[listing.rentUnit]) {
      enabledRentUnits[listing.rentUnit] = true;
      rentPricing[listing.rentUnit] = String(listing.rentPrice || "");
    }

    const photoUrls = { ...initialPhotoUrls };
    photoAngles.forEach((angle, index) => {
      photoUrls[angle.key] = listing.photos[index] || "";
    });

    const listingSpecs = listing.specifications || {};
    const specFields = categorySpecs[listing.category] || Object.keys(listingSpecs).slice(0, 2);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      title: listing.title || "",
      category: listing.category || "",
      subcategory: listing.subcategory || "",
      description: listing.description || "",
      photoUrls,
      condition: listing.condition || "Like New",
      replacementValue: String(listing.replacementValue || ""),
      rentPricing,
      enabledRentUnits,
      primaryRentUnit: listing.rentUnit,
      depositAmount: String(listing.depositAmount || ""),
      city: listing.city || "",
      locality: listing.locality || "",
      deliveryAvailable: Boolean(listing.deliveryAvailable),
      rules: (listing.rules || []).join(", "),
      accessories: (listing.accessories || []).join(", "),
      spec1: String((specFields[0] && listingSpecs[specFields[0]]) || ""),
      spec2: String((specFields[1] && listingSpecs[specFields[1]]) || ""),
    });
    setHasHydratedExistingListing(true);
  }, [hasHydratedExistingListing, isEditMode, listingQuery.data?.data]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
  }

  function parseFriendlyListingError(error: unknown, fallbackMessage: string) {
    if (!(error instanceof Error)) return fallbackMessage;
    const raw = error.message.trim();
    if (!raw) return fallbackMessage;
    const lowered = raw.toLowerCase();

    if (lowered.includes("invalid url")) return "Please upload valid image files for all required angles.";
    if (lowered.includes("title")) return "Title is too short. Add at least 3 characters.";
    if (lowered.includes("category")) return "Please choose a valid category and subcategory.";
    if (lowered.includes("description")) return "Description is too short. Add at least 10 characters.";
    if (lowered.includes("replacementvalue")) return "Replacement value must be greater than 0.";
    if (lowered.includes("depositamount")) return "Deposit amount cannot be negative.";
    if (lowered.includes("rentprice")) return "Rent must be greater than 0.";
    if (lowered.includes("city") || lowered.includes("locality")) {
      return "Please enter both city and locality.";
    }
    return raw;
  }

  async function uploadListingImage(file: File) {
    if (!token) {
      throw new Error("Please login again to upload photos.");
    }

    const body = new FormData();
    body.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    const contentType = response.headers.get("content-type");
    const payload = contentType?.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      throw new Error(
        (payload as { message?: string } | null)?.message || "Unable to upload image.",
      );
    }

    const uploadedUrl = (payload as { data?: { url?: string } })?.data?.url;
    if (!uploadedUrl) {
      throw new Error("Upload succeeded but URL was not returned.");
    }
    return uploadedUrl;
  }

  async function onPhotoSelected(angle: PhotoAngleKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      setPhotoUploading((prev) => ({ ...prev, [angle]: true }));
      const uploadedUrl = await uploadListingImage(file);
      setForm((prev) => ({
        ...prev,
        photoUrls: { ...prev.photoUrls, [angle]: uploadedUrl },
      }));
    } catch (error) {
      showToast(parseFriendlyListingError(error, "Image upload failed."));
    } finally {
      setPhotoUploading((prev) => ({ ...prev, [angle]: false }));
    }
  }

  function toggleRentUnit(unit: RentUnit, enabled: boolean) {
    setForm((prev) => {
      const nextEnabled = { ...prev.enabledRentUnits, [unit]: enabled };
      let nextPrimary = prev.primaryRentUnit;
      if (!nextEnabled[nextPrimary]) {
        const fallback = rentUnits.find((candidate) => nextEnabled[candidate]);
        nextPrimary = fallback || "day";
      }
      return { ...prev, enabledRentUnits: nextEnabled, primaryRentUnit: nextPrimary };
    });
  }

  return (
    <RequireAuth>
      {toast ? (
        <div className="pointer-events-none fixed right-4 top-20 z-[120] max-w-sm">
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
              toast.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {isEditMode ? "Edit Listing" : "Create Listing"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isEditMode
              ? "Update your listing details, pricing, and availability to keep requests accurate."
              : "Help renters trust your listing with complete angles, flexible pricing, and clear usage terms."}
          </p>
          {isRespondFlow ? (
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              Create this listing to continue the public request response flow. We will open chat
              right after publishing.
            </p>
          ) : null}
          {isLoadingExistingListing ? (
            <p className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
              Loading your listing details...
            </p>
          ) : null}
          {isEditMode && listingQuery.isError ? (
            <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800">
              Unable to load this listing for editing. Please retry from the listing page.
            </p>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Fields marked with <span className="font-black">*</span> are compulsory.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Title *</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Canon 80D DSLR Camera Kit"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Category *</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value,
                    subcategory: "",
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Subcategory *</span>
              <select
                value={form.subcategory}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subcategory: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select subcategory</option>
                {(activeCategory?.subcategories || []).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Condition</span>
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, condition: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-1">
            <span className="text-xs font-medium text-slate-600">Description *</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Describe usage, condition, included accessories, and ideal renter profile..."
            />
          </label>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <Info className="h-4 w-4 text-blue-700" />
              <p>Listing Photos * (6 slots: Top, Bottom, Side 1, Side 2, Side 3, Side 4)</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photoAngles.map((angle) => {
                const value = form.photoUrls[angle.key];
                const isUploading = photoUploading[angle.key];
                return (
                  <div
                    key={angle.key}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <p className="mb-2 text-xs font-semibold text-slate-700">{angle.label}</p>
                    <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {value ? (
                        <img src={value} alt={angle.label} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <ImagePlus className="h-5 w-5" />
                          <span className="text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    <input
                      id={`listing-photo-${angle.key}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => void onPhotoSelected(angle.key, event)}
                    />

                    <div className="flex gap-2">
                      <label
                        htmlFor={`listing-photo-${angle.key}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Uploading
                          </>
                        ) : (
                          "Upload Photo"
                        )}
                      </label>
                      {value ? (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              photoUrls: { ...prev.photoUrls, [angle.key]: "" },
                            }))
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <X className="h-3.5 w-3.5" />
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Replacement Value *</span>
              <input
                type="number"
                value={form.replacementValue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, replacementValue: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Deposit Amount *</span>
              <input
                type="number"
                value={form.depositAmount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, depositAmount: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Info className="h-4 w-4 text-blue-700" />
                Rent Pricing *
              </p>
              <p className="text-xs text-slate-500">
                Add one or more rent units. Example: per day + per week + per month.
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {rentUnits.map((unit) => (
                <div key={unit} className="rounded-xl border border-slate-200 bg-white p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.enabledRentUnits[unit]}
                      onChange={(event) => toggleRentUnit(unit, event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {unitLabels[unit]}
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={!form.enabledRentUnits[unit]}
                    value={form.rentPricing[unit]}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        rentPricing: { ...prev.rentPricing, [unit]: event.target.value },
                      }))
                    }
                    placeholder={`INR ${unit}`}
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[220px_1fr]">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Primary display price *</span>
                <select
                  value={form.primaryRentUnit}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      primaryRentUnit: event.target.value as RentUnit,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {rentUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unitLabels[unit]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">City *</span>
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Locality *</span>
              <input
                value={form.locality}
                onChange={(event) => setForm((prev) => ({ ...prev, locality: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.deliveryAvailable}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, deliveryAvailable: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Delivery available (can be delivered on request with an extra delivery charge)
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Rules (comma separated)</span>
              <textarea
                value={form.rules}
                onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))}
                className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                Accessories (comma separated)
              </span>
              <textarea
                value={form.accessories}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, accessories: event.target.value }))
                }
                className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {activeSpecs.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{activeSpecs[0]}</span>
                <input
                  value={form.spec1}
                  onChange={(event) => setForm((prev) => ({ ...prev, spec1: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{activeSpecs[1]}</span>
                <input
                  value={form.spec2}
                  onChange={(event) => setForm((prev) => ({ ...prev, spec2: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              disabled={saving || isLoadingExistingListing}
              onClick={async () => {
                if (isEditMode && !listingId) {
                  showToast("Listing id is missing.");
                  return;
                }

                if (!form.title.trim()) {
                  showToast("Title is required.");
                  return;
                }
                if (!form.category.trim() || !form.subcategory.trim()) {
                  showToast("Please select category and subcategory.");
                  return;
                }
                if (form.description.trim().length < 10) {
                  showToast("Description is too short. Please write at least 10 characters.");
                  return;
                }
                if (!form.city.trim() || !form.locality.trim()) {
                  showToast("Please enter both city and locality.");
                  return;
                }
                if (Number(form.replacementValue) <= 0 || Number.isNaN(Number(form.replacementValue))) {
                  showToast("Replacement value must be greater than 0.");
                  return;
                }
                if (Number(form.depositAmount) < 0 || Number.isNaN(Number(form.depositAmount))) {
                  showToast("Deposit amount cannot be negative.");
                  return;
                }

                const requiredAngles: PhotoAngleKey[] = ["top", "bottom", "side1"];
                const missingRequiredAngles = requiredAngles.filter(
                  (angle) => !form.photoUrls[angle].trim(),
                );
                if (missingRequiredAngles.length > 0) {
                  showToast("Please upload at least Top, Bottom, and Side 1 photos.");
                  return;
                }

                const photos = photoAngles
                  .map((angle) => form.photoUrls[angle.key].trim())
                  .filter(Boolean);
                if (photos.length === 0) {
                  showToast("Please add at least one photo.");
                  return;
                }

                const pricingOptions = rentUnits
                  .filter((unit) => form.enabledRentUnits[unit] && Number(form.rentPricing[unit]) > 0)
                  .map((unit) => ({ unit, price: Number(form.rentPricing[unit]) }));
                if (pricingOptions.length === 0) {
                  showToast("Please add at least one valid rent price.");
                  return;
                }

                let primaryRentUnit = form.primaryRentUnit;
                if (!pricingOptions.some((option) => option.unit === primaryRentUnit)) {
                  primaryRentUnit = pricingOptions[0].unit;
                }
                const primaryRentPrice =
                  pricingOptions.find((option) => option.unit === primaryRentUnit)?.price ||
                  pricingOptions[0].price;

                try {
                  setSaving(true);

                  const specifications: Record<string, string> = {};
                  if (activeSpecs[0] && form.spec1.trim()) {
                    specifications[activeSpecs[0]] = form.spec1.trim();
                  }
                  if (activeSpecs[1] && form.spec2.trim()) {
                    specifications[activeSpecs[1]] = form.spec2.trim();
                  }

                  const payload = {
                    title: form.title,
                    category: form.category,
                    subcategory: form.subcategory,
                    description: form.description,
                    photos,
                    condition: form.condition,
                    replacementValue: Number(form.replacementValue),
                    rentPrice: primaryRentPrice,
                    rentUnit: primaryRentUnit,
                    pricingOptions,
                    depositAmount: Number(form.depositAmount),
                    city: form.city,
                    locality: form.locality,
                    deliveryAvailable: form.deliveryAvailable,
                    rules: form.rules
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    accessories: form.accessories
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    specifications,
                  };
                  const response = isEditMode
                    ? await api.put<Listing>(`/api/listings/${listingId}`, payload, token)
                    : await api.post<Listing>("/api/listings", payload, token);
                  const savedListing = response.data;

                  if (!isEditMode && handoff) {
                    const autoMessage =
                      handoff.responseMessage.length >= 3
                        ? handoff.responseMessage
                        : `Hi, I have listed "${savedListing.title}" and can help with your request.`;

                    try {
                      const respondResult = await api.post<{ conversationId: string }>(
                        `/api/item-requests/${handoff.respondToItemRequestId}/respond`,
                        {
                          listingId: savedListing._id,
                          message: autoMessage,
                          proposedRent: savedListing.rentPrice,
                          proposedDeposit: savedListing.depositAmount,
                        },
                        token,
                      );
                      router.push(`/chat/${respondResult.data.conversationId}`);
                      return;
                    } catch (error) {
                      showToast(
                        error instanceof Error
                          ? `${parseFriendlyListingError(error, "Could not finish request response.")} Listing was created successfully; opening your listing now.`
                          : "Listing was created, but we could not complete request response. Opening listing.",
                      );
                      router.push(`/listings/${savedListing._id}`);
                      return;
                    }
                  }

                  if (isEditMode) {
                    showToast("Listing updated successfully.", "success");
                  }
                  router.push(`/listings/${savedListing._id}`);
                } catch (error) {
                  showToast(
                    parseFriendlyListingError(
                      error,
                      isEditMode ? "Unable to update listing." : "Unable to create listing.",
                    ),
                  );
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium !text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save Changes" : "Create Listing"}
            </button>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
