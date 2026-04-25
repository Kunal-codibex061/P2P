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
import { listingImageCatalog, listingTemplates, requestStatusSeed, seedUsers } from "./seedData";

dotenv.config();

interface SeedOptions {
  force?: boolean;
  silent?: boolean;
}

const DEFAULT_DEMO_PASSWORD = "demo12345";

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
  const defaultPasswordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);

  if (!force && existingUsers > 0) {
    const updateResult = await User.updateMany(
      { $or: [{ passwordHash: { $exists: false } }, { passwordHash: null }] },
      { $set: { passwordHash: defaultPasswordHash } },
    );
    if (updateResult.modifiedCount > 0) {
      log(`Backfilled demo password hash for ${updateResult.modifiedCount} users.`, silent);
    }
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

  const insertedUsers = await User.insertMany(
    seedUsers.map((user) => ({
      ...user,
      passwordHash: defaultPasswordHash,
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

  const openRequestTemplates = [
    {
      title: "Need PS5 for weekend",
      category: "Electronics & Gaming",
      subcategory: "Gaming consoles",
      purpose: "Weekend gaming",
      message: "Need a PS5 for two days. I can pick up and return on time.",
      budgetAmount: 2400,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "pickup",
      urgency: "this_week",
    },
    {
      title: "Looking for office chair for 1 month",
      category: "Furniture",
      subcategory: "Office chairs",
      purpose: "WFH setup",
      message: "Need an ergonomic chair for one month for work-from-home setup.",
      budgetAmount: 1400,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "delivery",
      urgency: "flexible",
    },
    {
      title: "Need projector and speaker for birthday party",
      category: "Events & Outdoor",
      subcategory: "Audio/video event setups",
      purpose: "Birthday party",
      message: "Projector + speaker needed for one evening home birthday event.",
      budgetAmount: 3000,
      depositPreference: "flexible",
      pickupDeliveryPreference: "either",
      urgency: "this_week",
    },
    {
      title: "Need DSLR camera for college event",
      category: "Cameras & Creator Gear",
      subcategory: "DSLR/mirrorless cameras",
      purpose: "College event",
      message: "Need DSLR for college cultural event coverage.",
      budgetAmount: 2200,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "pickup",
      urgency: "today",
    },
    {
      title: "Need drill machine for home setup",
      category: "Tools & DIY",
      subcategory: "Power tools",
      purpose: "Moving-in need",
      message: "Looking for drill machine for a day for shelf setup.",
      budgetAmount: 600,
      depositPreference: "upto_1000",
      pickupDeliveryPreference: "either",
      urgency: "flexible",
    },
    {
      title: "Need camping tent for weekend trip",
      category: "Events & Outdoor",
      subcategory: "Camping tents",
      purpose: "Weekend trip",
      message: "Need a 3-4 person camping tent for this weekend.",
      budgetAmount: 1600,
      depositPreference: "upto_5000",
      pickupDeliveryPreference: "delivery",
      urgency: "this_week",
    },
  ];

  const openRequestsPayload = openRequestTemplates.map((template, index) => {
    const requester = renters[index % renters.length];
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
      status: index === 3 ? "accepted" : index === 4 ? "cancelled" : "open",
      responseCount: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (index + 2)),
      updatedAt: new Date(),
    };
  });

  const insertedOpenRequests = await ItemRequest.insertMany(openRequestsPayload);

  const ps5Listing = insertedListings.find((listing) =>
    listing.title.toLowerCase().includes("ps5"),
  );
  const projectorListing = insertedListings.find((listing) =>
    listing.title.toLowerCase().includes("projector"),
  );

  const lenderOne = lenderPool[0];
  const lenderTwo = lenderPool[1] || lenderPool[0];

  const seededResponses = await OpenRequestResponse.insertMany([
    {
      itemRequestId: insertedOpenRequests[0]._id,
      lenderId: lenderOne._id,
      listingId: ps5Listing?._id || null,
      message: "I have a PS5 in excellent condition available for the requested dates.",
      proposedRent: ps5Listing?.rentPrice || 2500,
      proposedDeposit: ps5Listing?.depositAmount || 4000,
      status: "chatting",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      updatedAt: new Date(),
    },
    {
      itemRequestId: insertedOpenRequests[2]._id,
      lenderId: lenderTwo._id,
      listingId: projectorListing?._id || null,
      message: "I can offer a projector + speaker combo. Delivery can be arranged.",
      proposedRent: projectorListing?.rentPrice || 2800,
      proposedDeposit: projectorListing?.depositAmount || 3500,
      status: "sent",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      updatedAt: new Date(),
    },
  ]);

  const openRequestResponseCount = new Map<string, number>();
  seededResponses.forEach((response) => {
    const key = String(response.itemRequestId);
    openRequestResponseCount.set(key, (openRequestResponseCount.get(key) || 0) + 1);
  });

  for (const request of insertedOpenRequests) {
    const key = String(request._id);
    const count = openRequestResponseCount.get(key) || 0;
    if (count > 0) {
      request.responseCount = count;
      request.status = request.status === "accepted" ? "accepted" : "responded";
      await request.save();
    }
  }

  await Conversation.insertMany([
    {
      itemRequestId: insertedOpenRequests[0]._id,
      listingId: ps5Listing?._id || null,
      renterId: insertedOpenRequests[0].requesterId,
      lenderId: lenderOne._id,
      messages: [
        {
          senderId: lenderOne._id,
          text: `Lender responded to your request with: ${ps5Listing?.title || "Gaming Console Listing"}`,
          type: "system",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
        {
          senderId: lenderOne._id,
          text: "I can share this for the weekend. Let me know pickup time.",
          type: "text",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      updatedAt: new Date(),
    },
    {
      itemRequestId: insertedOpenRequests[2]._id,
      listingId: projectorListing?._id || null,
      renterId: insertedOpenRequests[2].requesterId,
      lenderId: lenderTwo._id,
      messages: [
        {
          senderId: lenderTwo._id,
          text: `Lender responded to your request with: ${projectorListing?.title || "Projector Listing"}`,
          type: "system",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
        },
        {
          senderId: lenderTwo._id,
          text: "I have a setup that should fit your event. Happy to coordinate.",
          type: "text",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
        },
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      updatedAt: new Date(),
    },
  ]);

  log(
    `Seed complete: ${insertedUsers.length} users, ${insertedListings.length} listings, ${insertedRequests.length} rental requests, ${insertedOpenRequests.length} open requests, and conversations seeded.`,
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
