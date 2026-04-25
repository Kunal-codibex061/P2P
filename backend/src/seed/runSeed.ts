import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  Conversation,
  ItemRequest,
  Listing,
  OpenRequestResponse,
  RentalRequest,
  User,
} from "../models";
import { connectDB } from "../utils/db";
import { hashPassword } from "../utils/password";
import { listingImageCatalog, listingTemplates, seedUsers } from "./seedData";

dotenv.config();

interface SeedOptions {
  force?: boolean;
  silent?: boolean;
}

const UNSPLASH_SEARCH_API = "https://unsplash.com/napi/search/photos";
const UNSPLASH_TRANSFORM = "auto=format&fit=crop&w=1400&q=80";

interface UnsplashPhotoResult {
  slug?: string;
  alt_description?: string | null;
  description?: string | null;
  urls?: {
    raw?: string;
  };
  tags?: Array<{ title?: string }>;
}

function log(message: string, silent = false) {
  if (!silent) console.log(message);
}

function normalizeListingImage(url: string): string {
  if (
    (url.includes("images.unsplash.com") || url.includes("plus.unsplash.com")) &&
    (url.includes("/photo-") || url.includes("/premium_photo-"))
  ) {
    return `${url.split("?")[0]}?${UNSPLASH_TRANSFORM}`;
  }
  return url;
}

const FALLBACK_LISTING_PHOTOS = [
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=1400&q=80",
];

const unsplashSearchCache = new Map<string, string[]>();

function tokenize(value: string): string[] {
  const stopWords = new Set([
    "with",
    "for",
    "and",
    "the",
    "kit",
    "set",
    "inch",
    "people",
    "monthly",
    "rent",
    "monthly",
    "professional",
  ]);

  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function scoreUnsplashResult(result: UnsplashPhotoResult, queryTokens: string[]): number {
  const haystack = [
    result.slug || "",
    result.alt_description || "",
    result.description || "",
    ...(result.tags || []).map((tag) => tag.title || ""),
  ]
    .join(" ")
    .toLowerCase();

  const banned = ["abstract", "landscape", "mountain", "forest", "sunset", "ocean", "beach"];
  const bannedPenalty = banned.some((word) => haystack.includes(word)) ? -4 : 0;

  const tokenScore = queryTokens.reduce(
    (score, token) => score + (haystack.includes(token) ? 2 : 0),
    0,
  );

  return tokenScore + bannedPenalty;
}

async function fetchUnsplashPhotos(query: string): Promise<string[]> {
  if (unsplashSearchCache.has(query)) {
    return unsplashSearchCache.get(query)!;
  }

  try {
    const url = `${UNSPLASH_SEARCH_API}?query=${encodeURIComponent(query)}&per_page=18&page=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "rentora-seed/1.0",
      },
    });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { results?: UnsplashPhotoResult[] };
    const results = payload.results || [];
    const queryTokens = tokenize(query);

    const ranked = results
      .map((result) => {
        const raw = result.urls?.raw;
        if (!raw) return null;
        return {
          score: scoreUnsplashResult(result, queryTokens),
          url: normalizeListingImage(raw),
        };
      })
      .filter((item): item is { score: number; url: string } => Boolean(item))
      .sort((a, b) => b.score - a.score);

    const seen = new Set<string>();
    const selected: string[] = [];
    for (const item of ranked) {
      const key = item.url.split("?")[0];
      if (seen.has(key)) continue;
      seen.add(key);
      selected.push(item.url);
      if (selected.length === 2) break;
    }

    unsplashSearchCache.set(query, selected);
    return selected;
  } catch {
    return [];
  }
}

export async function seedDatabase(options: SeedOptions = {}) {
  const { force = true, silent = false } = options;
  const existingUsers = await User.countDocuments();

  if (!force && existingUsers > 0) {
    log("Seed skipped: data already exists.", silent);
    return;
  }

  await Promise.all([
    Conversation.deleteMany({}),
    OpenRequestResponse.deleteMany({}),
    ItemRequest.deleteMany({}),
    RentalRequest.deleteMany({}),
    Listing.deleteMany({}),
    User.deleteMany({}),
  ]);

  try {
    await Conversation.collection.dropIndex("requestId_1");
  } catch {
    // ignore if index is absent
  }
  await Conversation.collection.createIndex({ requestId: 1 }, { unique: true, sparse: true });

  const usersPayload = await Promise.all(
    seedUsers.map(async ({ password, ...user }) => ({
      ...user,
      passwordHash: await hashPassword(password),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 60)),
      updatedAt: new Date(),
    })),
  );

  const insertedUsers = await User.insertMany(usersPayload);

  const lenderPool = insertedUsers.filter((user) => user.roleTags.includes("lender") || user.roleTags.includes("hybrid"));

  const listingsPayload = await Promise.all(listingTemplates.map(async (template, index) => {
    const owner = lenderPool[Math.floor(index / 2) % lenderPool.length];
    const curated = listingImageCatalog[template.title];
    const imageQuery = template.imageQuery || curated?.imageQuery || template.title;
    const searchedPhotos = (await fetchUnsplashPhotos(imageQuery)).map(normalizeListingImage);
    const curatedPhotos =
      (template.photos && template.photos.length > 0
        ? template.photos
        : curated?.photos || []).map(normalizeListingImage);
    const selectedPhotos =
      (template.photos && template.photos.length > 0
        ? curatedPhotos
        : searchedPhotos.length > 0
          ? searchedPhotos
          : curatedPhotos.length > 0
            ? curatedPhotos
            : FALLBACK_LISTING_PHOTOS);

    return {
      ...template,
      ownerId: owner._id,
      locality: owner.locality,
      city: owner.city,
      photos: selectedPhotos,
      moderationStatus: "approved",
      isVerifiedOwner: owner.kycStatus === "verified",
      availabilityStatus: "available",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 40)),
      updatedAt: new Date(),
    };
  }));

  const insertedListings = await Listing.insertMany(listingsPayload);

  const renters = insertedUsers.filter((user) => user.roleTags.includes("renter") || user.roleTags.includes("hybrid"));
  const openRequestTemplates = [
    {
      title: "Need sewing machine for weekend alterations",
      category: "Home Appliances",
      subcategory: "Sewing machines",
      purpose: "Weekend tailoring",
      message: "Need a sewing machine for two days to finish a few home alteration tasks.",
      budgetAmount: 900,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "pickup",
      urgency: "this_week",
    },
    {
      title: "Need baby stroller for airport visit",
      category: "Events & Outdoor",
      subcategory: "Travel accessories",
      purpose: "Family travel",
      message: "Looking for a clean foldable stroller for a short airport and city visit.",
      budgetAmount: 1200,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "delivery",
      urgency: "flexible",
    },
    {
      title: "Need treadmill for trial month",
      category: "Sports & Fitness",
      subcategory: "Treadmills",
      purpose: "Fitness trial",
      message: "Want to rent a compact treadmill for a month before buying one.",
      budgetAmount: 3500,
      depositPreference: "flexible",
      pickupDeliveryPreference: "delivery",
      urgency: "flexible",
    },
    {
      title: "Need drone for campus shoot",
      category: "Cameras & Creator Gear",
      subcategory: "Drones",
      purpose: "Campus video",
      message: "Need a small camera drone for one morning of aerial shots.",
      budgetAmount: 2500,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "pickup",
      urgency: "this_week",
    },
    {
      title: "Need ice cream maker for house party",
      category: "Home Appliances",
      subcategory: "Kitchen appliances",
      purpose: "House party dessert",
      message: "Looking for an ice cream maker for a weekend party experiment.",
      budgetAmount: 1000,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "either",
      urgency: "this_week",
    },
    {
      title: "Need podcast mixer for recording",
      category: "Electronics & Gaming",
      subcategory: "Audio mixers",
      purpose: "Podcast recording",
      message: "Need a compact audio mixer for a two-person podcast recording session.",
      budgetAmount: 1600,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "pickup",
      urgency: "today",
    },
    {
      title: "Need car roof box for road trip",
      category: "Events & Outdoor",
      subcategory: "Travel accessories",
      purpose: "Road trip storage",
      message: "Need a roof cargo box for a short outstation trip with family luggage.",
      budgetAmount: 2800,
      depositPreference: "flexible",
      pickupDeliveryPreference: "either",
      urgency: "this_week",
    },
    {
      title: "Need folding massage table",
      category: "Furniture",
      subcategory: "Wellness furniture",
      purpose: "Home physiotherapy",
      message: "Looking for a foldable massage table for a few home physio sessions.",
      budgetAmount: 1400,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "delivery",
      urgency: "flexible",
    },
    {
      title: "Need clothes drying stand",
      category: "Home Appliances",
      subcategory: "Laundry accessories",
      purpose: "Temporary home setup",
      message: "Need a sturdy drying stand for two weeks after moving into a new flat.",
      budgetAmount: 600,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "pickup",
      urgency: "flexible",
    },
    {
      title: "Need barcode scanner for inventory day",
      category: "Electronics & Gaming",
      subcategory: "Office electronics",
      purpose: "Inventory check",
      message: "Need a USB barcode scanner for a one-day stock counting activity.",
      budgetAmount: 800,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "either",
      urgency: "today",
    },
    {
      title: "Need induction cooktop for guest stay",
      category: "Home Appliances",
      subcategory: "Kitchen appliances",
      purpose: "Guest kitchen setup",
      message: "Looking for an induction cooktop for a week while hosting guests.",
      budgetAmount: 900,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "delivery",
      urgency: "this_week",
    },
    {
      title: "Need portable whiteboard for workshop",
      category: "Furniture",
      subcategory: "Office accessories",
      purpose: "Training workshop",
      message: "Need a rolling whiteboard for a half-day internal workshop.",
      budgetAmount: 1100,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "either",
      urgency: "this_week",
    },
  ];

  const openRequestsPayload = openRequestTemplates.map((template, index) => {
    const requester = renters[Math.floor(index / 2) % renters.length];
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * (index + 1));
    const endDate = new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * (2 + (index % 4)));
    return {
      requesterId: requester._id,
      type: "open_request",
      title: template.title,
      category: template.category,
      subcategory: template.subcategory,
      purpose: template.purpose,
      startDate,
      endDate,
      budgetAmount: template.budgetAmount,
      budgetUnit: "total",
      depositPreference: template.depositPreference,
      pickupDeliveryPreference: template.pickupDeliveryPreference,
      city: requester.city,
      locality: requester.locality,
      radiusKm: index % 4 === 0 ? 10 : 5,
      message: template.message,
      urgency: template.urgency,
      kycWillingness: requester.kycStatus === "verified",
      referenceImageUrl: "",
      status: "open",
      responseCount: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (index + 2)),
      updatedAt: new Date(),
    };
  });

  const insertedOpenRequests = await ItemRequest.insertMany(openRequestsPayload);

  log(
    `Seed complete: ${insertedUsers.length} users, ${insertedListings.length} listings, 0 rental requests, ${insertedOpenRequests.length} open requests.`,
    silent,
  );
}

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/rentals_v1";
  await connectDB(mongoUri);
  await seedDatabase({ force: true, silent: false });
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
