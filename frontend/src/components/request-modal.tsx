"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { DateRangeSelectorModal } from "@/components/date-range-selector-modal";
import { formatIntentDate } from "@/lib/rental-intent";
import { cn } from "@/lib/utils";

export interface RequestFormPayload {
  startDate: string;
  endDate: string;
  purpose: string;
  pickupPreference: "pickup" | "delivery";
  message: string;
}

interface RequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: RequestFormPayload) => Promise<void>;
  initialDates?: {
    startDate?: string;
    endDate?: string;
  };
}

export function RequestModal({ open, onClose, onSubmit, initialDates }: RequestModalProps) {
  const [form, setForm] = useState<RequestFormPayload>({
    startDate: initialDates?.startDate || "",
    endDate: initialDates?.endDate || "",
    purpose: "",
    pickupPreference: "pickup",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [errors, setErrors] = useState<{
    dates?: boolean;
    purpose?: boolean;
    message?: boolean;
  }>({});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Request This Item</h3>
        <p className="mt-1 text-sm text-slate-500">
          Share dates and purpose so the lender can review quickly.
        </p>

        <div
          className={cn(
            "mt-5 space-y-2 rounded-2xl border border-transparent p-2",
            errors.dates && "border-rose-300 bg-rose-50/70",
          )}
        >
          <p className={cn("text-xs font-medium text-slate-600", errors.dates && "text-rose-700")}>
            Rental Dates *
          </p>
          <button
            type="button"
            onClick={() => setDateModalOpen(true)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left transition hover:border-lime-300 hover:bg-lime-50",
              errors.dates ? "border-rose-300" : "border-slate-200",
            )}
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              {form.startDate && form.endDate
                ? `${formatIntentDate(form.startDate)} - ${formatIntentDate(form.endDate)}`
                : "Select delivery and pickup dates"}
            </span>
            <span className="text-xs font-bold text-blue-700">Edit</span>
          </button>
          {errors.dates ? (
            <p className="text-xs font-medium text-rose-700">Please select both delivery and pickup dates.</p>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-3 space-y-1 rounded-2xl border border-transparent p-2",
            errors.purpose && "border-rose-300 bg-rose-50/70",
          )}
        >
          <label className={cn("text-xs font-medium text-slate-600", errors.purpose && "text-rose-700")}>
            Purpose *
          </label>
          <input
            value={form.purpose}
            onChange={(event) => {
              const nextValue = event.target.value;
              setForm((prev) => ({ ...prev, purpose: nextValue }));
              if (nextValue.trim().length > 0) {
                setErrors((prev) => ({ ...prev, purpose: false }));
              }
            }}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-sm",
              errors.purpose ? "border-rose-300" : "border-slate-200",
            )}
            placeholder="Weekend shoot, house party, WFH setup..."
          />
          {errors.purpose ? (
            <p className="text-xs font-medium text-rose-700">Tell the owner why you need this item.</p>
          ) : null}
        </div>

        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-slate-600">Pickup Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {(["pickup", "delivery"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, pickupPreference: value }))}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  form.pickupPreference === value
                    ? "accent-border-soft accent-bg-soft accent-text-strong"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {value === "pickup" ? "I will pick up" : "Need delivery"}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "mt-3 space-y-1 rounded-2xl border border-transparent p-2",
            errors.message && "border-rose-300 bg-rose-50/70",
          )}
        >
          <label className={cn("text-xs font-medium text-slate-600", errors.message && "text-rose-700")}>
            Message *
          </label>
          <textarea
            value={form.message}
            onChange={(event) => {
              const nextValue = event.target.value;
              setForm((prev) => ({ ...prev, message: nextValue }));
              if (nextValue.trim().length > 0) {
                setErrors((prev) => ({ ...prev, message: false }));
              }
            }}
            className={cn(
              "h-24 w-full rounded-xl border px-3 py-2 text-sm",
              errors.message ? "border-rose-300" : "border-slate-200",
            )}
            placeholder="Hi, I need this for 3 days and can share ID proof at pickup."
          />
          {errors.message ? (
            <p className="text-xs font-medium text-rose-700">
              Add a short message so the owner can respond quickly.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              const validationErrors = {
                dates: !(form.startDate && form.endDate),
                purpose: form.purpose.trim().length === 0,
                message: form.message.trim().length === 0,
              };
              setErrors(validationErrors);
              if (validationErrors.dates || validationErrors.purpose || validationErrors.message) {
                return;
              }

              setSubmitting(true);
              try {
                await onSubmit({
                  ...form,
                  purpose: form.purpose.trim(),
                  message: form.message.trim(),
                });
                onClose();
              } finally {
                setSubmitting(false);
              }
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Send Request"}
          </button>
        </div>

        <DateRangeSelectorModal
          key={`${form.startDate || "none"}-${form.endDate || "none"}-${dateModalOpen ? "open" : "closed"}`}
          open={dateModalOpen}
          startDate={form.startDate}
          endDate={form.endDate}
          onClose={() => setDateModalOpen(false)}
          onApply={(range) => {
            setForm((prev) => ({ ...prev, ...range }));
            setErrors((prev) => ({ ...prev, dates: false }));
          }}
        />
      </div>
    </div>
  );
}
