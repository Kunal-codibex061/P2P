"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import type { User } from "@/types/domain";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginAsDemoUser } = useAuth();

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  const { data, isLoading } = useQuery({
    queryKey: ["demo-users"],
    queryFn: () => api.get<User[]>("/api/auth/demo-users"),
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <section className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-rose-50 p-7">
        <h1 className="text-2xl font-bold text-slate-900">Mock Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Switch between demo users to preview renter, lender, and hybrid experiences.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))
          : (data?.data || []).map((demoUser) => (
              <button
                key={demoUser._id}
                onClick={async () => {
                  await loginAsDemoUser(demoUser._id);
                  router.push("/");
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={demoUser.profilePhoto}
                    alt={demoUser.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{demoUser.name}</p>
                    <p className="text-sm text-slate-500">{demoUser.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {demoUser.city}, {demoUser.locality}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {demoUser.kycStatus}
                  </span>
                </div>
              </button>
            ))}
      </section>
    </div>
  );
}
