"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  Handshake,
  Megaphone,
  MessageCircle,
  Shield,
  UserCircle2,
} from "lucide-react";
import { RentalIntentSelector } from "@/components/rental-intent-selector";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/domain";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const pathname = usePathname();
  const shouldHideNavbar =
    pathname === "/login" ||
    pathname === "/listings/new" ||
    /^\/listings\/[^/]+\/edit$/.test(pathname);
  const { user, token, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?._id, "navbar"],
    enabled: Boolean(user && token),
    queryFn: () => api.get<NotificationItem[]>("/api/notifications?limit=20", token),
    refetchInterval: 15000,
  });
  const unreadCount = (notificationsQuery.data?.data || []).filter((item) => !item.readAt).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setProfileOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/96 shadow-sm backdrop-blur-xl"
    >
      <div
        className="mx-auto grid w-full max-w-7xl items-center gap-3 px-4 py-2 lg:grid-cols-[13rem_minmax(0,1fr)_auto]"
      >
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 !text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black">RentEasy</p>
            <p className="hidden text-xs font-normal text-slate-500 xl:block">
              Trusted local rentals
            </p>
          </div>
        </Link>

        <div className="order-3 lg:order-2">
          <RentalIntentSelector
            variant="navbar"
            showDateSelector={false}
            className="shadow-none"
          />
        </div>

        <div className="order-2 flex items-center justify-end gap-2 lg:order-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 transition",
                    profileOpen ? "accent-border-soft accent-bg-soft" : "hover:bg-slate-100",
                  )}
                >
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="hidden min-w-0 text-left leading-tight xl:block">
                    <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                      {user.name}
                    </p>
                    <p className="max-w-32 truncate text-xs text-slate-500">
                      {user.city} · {user.locality}
                    </p>
                  </div>
                  {user.kycStatus === "verified" ? (
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Shield className="h-4 w-4 text-amber-600" />
                  )}
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    <Link
                      href="/profile/kyc"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <UserCircle2 className="h-4 w-4 text-slate-500" />
                      Profile & KYC
                    </Link>
                    <Link
                      href="/dashboard/renter"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <CircleUserRound className="h-4 w-4 text-slate-500" />
                      My Requests
                    </Link>
                    <Link
                      href="/requested-items"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <ClipboardList className="h-4 w-4 text-slate-500" />
                      Requested Items
                    </Link>
                    <Link
                      href="/public-requests"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Megaphone className="h-4 w-4 text-slate-500" />
                      Public Requests
                    </Link>
                    <Link
                      href="/dashboard/lender"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Handshake className="h-4 w-4 text-slate-500" />
                      My Lending
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <MessageCircle className="h-4 w-4 text-slate-500" />
                      Chats
                    </Link>
                    <Link
                      href="/notifications"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Bell className="h-4 w-4 text-slate-500" />
                      Notifications
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <Link
                href="/notifications"
                title="Open notifications"
                aria-label="Open notifications"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold !text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>

              <Link
                href="/chat"
                title="Open chats"
                aria-label="Open chats"
                className="hidden h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold !text-white transition hover:bg-blue-800 sm:inline-flex"
              >
                <MessageCircle className="h-5 w-5 !text-white" />
                <span className="!text-white">Chat</span>
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold !text-white transition hover:bg-blue-800"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
