"use client";

import { useState } from "react";

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
}

export function RequestModal({ open, onClose, onSubmit }: RequestModalProps) {
  const [form, setForm] = useState<RequestFormPayload>({
    startDate: "",
    endDate: "",
    purpose: "",
    pickupPreference: "pickup",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-slate-900">Request This Item</h3>
        <p className="mt-1 text-sm text-slate-500">
          Share dates and purpose so the lender can review quickly.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">End Date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-slate-600">Purpose</label>
          <input
            value={form.purpose}
            onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Weekend shoot, house party, WFH setup..."
          />
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
                    ? "border-orange-300 bg-orange-50 text-orange-800"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {value === "pickup" ? "I will pick up" : "Need delivery"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-slate-600">Message</label>
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Hi, I need this for 3 days and can share ID proof at pickup."
          />
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
              setSubmitting(true);
              try {
                await onSubmit(form);
                onClose();
              } finally {
                setSubmitting(false);
              }
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
