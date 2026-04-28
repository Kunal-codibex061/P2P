"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import type { User } from "@/types/domain";

export default function KycProfilePage() {
  const { token, user, refreshMe } = useAuth();
  const queryClient = useQueryClient();
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhoto: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [photoUploadPending, setPhotoUploadPending] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/api/users/me", token),
    enabled: Boolean(token),
  });

  const profile = profileQuery.data?.data || user;
  const isProfileDirty = useMemo(
    () =>
      Boolean(profile) &&
      (profileDraft.name !== (profile?.name || "") ||
        profileDraft.email !== (profile?.email || "") ||
        profileDraft.phone !== (profile?.phone || "") ||
        profileDraft.profilePhoto !== (profile?.profilePhoto || "")),
    [profile, profileDraft],
  );

  useEffect(() => {
    if (!profile || isEditing) return;
    const timer = window.setTimeout(() => {
      setProfileDraft({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        profilePhoto: profile.profilePhoto || "",
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isEditing, profile]);

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      api.put<User>(
        "/api/users/me",
        {
          name: profileDraft.name.trim(),
          email: profileDraft.email.trim(),
          phone: profileDraft.phone.trim(),
          profilePhoto: profileDraft.profilePhoto.trim(),
        },
        token,
      ),
    onSuccess: async () => {
      setProfileMessage("Account details updated successfully.");
      setIsEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me"] }),
        refreshMe(),
      ]);
    },
    onError: (error: Error) => {
      setProfileMessage(error.message || "Unable to save account details.");
    },
  });

  async function uploadProfilePhoto(file: File) {
    if (!token) {
      throw new Error("Please login again to upload profile photo.");
    }

    const body = new FormData();
    body.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });

    const contentType = response.headers.get("content-type");
    const payload = contentType?.includes("application/json") ? await response.json() : null;
    if (!response.ok) {
      throw new Error(
        (payload as { message?: string } | null)?.message || "Unable to upload profile photo.",
      );
    }

    const uploadedUrl = (payload as { data?: { url?: string } })?.data?.url;
    if (!uploadedUrl) {
      throw new Error("Upload succeeded but URL was not returned.");
    }
    return uploadedUrl;
  }

  async function onPhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isEditing) return;
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    try {
      setProfileMessage(null);
      setPhotoUploadPending(true);
      const uploadedUrl = await uploadProfilePhoto(file);
      setProfileDraft((prev) => ({ ...prev, profilePhoto: uploadedUrl }));
      setProfileMessage("Profile photo uploaded. Save account info to apply.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Profile photo upload failed.");
    } finally {
      setPhotoUploadPending(false);
    }
  }

  function onSubmitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    if (!profileDraft.name.trim()) {
      setProfileMessage("Name is required.");
      return;
    }
    if (!profileDraft.email.trim()) {
      setProfileMessage("Email is required.");
      return;
    }
    if (!profileDraft.profilePhoto.trim()) {
      setProfileMessage("Profile photo URL is required.");
      return;
    }
    updateProfileMutation.mutate();
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="mt-1 text-sm text-slate-600">
            Update your profile details. Login is now managed through Firebase (Google or phone OTP).
          </p>
        </section>

        <section className="grid gap-4">
          <form
            onSubmit={onSubmitProfile}
            className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">Profile Details</p>
                <p className="text-xs text-slate-500">
                  {isEditing
                    ? "Edit fields and save your changes."
                    : "View your current account information."}
                </p>
              </div>
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!profile) return;
                    setProfileDraft({
                      name: profile.name || "",
                      email: profile.email || "",
                      phone: profile.phone || "",
                      profilePhoto: profile.profilePhoto || "",
                    });
                    setProfileMessage(null);
                    setIsEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProfileMessage(null);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src={profileDraft.profilePhoto || profile?.profilePhoto}
                  alt={profileDraft.name || profile?.name || "Profile"}
                  className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                />
                <div className="min-w-[220px] flex-1">
                  <p className="text-sm font-semibold text-slate-900">Profile Photo</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload a clear face photo so other users can recognize and trust your account.
                  </p>
                  {isEditing ? (
                    <>
                      <input
                        id="profile-photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => void onPhotoSelected(event)}
                      />
                      <label
                        htmlFor="profile-photo-upload"
                        className="mt-3 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        {photoUploadPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImagePlus className="h-4 w-4" />
                            Update Photo
                          </>
                        )}
                      </label>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Name</p>
                  <p className="text-sm font-semibold text-slate-900">{profileDraft.name || ""}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Email</p>
                  <p className="text-sm font-semibold text-slate-900">{profileDraft.email || ""}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Phone Number</p>
                  <p className="text-sm font-semibold text-slate-900">{profileDraft.phone || ""}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 sm:col-span-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {(profile?.city || "-") + (profile?.locality ? `, ${profile.locality}` : "")}
                  </p>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Full name</span>
                  <input
                    value={profileDraft.name}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-slate-600">Email</span>
                  <input
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({ ...prev, email: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-medium text-slate-600">Phone number</span>
                  <input
                    type="tel"
                    value={profileDraft.phone}
                    onChange={(event) =>
                      setProfileDraft((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    placeholder="Optional"
                  />
                </label>
              </div>
            ) : null}

            {profileMessage ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {profileMessage}
              </p>
            ) : null}

            {isEditing ? (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending || photoUploadPending || !isProfileDirty}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium !text-white transition hover:bg-slate-700 disabled:opacity-60"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Account Info"}
                </button>
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </RequireAuth>
  );
}
