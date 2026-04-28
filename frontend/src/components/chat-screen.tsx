"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LifecycleStepper } from "@/components/ui/lifecycle-stepper";
import { SafetyBanner } from "@/components/ui/safety-banner";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { formatCurrency, getId, shortDate, titleCase } from "@/lib/utils";
import type { Conversation, ItemRequest, Listing, RentalRequest, User } from "@/types/domain";
import { RequestTimeline } from "./request-timeline";

const quickActions = [
  "Is this available?",
  "Can I pick it up today?",
  "Can you reduce the price?",
  "Is delivery possible?",
];

interface ConversationMessageEvent {
  conversationId: string;
  updatedAt: string;
}

export function ChatScreen({ initialConversationId }: { initialConversationId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const [draft, setDraft] = useState("");

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?._id],
    queryFn: () => api.get<Conversation[]>("/api/conversations", token),
    enabled: Boolean(token),
    refetchInterval: 12000,
  });

  const conversations = conversationsQuery.data?.data || [];
  const selectedConversationId = initialConversationId || conversations[0]?._id;

  const conversationDetailQuery = useQuery({
    queryKey: ["conversation-detail", selectedConversationId],
    enabled: Boolean(selectedConversationId && token),
    queryFn: () => api.get<Conversation>(`/api/conversations/${selectedConversationId}`, token),
    refetchInterval: 12000,
  });

  const selectedConversation = conversationDetailQuery.data?.data;

  const request = selectedConversation?.requestId as RentalRequest | undefined;
  const itemRequest = selectedConversation?.itemRequestId as ItemRequest | undefined;
  const listing = selectedConversation?.listingId as Listing | undefined;
  const listingOwnerId =
    listing && typeof listing.ownerId === "object" ? listing.ownerId?._id : (listing?.ownerId as string | undefined);
  const isListingOwner = Boolean(user?._id && listingOwnerId && user._id === listingOwnerId);

  useEffect(() => {
    if (!token || !user?._id || typeof window === "undefined") return;

    const events = new EventSource(
      `${API_BASE_URL}/api/conversations/events?token=${encodeURIComponent(token)}`,
    );

    const onConversationMessage: EventListener = (event) => {
      const messageEvent = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(messageEvent.data) as ConversationMessageEvent;
        queryClient.invalidateQueries({ queryKey: ["conversations", user._id] });
        queryClient.invalidateQueries({
          queryKey: ["conversation-detail", payload.conversationId],
        });
        if (payload.conversationId === selectedConversationId) {
          queryClient.refetchQueries({
            queryKey: ["conversation-detail", payload.conversationId],
          });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ["conversations", user._id] });
      }
    };

    events.addEventListener("conversation-message", onConversationMessage);
    return () => {
      events.removeEventListener("conversation-message", onConversationMessage);
      events.close();
    };
  }, [queryClient, selectedConversationId, token, user?._id]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedConversationId) return;
      await api.post(
        `/api/conversations/${selectedConversationId}/messages`,
        { text, type: "text" },
        token,
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversation-detail", selectedConversationId] }),
        queryClient.invalidateQueries({ queryKey: ["conversations", user?._id] }),
      ]);
      setDraft("");
    },
  });

  const updateListingStatus = useMutation({
    mutationFn: async (nextStatus: Listing["availabilityStatus"]) => {
      if (!listing?._id) return;
      await api.put(`/api/listings/${listing._id}`, { availabilityStatus: nextStatus }, token);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversation-detail", selectedConversationId] }),
        queryClient.invalidateQueries({ queryKey: ["listing", listing?._id] }),
      ]);
    },
  });

  const orderedMessages = useMemo(() => {
    const messages = selectedConversation?.messages || [];
    return [...messages].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }, [selectedConversation?.messages]);

  return (
    <RequireAuth>
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-4 lg:min-h-[calc(100svh-10rem)] lg:grid-cols-[340px_minmax(0,1fr)] lg:items-stretch">
        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-semibold text-slate-900">Conversations</h2>
          </div>
          <div className="overflow-y-auto p-2 lg:min-h-0 lg:flex-1">
            {conversations.length === 0 ? (
              <EmptyState
                title="No chats yet"
                description="Send a request from any listing to start a conversation."
              />
            ) : (
              conversations.map((conversation) => {
                const other =
                  getId(conversation.renterId) === user?._id
                    ? (conversation.lenderId as User)
                    : (conversation.renterId as User);
                const itemListing = conversation.listingId as Listing;
                const openRequest = conversation.itemRequestId as ItemRequest | undefined;
                return (
                  <button
                    key={conversation._id}
                    onClick={() => router.push(`/chat/${conversation._id}`)}
                    className={`w-full rounded-2xl p-3 text-left transition ${
                      conversation._id === selectedConversationId
                        ? "accent-bg-soft"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={other.profilePhoto}
                        alt={other.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">{other.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {itemListing?.title || openRequest?.title || "Open request conversation"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          {!selectedConversation ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center">
              <EmptyState
                title="Select a conversation"
                description="Open a chat from left to continue rental discussion."
              />
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {listing?.title || itemRequest?.title || "Conversation"}
                    </p>
                    {request ? (
                      <p className="text-xs text-slate-500">
                        {shortDate(request.startDate)} - {shortDate(request.endDate)} ·{" "}
                        {titleCase(request.pickupPreference)}
                      </p>
                    ) : itemRequest ? (
                      <p className="text-xs text-slate-500">
                        {shortDate(itemRequest.startDate)} - {shortDate(itemRequest.endDate)} ·{" "}
                        {titleCase(itemRequest.pickupDeliveryPreference)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isListingOwner && listing?._id ? (
                      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
                        <span className="font-semibold text-slate-700">Item status</span>
                        <select
                          value={listing.availabilityStatus}
                          onChange={(event) =>
                            updateListingStatus.mutate(
                              event.target.value as Listing["availabilityStatus"],
                            )
                          }
                          disabled={updateListingStatus.isPending}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          <option value="available">Available</option>
                          <option value="unavailable">Unavailable</option>
                          <option value="rented">Rented</option>
                        </select>
                        {updateListingStatus.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                        ) : null}
                      </label>
                    ) : null}

                    {listing?._id ? (
                      <Link
                        href={`/listings/${listing._id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        View Listing
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-2 text-sm">
                    Rent:{" "}
                    <strong>
                      {formatCurrency(request?.quotedRent || itemRequest?.budgetAmount || 0)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-sm">
                    Deposit:{" "}
                    <strong>
                      {formatCurrency(request?.depositAmount || 0)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-sm">
                    Status: <strong>{titleCase(request?.status || itemRequest?.status || "open")}</strong>
                  </div>
                </div>
                <div className="mt-3">
                  {request ? (
                    <LifecycleStepper status={request.status} />
                  ) : itemRequest ? (
                    <RequestTimeline status={itemRequest.status} />
                  ) : null}
                </div>
              </div>

              <SafetyBanner />

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
                <div className="space-y-2 overflow-y-auto p-4 lg:min-h-0 lg:flex-1">
                  {orderedMessages.map((message, index) => {
                    const mine = message.senderId === user?._id;
                    return message.type === "system" ? (
                      <div
                        key={`${message.createdAt}-${index}`}
                        className="mx-auto max-w-xl rounded-xl bg-slate-100 px-3 py-2 text-center text-xs text-slate-600"
                      >
                        {message.text}
                      </div>
                    ) : (
                      <div
                        key={`${message.createdAt}-${index}`}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-slate-900 !text-white"
                              : "border border-slate-200 bg-white text-slate-800"
                          }`}
                        >
                          {message.text}
                          <p
                            className={`mt-1 text-[11px] ${
                              mine ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 border-t border-slate-200 p-4">
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action}
                        type="button"
                        onClick={() => sendMessage.mutate(action)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      >
                        {action}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Type your message..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => draft.trim() && sendMessage.mutate(draft.trim())}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 !text-white hover:bg-slate-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </RequireAuth>
  );
}
