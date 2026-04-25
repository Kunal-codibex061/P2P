import { Router } from "express";
import { z } from "zod";
import { Listing, RentalRequest, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

const pricingOptionSchema = z.object({
  unit: z.enum(["day", "week", "month"]),
  price: z.number().positive(),
});

const listingBodySchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  subcategory: z.string().min(2),
  description: z.string().min(10),
  photos: z.array(z.string().url()).min(1),
  condition: z.string().min(2),
  replacementValue: z.number().positive(),
  rentPrice: z.number().positive(),
  rentUnit: z.enum(["day", "week", "month"]),
  pricingOptions: z.array(pricingOptionSchema).max(3).optional().default([]),
  depositAmount: z.number().nonnegative(),
  locality: z.string().min(2),
  city: z.string().min(2),
  availabilityStatus: z.enum(["available", "unavailable", "rented"]).optional(),
  deliveryAvailable: z.boolean(),
  rules: z.array(z.string()).default([]),
  accessories: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.any()).optional().default({}),
});

function normalizePricingOptions(options: Array<{ unit: "day" | "week" | "month"; price: number }>) {
  const byUnit = new Map<"day" | "week" | "month", { unit: "day" | "week" | "month"; price: number }>();
  options.forEach((option) => {
    byUnit.set(option.unit, option);
  });
  return Array.from(byUnit.values());
}

interface ListingQueryFilters {
  category?: string;
  city?: string;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: Date;
  endDate?: Date;
  availability?: string;
  verifiedOnly?: boolean;
  deliveryAvailable?: boolean;
  q?: string;
  ownerId?: string;
  moderationStatus?: string;
  subcategories: string[];
  conditions: string[];
  rentUnits: string[];
  specFilters: Record<string, string[]>;
}

function firstQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim().length > 0) return item.trim();
    }
  }
  return undefined;
}

function allQueryValues(value: unknown): string[] {
  const values: string[] = [];
  const append = (input: string) => {
    input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => values.push(item));
  };

  if (typeof value === "string") {
    append(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === "string") append(item);
    });
  }
  return Array.from(new Set(values));
}

function parseBoolean(value: unknown): boolean | undefined {
  const next = firstQueryValue(value);
  if (!next) return undefined;
  if (next === "true") return true;
  if (next === "false") return false;
  return undefined;
}

function parseNumber(value: unknown): number | undefined {
  const next = firstQueryValue(value);
  if (!next) return undefined;
  const parsed = Number(next);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(value: unknown): Date | undefined {
  const next = firstQueryValue(value);
  if (!next) return undefined;
  const parsed = new Date(next);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseListingQueryFilters(query: Record<string, unknown>): ListingQueryFilters {
  const specFilters: Record<string, string[]> = {};

  Object.entries(query).forEach(([key, value]) => {
    if (!key.startsWith("spec.")) return;
    const specKey = key.slice(5).trim();
    if (!specKey || specKey.includes("$")) return;
    const values = allQueryValues(value);
    if (values.length > 0) {
      specFilters[specKey] = values;
    }
  });

  return {
    category: firstQueryValue(query.category),
    city: firstQueryValue(query.city),
    locality: firstQueryValue(query.locality),
    minPrice: parseNumber(query.minPrice),
    maxPrice: parseNumber(query.maxPrice),
    startDate: parseDate(query.startDate),
    endDate: parseDate(query.endDate),
    availability: firstQueryValue(query.availability),
    verifiedOnly: parseBoolean(query.verifiedOnly),
    deliveryAvailable: parseBoolean(query.deliveryAvailable),
    q: firstQueryValue(query.q),
    ownerId: firstQueryValue(query.ownerId),
    moderationStatus: firstQueryValue(query.moderationStatus),
    subcategories: allQueryValues(query.subcategory),
    conditions: allQueryValues(query.condition),
    rentUnits: allQueryValues(query.rentUnit),
    specFilters,
  };
}

function buildListingsMongoQuery(filters: ListingQueryFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filters.category) query.category = filters.category;
  if (filters.city) query.city = filters.city;
  if (filters.locality) query.locality = filters.locality;
  if (filters.availability) query.availabilityStatus = filters.availability;
  if (filters.ownerId) query.ownerId = filters.ownerId;
  if (filters.moderationStatus) query.moderationStatus = filters.moderationStatus;
  if (!filters.moderationStatus) query.moderationStatus = "approved";
  if (filters.verifiedOnly === true) query.isVerifiedOwner = true;
  if (filters.deliveryAvailable === true) query.deliveryAvailable = true;
  if (filters.subcategories.length > 0) query.subcategory = { $in: filters.subcategories };
  if (filters.conditions.length > 0) query.condition = { $in: filters.conditions };
  if (filters.rentUnits.length > 0) query.rentUnit = { $in: filters.rentUnits };
  if (filters.q) {
    query.$or = [
      { title: { $regex: String(filters.q), $options: "i" } },
      { description: { $regex: String(filters.q), $options: "i" } },
      { subcategory: { $regex: String(filters.q), $options: "i" } },
    ];
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.rentPrice = {};
    if (filters.minPrice !== undefined) {
      (query.rentPrice as Record<string, unknown>).$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      (query.rentPrice as Record<string, unknown>).$lte = filters.maxPrice;
    }
  }

  Object.entries(filters.specFilters).forEach(([specKey, values]) => {
    if (values.length === 0) return;
    query[`specifications.${specKey}`] = { $in: values };
  });

  return query;
}

async function excludeUnavailableListings(
  query: Record<string, unknown>,
  filters: ListingQueryFilters,
) {
  if (!filters.startDate || !filters.endDate || filters.endDate <= filters.startDate) return;

  const unavailableListingIds = await RentalRequest.distinct("listingId", {
    status: { $in: ["accepted", "confirmed", "active", "return_pending"] },
    startDate: { $lt: filters.endDate },
    endDate: { $gt: filters.startDate },
  });

  if (unavailableListingIds.length > 0) {
    query._id = { $nin: unavailableListingIds };
  }
}

function toFacetOptions(buckets: Map<string, number>) {
  return Array.from(buckets.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function incrementBucket(buckets: Map<string, number>, rawValue: unknown) {
  if (rawValue === null || rawValue === undefined) return;
  const value = String(rawValue).trim();
  if (!value) return;
  buckets.set(value, (buckets.get(value) || 0) + 1);
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = parseListingQueryFilters(req.query as Record<string, unknown>);
    const query = buildListingsMongoQuery(filters);
    await excludeUnavailableListings(query, filters);

    const listings = await Listing.find(query)
      .populate("ownerId", "name profilePhoto city locality kycStatus lenderRating isPhoneVerified")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: listings });
  }),
);

router.get(
  "/facets",
  asyncHandler(async (req, res) => {
    const filters = parseListingQueryFilters(req.query as Record<string, unknown>);
    const query = buildListingsMongoQuery(filters);
    await excludeUnavailableListings(query, filters);

    const listings = await Listing.find(query)
      .select("subcategory condition city locality rentUnit rentPrice specifications")
      .lean();

    const subcategories = new Map<string, number>();
    const conditions = new Map<string, number>();
    const cities = new Map<string, number>();
    const localities = new Map<string, number>();
    const rentUnits = new Map<string, number>();
    const specifications = new Map<string, Map<string, number>>();

    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = Number.NEGATIVE_INFINITY;

    listings.forEach((listing) => {
      incrementBucket(subcategories, listing.subcategory);
      incrementBucket(conditions, listing.condition);
      incrementBucket(cities, listing.city);
      incrementBucket(localities, listing.locality);
      incrementBucket(rentUnits, listing.rentUnit);

      if (typeof listing.rentPrice === "number" && Number.isFinite(listing.rentPrice)) {
        minPrice = Math.min(minPrice, listing.rentPrice);
        maxPrice = Math.max(maxPrice, listing.rentPrice);
      }

      if (
        listing.specifications &&
        typeof listing.specifications === "object" &&
        !Array.isArray(listing.specifications)
      ) {
        Object.entries(listing.specifications as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (!key.trim()) return;
            const bucket = specifications.get(key) || new Map<string, number>();
            incrementBucket(bucket, value);
            specifications.set(key, bucket);
          },
        );
      }
    });

    const specificationFacets = Array.from(specifications.entries()).reduce<
      Record<string, Array<{ value: string; count: number }>>
    >((acc, [key, bucket]) => {
      const options = toFacetOptions(bucket);
      if (options.length > 0) acc[key] = options;
      return acc;
    }, {});

    res.json({
      data: {
        priceRange:
          listings.length > 0 && Number.isFinite(minPrice) && Number.isFinite(maxPrice)
            ? { min: minPrice, max: maxPrice }
            : null,
        subcategories: toFacetOptions(subcategories),
        conditions: toFacetOptions(conditions),
        cities: toFacetOptions(cities),
        localities: toFacetOptions(localities),
        rentUnits: toFacetOptions(rentUnits),
        specifications: specificationFacets,
      },
    });
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const listing = await Listing.findById(req.params.id)
      .populate("ownerId", "name profilePhoto city locality kycStatus lenderRating isPhoneVerified")
      .lean();
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    return res.json({ data: listing });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = listingBodySchema.parse(req.body);
    const normalizedPricingOptions = normalizePricingOptions(
      payload.pricingOptions.length > 0
        ? payload.pricingOptions
        : [{ unit: payload.rentUnit, price: payload.rentPrice }],
    );

    const primaryPricingOption = normalizedPricingOptions.find(
      (option) => option.unit === payload.rentUnit,
    ) || normalizedPricingOptions[0];

    const user = await User.findById(req.user?._id).lean();
    if (!user) {
      return res.status(404).json({ message: "Owner profile not found." });
    }
    const listing = await Listing.create({
      ...payload,
      rentPrice: primaryPricingOption.price,
      rentUnit: primaryPricingOption.unit,
      pricingOptions: normalizedPricingOptions,
      ownerId: req.user?._id,
      isVerifiedOwner: user.kycStatus === "verified",
      moderationStatus: "approved",
    });
    return res.status(201).json({ data: listing });
  }),
);

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = listingBodySchema.partial().parse(req.body) as z.infer<
      typeof listingBodySchema
    >;
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    const isOwner = String(listing.ownerId) === req.user?._id;
    const isAdmin = req.user?.roleTags.includes("admin");
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can only edit your own listing." });
    }

    if (payload.pricingOptions && payload.pricingOptions.length > 0) {
      const normalizedPricingOptions = normalizePricingOptions(payload.pricingOptions);
      payload.pricingOptions = normalizedPricingOptions;
      if (!payload.rentUnit) payload.rentUnit = normalizedPricingOptions[0].unit;
      if (!payload.rentPrice) payload.rentPrice = normalizedPricingOptions[0].price;
    }

    Object.assign(listing, payload);
    await listing.save();
    return res.json({ data: listing });
  }),
);

export default router;
