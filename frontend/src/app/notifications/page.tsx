"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { titleCase } from "@/lib/utils";
import type { NotificationItem } from "@/types/domain";

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?._id],
    enabled: Boolean(token && user),
    queryFn: () => api.get<NotificationItem[]>("/api/notifications?limit=80", token),
    refetchInterval: 20000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => api.put<{ message: string }>("/api/notifications/read-all", {}, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", user?._id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", user?._id, "navbar"] }),
      ]);
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => api.put<NotificationItem>(`/api/notifications/${id}/read`, {}, token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", user?._id] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", user?._id, "navbar"] }),
      ]);
    },
  });

  const notifications = notificationsQuery.data?.data || [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="mt-1 text-sm text-slate-600">
                Stay updated on request activity and listing changes.
              </p>
            </div>
            <button
              type="button"
              disabled={unreadCount === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Mark All Read
            </button>
          </div>
        </section>

        <section className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <EmptyState
                title="No notifications yet"
                description="You will see request, status, and listing updates here."
              />
            </div>
          ) : (
            notifications.map((notification) => {
              const isUnread = !notification.readAt;
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={async () => {
                    if (isUnread) {
                      await markOneRead.mutateAsync(notification._id);
                    }
                    if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                  className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${
                    isUnread
                      ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isUnread ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <BellRing className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {titleCase(notification.type.replaceAll("_", " "))} ·{" "}
                          {new Date(notification.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {isUnread ? (
                      <span className="rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold !text-white">
                        New
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </section>

        <p className="text-center text-xs text-slate-500">
          Need to review chats quickly? Open all conversations from{" "}
          <Link href="/chat" className="font-semibold text-blue-700 hover:text-blue-800">
            Chat
          </Link>
          .
        </p>
      </div>
    </RequireAuth>
  );
}
