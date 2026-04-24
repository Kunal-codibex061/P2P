import dotenv from "dotenv";
import mongoose from "mongoose";
import { Conversation, Listing, RentalRequest, User } from "../models";
import { connectDB } from "../utils/db";
import { listingImageCatalog, listingTemplates, requestStatusSeed, seedUsers } from "./seedData";

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
    RentalRequest.deleteMany({}),
    Listing.deleteMany({}),
    User.deleteMany({}),
  ]);

  const insertedUsers = await User.insertMany(
    seedUsers.map((user) => ({
      ...user,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 60)),
      updatedAt: new Date(),
    })),
  );

  const lenderPool = insertedUsers.filter((user) => user.roleTags.includes("lender") || user.roleTags.includes("hybrid"));

  const listingsPayload = await Promise.all(listingTemplates.map(async (template, index) => {
    const owner = lenderPool[index % lenderPool.length];
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
  const requestPayload = requestStatusSeed.map((status, index) => {
    const listing = insertedListings[index % insertedListings.length];
    const renterCandidates = renters.filter((user) => String(user._id) !== String(listing.ownerId));
    const renter = renterCandidates[index % renterCandidates.length];
    const durationDays = 2 + (index % 7);
    const startDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * (index % 5));
    const endDate = new Date(startDate.getTime() + durationDays * 1000 * 60 * 60 * 24);

    return {
      listingId: listing._id,
      renterId: renter._id,
      lenderId: listing.ownerId,
      startDate,
      endDate,
      message: "Hi, I need this for a short project and will handle it carefully.",
      purpose: [
        "Weekend house party",
        "Creator shoot",
        "Temporary WFH setup",
        "Home deep-cleaning",
        "Event setup",
      ][index % 5],
      pickupPreference: index % 2 === 0 ? "pickup" : "delivery",
      status,
      quotedRent: listing.rentPrice,
      depositAmount: listing.depositAmount,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 20)),
      updatedAt: new Date(),
    };
  });

  const insertedRequests = await RentalRequest.insertMany(requestPayload);

  const conversationPayload = insertedRequests.slice(0, 12).map((request, index) => {
    const listing = insertedListings.find((l) => String(l._id) === String(request.listingId));
    const lender = insertedUsers.find((u) => String(u._id) === String(request.lenderId));
    const renter = insertedUsers.find((u) => String(u._id) === String(request.renterId));
    const messages = [
      {
        senderId: request.renterId,
        text: `Rental request created for ${listing?.title || "this listing"}.`,
        type: "system",
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        senderId: request.renterId,
        text: "Hey! Is this available for my requested dates?",
        type: "text",
        createdAt: new Date(Date.now() - 1000 * 60 * 20),
      },
      {
        senderId: request.lenderId,
        text: "Yes, available. Could you share your usage purpose and pickup preference?",
        type: "text",
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        senderId: request.renterId,
        text: "Sure, I can pick up today evening and return on time.",
        type: "text",
        createdAt: new Date(Date.now() - 1000 * 60 * 8),
      },
    ];
    if (index % 3 === 0 && lender) {
      messages.push({
        senderId: lender._id,
        text: "Great. Please keep all communication and payment updates inside the app.",
        type: "text",
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
      });
    }
    return {
      requestId: request._id,
      listingId: request.listingId,
      renterId: request.renterId,
      lenderId: request.lenderId,
      messages,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(),
      _meta: { renterName: renter?.name, lenderName: lender?.name },
    };
  });

  await Conversation.insertMany(
    conversationPayload.map(({ _meta: _unused, ...rest }) => rest),
  );

  log(
    `Seed complete: ${insertedUsers.length} users, ${insertedListings.length} listings, ${insertedRequests.length} rental requests, 12 conversations.`,
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
