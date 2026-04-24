"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleUserRound,
  Handshake,
  MessageCircle,
  Shield,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProfileOpen(false);
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

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm">RENTeasy</p>
            <p className="text-xs font-normal text-slate-500">Trusted local rentals</p>
          </div>
        </Link>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-2 py-1.5 transition",
                  profileOpen ? "border-orange-200 bg-orange-50" : "hover:bg-slate-100",
                )}
              >
                <img src={user.profilePhoto} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                <div className="hidden min-w-0 text-left leading-tight sm:block">
                  <p className="max-w-32 truncate text-sm font-semibold text-slate-800">{user.name}</p>
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
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>

    </header>
  );
}
