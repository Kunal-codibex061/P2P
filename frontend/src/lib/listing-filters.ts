export interface ListingFiltersV2 {
  category?: string;
  q?: string;
  city?: string;
  locality?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  verifiedOnly?: boolean;
  deliveryAvailable?: boolean;
  subcategories: string[];
  conditions: string[];
  rentUnits: string[];
  specifications: Record<string, string[]>;
}

function normalizeSingle(value: string | null): string | undefined {
  if (value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseRepeated(params: URLSearchParams, key: string): string[] {
  const direct = params.getAll(key);
  if (direct.length > 0) return dedupe(direct);
  const single = params.get(key);
  if (!single) return [];
  return dedupe(single.split(","));
}

export function createDefaultListingFilters(overrides?: Partial<ListingFiltersV2>): ListingFiltersV2 {
  return {
    category: overrides?.category,
    q: overrides?.q,
    city: overrides?.city,
    locality: overrides?.locality,
    minPrice: overrides?.minPrice,
    maxPrice: overrides?.maxPrice,
    startDate: overrides?.startDate,
    endDate: overrides?.endDate,
    verifiedOnly: overrides?.verifiedOnly,
    deliveryAvailable: overrides?.deliveryAvailable,
    subcategories: overrides?.subcategories || [],
    conditions: overrides?.conditions || [],
    rentUnits: overrides?.rentUnits || [],
    specifications: overrides?.specifications || {},
  };
}

export function parseListingFiltersFromParams(
  params: URLSearchParams,
  options?: { fixedCategory?: string },
): ListingFiltersV2 {
  const specifications: Record<string, string[]> = {};
  params.forEach((value, key) => {
    if (!key.startsWith("spec.")) return;
    const specKey = key.slice(5).trim();
    if (!specKey) return;
    specifications[specKey] = dedupe([...(specifications[specKey] || []), value]);
  });

  return createDefaultListingFilters({
    category: options?.fixedCategory || normalizeSingle(params.get("category")),
    q: normalizeSingle(params.get("q")),
    city: normalizeSingle(params.get("city")),
    locality: normalizeSingle(params.get("locality")),
    minPrice: normalizeSingle(params.get("minPrice")),
    maxPrice: normalizeSingle(params.get("maxPrice")),
    startDate: normalizeSingle(params.get("startDate")),
    endDate: normalizeSingle(params.get("endDate")),
    verifiedOnly: params.get("verifiedOnly") === "true",
    deliveryAvailable: params.get("deliveryAvailable") === "true",
    subcategories: parseRepeated(params, "subcategory"),
    conditions: parseRepeated(params, "condition"),
    rentUnits: parseRepeated(params, "rentUnit"),
    specifications,
  });
}

export function serializeListingFiltersToParams(
  filters: ListingFiltersV2,
  options?: { includeCategory?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();
  const includeCategory = options?.includeCategory ?? true;

  if (includeCategory && filters.category) params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.locality) params.set("locality", filters.locality);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.verifiedOnly) params.set("verifiedOnly", "true");
  if (filters.deliveryAvailable) params.set("deliveryAvailable", "true");
  filters.subcategories.forEach((subcategory) => params.append("subcategory", subcategory));
  filters.conditions.forEach((condition) => params.append("condition", condition));
  filters.rentUnits.forEach((rentUnit) => params.append("rentUnit", rentUnit));

  Object.entries(filters.specifications).forEach(([specKey, values]) => {
    dedupe(values).forEach((value) => params.append(`spec.${specKey}`, value));
  });

  return params;
}

export function toRouteQueryString(
  filters: ListingFiltersV2,
  options?: { includeCategory?: boolean },
): string {
  return serializeListingFiltersToParams(filters, options).toString();
}

export function toListingsApiQueryString(
  filters: ListingFiltersV2,
  options?: { fixedCategory?: string },
): string {
  const params = serializeListingFiltersToParams(filters, {
    includeCategory: !options?.fixedCategory,
  });
  if (options?.fixedCategory) {
    params.set("category", options.fixedCategory);
  }
  if (!params.get("availability") && !(filters.startDate && filters.endDate)) {
    params.set("availability", "available");
  }
  return params.toString();
}

export function withCategoryChange(
  filters: ListingFiltersV2,
  category?: string,
): ListingFiltersV2 {
  return {
    ...filters,
    category,
    subcategories: [],
    specifications: {},
  };
}

export function clearListingFilters(lockedCategory?: string): ListingFiltersV2 {
  return createDefaultListingFilters({
    category: lockedCategory,
  });
}

export function countActiveFilters(
  filters: ListingFiltersV2,
  options?: { excludeCategory?: boolean },
): number {
  let count = 0;
  if (!options?.excludeCategory && filters.category) count += 1;
  if (filters.q) count += 1;
  if (filters.city) count += 1;
  if (filters.locality) count += 1;
  if (filters.minPrice) count += 1;
  if (filters.maxPrice) count += 1;
  if (filters.startDate && filters.endDate) count += 1;
  if (filters.verifiedOnly) count += 1;
  if (filters.deliveryAvailable) count += 1;
  count += filters.subcategories.length;
  count += filters.conditions.length;
  count += filters.rentUnits.length;
  Object.values(filters.specifications).forEach((values) => {
    count += values.length;
  });
  return count;
}
