"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "./auth-provider";
import type { Category, ItemRequest } from "@/types/domain";

interface RequestItemWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (request: ItemRequest) => void;
}

const steps = ["Need", "Details", "Additional", "Review"] as const;
const highValueCategories = new Set(["Cameras & Creator Gear", "Electronics & Gaming"]);

const depositOptions = [
  { value: "none", label: "No deposit preferred" },
  { value: "upto_1000", label: "Deposit up to INR 1,000" },
  { value: "upto_5000", label: "Deposit up to INR 5,000" },
  { value: "flexible", label: "Flexible" },
] as const;

const radiusOptions = [
  { value: 2, label: "2 km" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 999, label: "Anywhere in city" },
] as const;

const budgetUnits = ["day", "week", "month", "total"] as const;

const urgencyOptions = [
  { value: "today", label: "Need today" },
  { value: "this_week", label: "This week" },
  { value: "flexible", label: "Flexible" },
] as const;

const pickupOptions = [
  { value: "pickup", label: "I can pick up" },
  { value: "delivery", label: "Need delivery" },
  { value: "either", label: "Either works" },
] as const;

type WizardForm = {
  title: string;
  category: string;
  subcategory: string;
  purpose: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  budgetUnit: (typeof budgetUnits)[number];
  depositPreference: (typeof depositOptions)[number]["value"];
  pickupDeliveryPreference: (typeof pickupOptions)[number]["value"];
  city: string;
  locality: string;
  radiusKm: (typeof radiusOptions)[number]["value"];
  message: string;
  urgency: (typeof urgencyOptions)[number]["value"];
  kycWillingness: boolean;
  referenceImageUrl: string;
};

const initialForm: WizardForm = {
  title: "",
  category: "",
  subcategory: "",
  purpose: "",
  startDate: "",
  endDate: "",
  budgetAmount: "",
  budgetUnit: "total",
  depositPreference: "flexible",
  pickupDeliveryPreference: "either",
  city: "",
  locality: "",
  radiusKm: 5,
  message: "",
  urgency: "flexible",
  kycWillingness: false,
  referenceImageUrl: "",
};

export function RequestItemWizard({ open, onClose, onSuccess }: RequestItemWizardProps) {
  const { token, user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>({
    ...initialForm,
    city: user?.city || "",
    locality: user?.locality || "",
    kycWillingness: user?.kycStatus === "verified",
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const categories = categoriesQuery.data?.data.categories || [];
  const selectedCategory = categories.find((category) => category.label === form.category);

  const durationDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [form.endDate, form.startDate]);

  const showKycNudge =
    user?.kycStatus !== "verified" && highValueCategories.has(form.category);

  const createRequest = useMutation({
    mutationFn: () =>
      api.post<ItemRequest>(
        "/api/item-requests",
        {
          ...form,
          budgetAmount: Number(form.budgetAmount),
        },
        token,
      ),
    onSuccess: (response) => {
      onSuccess(response.data);
      setStep(0);
      setForm({
        ...initialForm,
        city: user?.city || "",
        locality: user?.locality || "",
        kycWillingness: user?.kycStatus === "verified",
      });
      onClose();
    },
  });

  if (!open) return null;

  const canContinue =
    step === 0
      ? Boolean(form.title && form.category && form.purpose)
      : step === 1
        ? Boolean(
            form.startDate &&
              form.endDate &&
              durationDays > 0 &&
              form.budgetAmount &&
              form.city &&
              form.locality,
          )
        : step === 2
          ? Boolean(form.message)
          : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
            Need something? Post a request and nearby lenders can respond.
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Request Item</h2>
          <div className="mt-3 grid grid-cols-4 gap-1">
            {steps.map((item, index) => (
              <div key={item} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full ${
                    index <= step ? "bg-orange-500" : "bg-slate-200"
                  }`}
                />
                <p className="text-[11px] text-slate-500">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-600">Item title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Eg. PS5 for weekend, office chair for 1 month"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Category</span>
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
                <span className="text-xs font-medium text-slate-600">Subcategory (optional)</span>
                <select
                  value={form.subcategory}
                  onChange={(event) => setForm((prev) => ({ ...prev, subcategory: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Any subcategory</option>
                  {(selectedCategory?.subcategories || []).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-600">Purpose</span>
                <input
                  value={form.purpose}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, purpose: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Weekend gaming, WFH setup, college event..."
                />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Start date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">End date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Duration: <strong>{durationDays > 0 ? `${durationDays} day(s)` : "Set dates"}</strong>
              </div>
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <input
                  type="number"
                  value={form.budgetAmount}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, budgetAmount: event.target.value }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Preferred budget"
                />
                <select
                  value={form.budgetUnit}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      budgetUnit: event.target.value as WizardForm["budgetUnit"],
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {budgetUnits.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Deposit comfort level</span>
                <select
                  value={form.depositPreference}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      depositPreference: event.target.value as WizardForm["depositPreference"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {depositOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Pickup/Delivery</span>
                <select
                  value={form.pickupDeliveryPreference}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      pickupDeliveryPreference:
                        event.target.value as WizardForm["pickupDeliveryPreference"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {pickupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">City</span>
                <input
                  value={form.city}
                  onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Locality</span>
                <input
                  value={form.locality}
                  onChange={(event) => setForm((prev) => ({ ...prev, locality: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-600">Search radius</span>
                <select
                  value={form.radiusKm}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      radiusKm: Number(event.target.value) as WizardForm["radiusKm"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {radiusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Message to lenders</span>
                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                  className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Share exact need, handling promise, and timing details."
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Urgency</span>
                <select
                  value={form.urgency}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, urgency: event.target.value as WizardForm["urgency"] }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {urgencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.kycWillingness}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, kycWillingness: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                I am willing to verify identity for this rental
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Reference image URL (optional)</span>
                <input
                  value={form.referenceImageUrl}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, referenceImageUrl: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </label>

              {showKycNudge && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  High-value category request detected. Identity verification can improve response quality.
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Requested item</p>
                <p className="text-sm font-semibold text-slate-900">{form.title}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Category</p>
                <p className="text-sm font-semibold text-slate-900">
                  {form.category}
                  {form.subcategory ? ` / ${form.subcategory}` : ""}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Dates</p>
                <p className="text-sm font-semibold text-slate-900">
                  {form.startDate} to {form.endDate}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Budget</p>
                <p className="text-sm font-semibold text-slate-900">
                  INR {form.budgetAmount || "0"} / {form.budgetUnit}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-semibold text-slate-900">
                  {form.locality}, {form.city}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">Pickup/Delivery</p>
                <p className="text-sm font-semibold text-slate-900">{form.pickupDeliveryPreference}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2">
                <p className="text-xs text-slate-500">Message</p>
                <p className="text-sm text-slate-800">{form.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep((prev) => prev - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step === steps.length - 1 ? (
            <button
              type="button"
              disabled={createRequest.isPending}
              onClick={() => createRequest.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Post Request
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
