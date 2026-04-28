"use client";

import { Filter, X } from "lucide-react";
import {
  type ListingFiltersV2,
  withCategoriesChange,
} from "@/lib/listing-filters";
import type { ListingFacets } from "@/types/domain";

interface FilterSidebarProps {
  filters: ListingFiltersV2;
  facets: ListingFacets;
  categories: string[];
  showCategoryFilter?: boolean;
  categorySpecsOrder?: string[];
  idPrefix?: string;
  onChange: (next: ListingFiltersV2) => void;
  onClear: () => void;
}

function toggleValue(values: string[], value: string, checked: boolean) {
  if (checked) return Array.from(new Set([...values, value]));
  return values.filter((item) => item !== value);
}

function toggleSpecValue(
  specs: Record<string, string[]>,
  key: string,
  value: string,
  checked: boolean,
) {
  const current = specs[key] || [];
  const nextValues = toggleValue(current, value, checked);
  if (nextValues.length === 0) {
    const { [key]: _removed, ...rest } = specs;
    void _removed;
    return rest;
  }
  return { ...specs, [key]: nextValues };
}

function sanitizeBudgetInput(value: string) {
  const digitsOnly = value.replace(/[^\d]/g, "");
  return digitsOnly.length > 0 ? digitsOnly : undefined;
}

export function FilterSidebar({
  filters,
  facets,
  categories,
  showCategoryFilter = false,
  categorySpecsOrder = [],
  idPrefix = "listing-filters",
  onChange,
  onClear,
}: FilterSidebarProps) {
  const cityOptionsId = `${idPrefix}-city-options`;
  const localityOptionsId = `${idPrefix}-locality-options`;
  const availableSpecKeys = Object.keys(facets.specifications || {});
  const orderedSpecKeys = [
    ...categorySpecsOrder.filter((key) => availableSpecKeys.includes(key)),
    ...availableSpecKeys.filter((key) => !categorySpecsOrder.includes(key)).sort(),
  ];

  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  if (showCategoryFilter) {
    filters.categories.forEach((category) => {
      activeChips.push({
        key: `category-${category}`,
        label: category,
        onRemove: () =>
          onChange(withCategoriesChange(filters, filters.categories.filter((item) => item !== category))),
      });
    });
  }
  if (filters.city) {
    activeChips.push({
      key: "city",
      label: `City: ${filters.city}`,
      onRemove: () => onChange({ ...filters, city: undefined, locality: undefined }),
    });
  }
  if (filters.locality) {
    activeChips.push({
      key: "locality",
      label: `Locality: ${filters.locality}`,
      onRemove: () => onChange({ ...filters, locality: undefined }),
    });
  }
  if (filters.minPrice) {
    activeChips.push({
      key: "minPrice",
      label: `Min: ₹${filters.minPrice}`,
      onRemove: () => onChange({ ...filters, minPrice: undefined }),
    });
  }
  if (filters.maxPrice) {
    activeChips.push({
      key: "maxPrice",
      label: `Max: ₹${filters.maxPrice}`,
      onRemove: () => onChange({ ...filters, maxPrice: undefined }),
    });
  }
  if (filters.verifiedOnly) {
    activeChips.push({
      key: "verifiedOnly",
      label: "Verified only",
      onRemove: () => onChange({ ...filters, verifiedOnly: false }),
    });
  }
  if (filters.deliveryAvailable) {
    activeChips.push({
      key: "deliveryAvailable",
      label: "Delivery",
      onRemove: () => onChange({ ...filters, deliveryAvailable: false }),
    });
  }

  filters.subcategories.forEach((subcategory) => {
    activeChips.push({
      key: `subcategory-${subcategory}`,
      label: subcategory,
      onRemove: () =>
        onChange({
          ...filters,
          subcategories: filters.subcategories.filter((item) => item !== subcategory),
        }),
    });
  });

  filters.conditions.forEach((condition) => {
    activeChips.push({
      key: `condition-${condition}`,
      label: condition,
      onRemove: () =>
        onChange({
          ...filters,
          conditions: filters.conditions.filter((item) => item !== condition),
        }),
    });
  });

  filters.rentUnits.forEach((rentUnit) => {
    activeChips.push({
      key: `rentUnit-${rentUnit}`,
      label: `Per ${rentUnit}`,
      onRemove: () =>
        onChange({
          ...filters,
          rentUnits: filters.rentUnits.filter((item) => item !== rentUnit),
        }),
    });
  });

  Object.entries(filters.specifications).forEach(([specKey, values]) => {
    values.forEach((value) => {
      activeChips.push({
        key: `${specKey}-${value}`,
        label: `${specKey}: ${value}`,
        onRemove: () =>
          onChange({
            ...filters,
            specifications: toggleSpecValue(filters.specifications, specKey, value, false),
          }),
      });
    });
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          Clear all
        </button>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
            >
              <span>{chip.label}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {showCategoryFilter && (
        <details open className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Category</summary>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
            {categories.map((category) => (
              <label key={category} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={(event) => {
                      const nextCategories = toggleValue(
                        filters.categories,
                        category,
                        event.target.checked,
                      );
                      onChange(withCategoriesChange(filters, nextCategories));
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {category}
                </span>
              </label>
            ))}
          </div>
          {categories.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">Categories are unavailable right now.</p>
          ) : null}
        </details>
      )}

      <details open className="border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Budget</summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={filters.minPrice || ""}
            onChange={(event) =>
              onChange({ ...filters, minPrice: sanitizeBudgetInput(event.target.value) })
            }
            onWheel={(event) => event.currentTarget.blur()}
            placeholder={facets.priceRange ? String(facets.priceRange.min) : "Min"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            inputMode="numeric"
            value={filters.maxPrice || ""}
            onChange={(event) =>
              onChange({ ...filters, maxPrice: sanitizeBudgetInput(event.target.value) })
            }
            onWheel={(event) => event.currentTarget.blur()}
            placeholder={facets.priceRange ? String(facets.priceRange.max) : "Max"}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      </details>

      {facets.subcategories.length > 0 && (
        <details open className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Subcategory</summary>
          <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
            {facets.subcategories.map((option) => (
              <label key={option.value} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.subcategories.includes(option.value)}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        subcategories: toggleValue(
                          filters.subcategories,
                          option.value,
                          event.target.checked,
                        ),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {option.value}
                </span>
                <span className="text-xs text-slate-500">{option.count}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      {facets.conditions.length > 0 && (
        <details open className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Condition</summary>
          <div className="mt-2 space-y-2">
            {facets.conditions.map((option) => (
              <label key={option.value} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.conditions.includes(option.value)}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        conditions: toggleValue(filters.conditions, option.value, event.target.checked),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {option.value}
                </span>
                <span className="text-xs text-slate-500">{option.count}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      <details open className="border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Location</summary>
        <div className="mt-2 space-y-2">
          <input
            value={filters.city || ""}
            onChange={(event) => {
              const nextCity = event.target.value || undefined;
              onChange({
                ...filters,
                city: nextCity,
                locality: nextCity ? filters.locality : undefined,
              });
            }}
            placeholder="City"
            list={cityOptionsId}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <datalist id={cityOptionsId}>
            {facets.cities.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
          <input
            value={filters.locality || ""}
            onChange={(event) => onChange({ ...filters, locality: event.target.value || undefined })}
            placeholder="Locality"
            list={localityOptionsId}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <datalist id={localityOptionsId}>
            {facets.localities.map((option) => (
              <option key={option.value} value={option.value} />
            ))}
          </datalist>
        </div>
      </details>

      <details open className="border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Availability</summary>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(filters.verifiedOnly)}
              onChange={(event) => onChange({ ...filters, verifiedOnly: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Verified lenders only
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(filters.deliveryAvailable)}
              onChange={(event) => onChange({ ...filters, deliveryAvailable: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Delivery available
          </label>
        </div>
      </details>

      {facets.rentUnits.length > 0 && (
        <details open className="border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">Rent Unit</summary>
          <div className="mt-2 space-y-2">
            {facets.rentUnits.map((option) => (
              <label key={option.value} className="flex items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.rentUnits.includes(option.value)}
                    onChange={(event) =>
                      onChange({
                        ...filters,
                        rentUnits: toggleValue(filters.rentUnits, option.value, event.target.checked),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Per {option.value}
                </span>
                <span className="text-xs text-slate-500">{option.count}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      {orderedSpecKeys.map((specKey) => {
        const options = facets.specifications[specKey] || [];
        if (options.length === 0) return null;
        return (
          <details key={specKey} open className="border-t border-slate-100 pt-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              {specKey}
            </summary>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
              {options.map((option) => (
                <label key={`${specKey}-${option.value}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={(filters.specifications[specKey] || []).includes(option.value)}
                      onChange={(event) =>
                        onChange({
                          ...filters,
                          specifications: toggleSpecValue(
                            filters.specifications,
                            specKey,
                            option.value,
                            event.target.checked,
                          ),
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {option.value}
                  </span>
                  <span className="text-xs text-slate-500">{option.count}</span>
                </label>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
