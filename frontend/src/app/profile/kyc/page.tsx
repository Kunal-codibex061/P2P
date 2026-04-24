"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CircleCheck, Shield } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { TrustBadge } from "@/components/ui/trust-badge";
import { api } from "@/lib/api";
import type { User } from "@/types/domain";

export default function KycProfilePage() {
  const { token, user, refreshMe } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/api/users/me", token),
    enabled: Boolean(token),
  });

  const profile = profileQuery.data?.data || user;

  const startKyc = useMutation({
    mutationFn: () => api.post("/api/kyc/mock/start", {}, token),
    onSuccess: async () => {
      await refreshMe();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const verifyKyc = useMutation({
    mutationFn: () => api.post("/api/kyc/mock/verify", {}, token),
    onSuccess: async () => {
      await refreshMe();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Profile & KYC</h1>
          <p className="mt-1 text-sm text-slate-600">
            Identity verification powered by Digio (mock flow for V1 prototype).
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
            <p className="text-sm font-semibold text-slate-900">KYC Workflow</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <Shield className="h-4 w-4 text-slate-500" />
                <span>not_started</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
                <CircleCheck className="h-4 w-4 text-amber-700" />
                <span>pending</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <BadgeCheck className="h-4 w-4 text-emerald-700" />
                <span>verified</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => startKyc.mutate()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Start KYC
              </button>
              <button
                onClick={() => verifyKyc.mutate()}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Verify KYC
              </button>
            </div>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
