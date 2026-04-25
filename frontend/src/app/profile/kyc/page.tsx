"use client";

import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { TrustBadge } from "@/components/ui/trust-badge";
import { api } from "@/lib/api";
import type { User } from "@/types/domain";

export default function KycProfilePage() {
  const { token, user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/api/users/me", token),
    enabled: Boolean(token),
  });

  const profile = profileQuery.data?.data || user;

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Profile & KYC</h1>
          <p className="mt-1 text-sm text-slate-600">
            KYC will be completed through DigiLocker integration soon.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <img src={profile?.profilePhoto} alt={profile?.name} className="h-14 w-14 rounded-full object-cover" />
              <div>
                <p className="font-semibold text-slate-900">{profile?.name}</p>
                <p className="text-sm text-slate-500">{profile?.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>
                Location: {profile?.city}, {profile?.locality}
              </p>
              <p>Phone: {profile?.phone || "Demo phone"}</p>
              <p>KYC Status: {profile?.kycStatus}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile?.isPhoneVerified && <TrustBadge type="phone" />}
              {profile?.kycStatus === "verified" && <TrustBadge type="identity" />}
              {profile?.lenderRating && profile.lenderRating >= 4.5 && <TrustBadge type="trusted" />}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">DigiLocker Integration</p>
            <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">KYC workflow has been removed.</p>
              <p className="mt-1 text-sm text-slate-600">
                DigiLocker based verification will be available in a future update.
              </p>
            </div>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
