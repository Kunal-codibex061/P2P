"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState } from "@/components/ui/empty-state";
import type { ItemRequest } from "@/types/domain";
import { RequestedItemCard } from "@/components/requested-item-card";

const tabs = [
  { key: "all", label: "All" },
  { key: "open", label: "Open Requests" },
  { key: "listing", label: "Listing Requests" },
  { key: "accepted", label: "Accepted" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

interface EditDraft {
  _id: string;
  title: string;
  purpose: string;
  startDate: string;
  endDate: string;
  budgetAmount: string;
  message: string;
}

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function RequestedItemsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);

  const requestsQuery = useQuery({
    queryKey: ["item-requests", "my"],
    queryFn: () => api.get<ItemRequest[]>("/api/item-requests/my", token),
    enabled: Boolean(token),
  });

  const requests = useMemo(() => requestsQuery.data?.data || [], [requestsQuery.data?.data]);
  const filtered = useMemo(() => {
    if (activeTab === "all") return requests;
    if (activeTab === "open") return requests.filter((request) => request.type === "open_request");
    if (activeTab === "listing") return requests.filter((request) => request.type === "listing_request");
    return requests.filter((request) => request.status === activeTab);
  }, [activeTab, requests]);

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => api.patch(`/api/item-requests/${requestId}/cancel`, {}, token),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["item-requests", "my"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: EditDraft) =>
      api.put(
        `/api/item-requests/${payload._id}`,
        {
          title: payload.title,
          purpose: payload.purpose,
          startDate: payload.startDate,
          endDate: payload.endDate,
          budgetAmount: Number(payload.budgetAmount),
          message: payload.message,
        },
        token,
      ),
    onSuccess: async () => {
      setEditDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["item-requests", "my"] });
    },
  });

  function handleEdit(request: ItemRequest) {
    if (request.type !== "open_request") return;
    setEditDraft({
      _id: request._id,
      title: request.title,
      purpose: request.purpose,
      startDate: toDateInput(request.startDate),
      endDate: toDateInput(request.endDate),
      budgetAmount: String(request.budgetAmount),
      message: request.message,
    });
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Requested Items</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your listing-specific requests and open item demands in one place.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  activeTab === tab.key
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {requestsQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No requested items yet"
              description="Start with the Request Item floating button to post your demand."
            />
          ) : (
            <div className="grid gap-3">
              {filtered.map((request) => (
                <RequestedItemCard
                  key={request._id}
                  request={request}
                  onCancel={(requestId) => cancelMutation.mutate(requestId)}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {editDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit Open Request</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={editDraft.title}
                onChange={(event) =>
                  setEditDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Request title"
              />
              <input
                value={editDraft.purpose}
                onChange={(event) =>
                  setEditDraft((prev) => (prev ? { ...prev, purpose: event.target.value } : prev))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Purpose"
              />
              <input
                type="date"
                value={editDraft.startDate}
                onChange={(event) =>
                  setEditDraft((prev) => (prev ? { ...prev, startDate: event.target.value } : prev))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={editDraft.endDate}
                onChange={(event) =>
                  setEditDraft((prev) => (prev ? { ...prev, endDate: event.target.value } : prev))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={editDraft.budgetAmount}
                onChange={(event) =>
                  setEditDraft((prev) =>
                    prev ? { ...prev, budgetAmount: event.target.value } : prev,
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                placeholder="Budget amount"
              />
              <textarea
                value={editDraft.message}
                onChange={(event) =>
                  setEditDraft((prev) => (prev ? { ...prev, message: event.target.value } : prev))
                }
                className="h-24 rounded-xl border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditDraft(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateMutation.isPending}
                onClick={() => editDraft && updateMutation.mutate(editDraft)}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
