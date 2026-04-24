"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import type { Category, Listing } from "@/types/domain";

const rentUnits = ["day", "week", "month"] as const;
const conditions = ["Like New", "Good", "Fair"] as const;

const categorySpecs: Record<string, string[]> = {
  Furniture: ["Material", "Dimensions"],
  "Cameras & Creator Gear": ["Brand", "Model", "Compatibility"],
  "Electronics & Gaming": ["Power", "Connectivity"],
  "Home Appliances": ["Capacity", "Power Rating"],
  "Tools & DIY": ["Tool Type", "Power Source"],
  "Events & Outdoor": ["Size", "Weather Use"],
};

export default function CreateListingPage() {
  const router = useRouter();
  const { token } = useAuth();

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/api/categories"),
  });

  const categories = useMemo(() => data?.data.categories || [], [data?.data.categories]);

  const [form, setForm] = useState({
    title: "",
    category: "",
    subcategory: "",
    description: "",
    photos: "",
    condition: "Like New",
    replacementValue: "",
    rentPrice: "",
    rentUnit: "day",
    depositAmount: "",
    city: "",
    locality: "",
    deliveryAvailable: false,
    rules: "",
    accessories: "",
    spec1: "",
    spec2: "",
  });

  const activeCategory = useMemo(
    () => categories.find((category) => category.label === form.category),
    [categories, form.category],
  );
  const activeSpecs = categorySpecs[form.category] || [];
  const [saving, setSaving] = useState(false);

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Create Listing</h1>
          <p className="mt-1 text-sm text-slate-600">
            List high-value items with clear pricing, deposit, and usage rules.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Canon 80D DSLR Camera Kit"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Category</span>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value,
                    subcategory: "",
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.label}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Subcategory</span>
              <select
                value={form.subcategory}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subcategory: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select subcategory</option>
                {(activeCategory?.subcategories || []).map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Condition</span>
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, condition: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {conditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-4 block space-y-1">
            <span className="text-xs font-medium text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Describe usage, condition, and ideal renter profile..."
            />
          </label>

          <label className="mt-4 block space-y-1">
            <span className="text-xs font-medium text-slate-600">Photo URLs (comma separated)</span>
            <textarea
              value={form.photos}
              onChange={(event) => setForm((prev) => ({ ...prev, photos: event.target.value }))}
              className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Replacement Value</span>
              <input
                type="number"
                value={form.replacementValue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, replacementValue: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Rent Price</span>
              <input
                type="number"
                value={form.rentPrice}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rentPrice: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Rent Unit</span>
              <select
                value={form.rentUnit}
                onChange={(event) => setForm((prev) => ({ ...prev, rentUnit: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {rentUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Deposit Amount</span>
              <input
                type="number"
                value={form.depositAmount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, depositAmount: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">City</span>
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Locality</span>
              <input
                value={form.locality}
                onChange={(event) => setForm((prev) => ({ ...prev, locality: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.deliveryAvailable}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, deliveryAvailable: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Delivery available
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">Rules (comma separated)</span>
              <textarea
                value={form.rules}
                onChange={(event) => setForm((prev) => ({ ...prev, rules: event.target.value }))}
                className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-600">
                Accessories (comma separated)
              </span>
              <textarea
                value={form.accessories}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, accessories: event.target.value }))
                }
                className="h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {activeSpecs.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{activeSpecs[0]}</span>
                <input
                  value={form.spec1}
                  onChange={(event) => setForm((prev) => ({ ...prev, spec1: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">{activeSpecs[1]}</span>
                <input
                  value={form.spec2}
                  onChange={(event) => setForm((prev) => ({ ...prev, spec2: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  const payload = {
                    title: form.title,
                    category: form.category,
                    subcategory: form.subcategory,
                    description: form.description,
                    photos: form.photos
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    condition: form.condition,
                    replacementValue: Number(form.replacementValue),
                    rentPrice: Number(form.rentPrice),
                    rentUnit: form.rentUnit as "day" | "week" | "month",
                    depositAmount: Number(form.depositAmount),
                    city: form.city,
                    locality: form.locality,
                    deliveryAvailable: form.deliveryAvailable,
                    rules: form.rules
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    accessories: form.accessories
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                    specifications: {
                      [activeSpecs[0] || "spec1"]: form.spec1,
                      [activeSpecs[1] || "spec2"]: form.spec2,
                    },
                  };
                  const response = await api.post<Listing>("/api/listings", payload, token);
                  router.push(`/listings/${response.data._id}`);
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Unable to create listing.");
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Listing"}
            </button>
          </div>
        </section>
      </div>
    </RequireAuth>
  );
}
