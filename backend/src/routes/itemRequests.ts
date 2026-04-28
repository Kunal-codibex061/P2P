import { Router } from "express";
import { z } from "zod";
import {
  Conversation,
  ItemRequest,
  Listing,
  OpenRequestResponse,
  RentalRequest,
} from "../models";
import { requireAuth } from "../middleware/auth";
import { canTransitionItemRequestStatus } from "../utils/itemRequestStatusMachine";
import { asyncHandler } from "../utils/http";
import { createNotification } from "../utils/notifications";
import type { ItemRequestStatus } from "../types";

const router = Router();

const createOpenRequestSchema = z.object({
  title: z.string().min(3),
  category: z.string().min(2),
  subcategory: z.string().optional().default(""),
  purpose: z.string().min(3),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  budgetAmount: z.number().nonnegative(),
  budgetUnit: z.enum(["day", "week", "month", "total"]).default("total"),
  depositPreference: z.enum(["none", "upto_1000", "upto_5000", "flexible"]).default("flexible"),
  pickupDeliveryPreference: z.enum(["pickup", "delivery", "either"]).default("either"),
  city: z.string().min(2),
  locality: z.string().min(2),
  radiusKm: z.union([z.literal(2), z.literal(5), z.literal(10), z.literal(999)]).default(5),
  message: z.string().min(5),
  urgency: z.enum(["today", "this_week", "flexible"]).default("flexible"),
  kycWillingness: z.boolean().default(false),
  referenceImageUrl: z.string().url().optional().or(z.literal("")),
});

const updateOpenRequestSchema = createOpenRequestSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum([
    "open",
    "responded",
    "chatting",
    "accepted",
    "confirmed",
    "active",
    "completed",
    "cancelled",
    "expired",
  ]),
});

const respondSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().min(3),
  proposedRent: z.number().nonnegative().optional().default(0),
  proposedDeposit: z.number().nonnegative().optional().default(0),
});

function mapDepositPreferenceFromAmount(amount: number) {
  if (amount <= 0) return "none";
  if (amount <= 1000) return "upto_1000";
  if (amount <= 5000) return "upto_5000";
  return "flexible";
}

async function expireOpenRequests() {
  await ItemRequest.updateMany(
    {
      status: { $in: ["open", "responded", "chatting"] },
      expiresAt: { $lt: new Date() },
    },
    { $set: { status: "expired" } },
  );
}

router.get(
  "/my",
  requireAuth,
  asyncHandler(async (req, res) => {
    await expireOpenRequests();

    const [openRequests, listingRequests, listingConversations, openConversations] = await Promise.all([
      ItemRequest.find({ requesterId: req.user?._id })
        .populate("listingId")
        .populate("requesterId", "name profilePhoto city locality kycStatus")
        .populate("lenderId", "name profilePhoto city locality kycStatus")
        .sort({ createdAt: -1 })
        .lean(),
      RentalRequest.find({ renterId: req.user?._id })
        .populate("listingId")
        .populate("renterId", "name profilePhoto city locality kycStatus")
        .populate("lenderId", "name profilePhoto city locality kycStatus")
        .sort({ createdAt: -1 })
        .lean(),
      Conversation.find({ renterId: req.user?._id, requestId: { $ne: null } })
        .select("_id requestId updatedAt")
        .lean(),
      Conversation.find({ renterId: req.user?._id, itemRequestId: { $ne: null } })
        .select("_id itemRequestId updatedAt")
        .lean(),
    ]);

    const listingConversationMap = new Map(
      listingConversations.map((item) => [String(item.requestId), String(item._id)]),
    );
    const openConversationCountMap = openConversations.reduce<Map<string, number>>((acc, item) => {
      const key = String(item.itemRequestId);
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map<string, number>());

    const normalizedOpenRequests = openRequests.map((request) => ({
      ...request,
      requesterId: request.requesterId,
      pickupPreference: request.pickupDeliveryPreference,
      conversationCount: openConversationCountMap.get(String(request._id)) || 0,
      primaryConversationId:
        openConversations.find((conversation) => String(conversation.itemRequestId) === String(request._id))
          ?._id || null,
    }));

    const normalizedListingRequests = listingRequests.map((request) => {
      const listing = request.listingId as { title?: string; category?: string; subcategory?: string; city?: string; locality?: string };
      return {
        _id: `listing-${request._id}`,
        sourceRequestId: request._id,
        requesterId: request.renterId,
        lenderId: request.lenderId,
        listingId: request.listingId,
        type: "listing_request",
        title: listing?.title || "Listing request",
        category: listing?.category || "General",
        subcategory: listing?.subcategory || "",
        purpose: request.purpose,
        startDate: request.startDate,
        endDate: request.endDate,
        budgetAmount: request.quotedRent,
        budgetUnit: "total",
        depositPreference: mapDepositPreferenceFromAmount(request.depositAmount),
        pickupDeliveryPreference: request.pickupPreference,
        city: listing?.city || "",
        locality: listing?.locality || "",
        radiusKm: 999,
        message: request.message,
        urgency: "flexible",
        kycWillingness: false,
        referenceImageUrl: "",
        status: request.status,
        responseCount: request.status === "requested" ? 0 : 1,
        conversationCount: listingConversationMap.has(String(request._id)) ? 1 : 0,
        primaryConversationId: listingConversationMap.get(String(request._id)) || null,
        quotedRent: request.quotedRent,
        depositAmount: request.depositAmount,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        expiresAt: request.expiresAt,
      };
    });

    const data = [...normalizedOpenRequests, ...normalizedListingRequests].sort(
      (left, right) =>
        new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
    );

    return res.json({ data });
  }),
);

router.get(
  "/public",
  requireAuth,
  asyncHandler(async (req, res) => {
    await expireOpenRequests();

    const requests = await ItemRequest.find({
      type: "open_request",
      status: { $in: ["open", "responded", "chatting"] },
      requesterId: { $ne: req.user?._id },
    })
      .populate("requesterId", "name profilePhoto city locality kycStatus")
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    if (requests.length === 0) {
      return res.json({ data: [] });
    }

    const conversations = await Conversation.find({
      itemRequestId: { $in: requests.map((request) => request._id) },
      lenderId: req.user?._id,
    })
      .select("_id itemRequestId updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const conversationByRequest = new Map<string, string>();
    for (const conversation of conversations) {
      const requestId = String(conversation.itemRequestId);
      if (!conversationByRequest.has(requestId)) {
        conversationByRequest.set(requestId, String(conversation._id));
      }
    }

    const normalized = requests.map((request) => ({
      ...request,
      primaryConversationId: conversationByRequest.get(String(request._id)) || null,
    }));

    return res.json({ data: normalized });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = createOpenRequestSchema.parse(req.body);
    if (payload.endDate <= payload.startDate) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const request = await ItemRequest.create({
      requesterId: req.user?._id,
      type: "open_request",
      ...payload,
      referenceImageUrl: payload.referenceImageUrl || "",
      status: "open",
      responseCount: 0,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    });

    return res.status(201).json({ data: request });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    await expireOpenRequests();
    const itemRequest = await ItemRequest.findById(req.params.id)
      .populate("requesterId", "name profilePhoto city locality kycStatus")
      .populate("lenderId", "name profilePhoto city locality kycStatus")
      .lean();

    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }

    const [responses, conversations] = await Promise.all([
      OpenRequestResponse.find({ itemRequestId: itemRequest._id })
        .populate("lenderId", "name profilePhoto city locality kycStatus")
        .populate("listingId")
        .sort({ createdAt: -1 })
        .lean(),
      Conversation.find({ itemRequestId: itemRequest._id })
        .select("_id lenderId listingId updatedAt")
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    return res.json({
      data: {
        ...itemRequest,
        responses,
        conversations,
      },
    });
  }),
);

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = updateOpenRequestSchema.parse(req.body);
    const itemRequest = await ItemRequest.findById(req.params.id);
    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }
    if (String(itemRequest.requesterId) !== req.user?._id) {
      return res.status(403).json({ message: "Only requester can edit this item request." });
    }
    if (!["open", "responded", "chatting"].includes(itemRequest.status)) {
      return res.status(400).json({ message: "Request cannot be edited in current status." });
    }
    if (payload.startDate && payload.endDate && payload.endDate <= payload.startDate) {
      return res.status(400).json({ message: "End date must be after start date." });
    }
    Object.assign(itemRequest, payload);
    await itemRequest.save();
    return res.json({ data: itemRequest });
  }),
);

router.put(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status } = updateStatusSchema.parse(req.body);
    const itemRequest = await ItemRequest.findById(req.params.id);
    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }

    const isRequester = String(itemRequest.requesterId) === req.user?._id;
    const hasLenderResponse = await OpenRequestResponse.exists({
      itemRequestId: itemRequest._id,
      lenderId: req.user?._id,
    });

    if (!isRequester && !hasLenderResponse) {
      return res.status(403).json({ message: "Not allowed for this request." });
    }
    if (
      !canTransitionItemRequestStatus(
        itemRequest.status as ItemRequestStatus,
        status as ItemRequestStatus,
      )
    ) {
      return res.status(400).json({
        message: `Cannot move request from ${itemRequest.status} to ${status}.`,
      });
    }

    itemRequest.status = status;
    await itemRequest.save();

    if (itemRequest.lenderId) {
      const counterpartUserId = isRequester
        ? String(itemRequest.lenderId)
        : String(itemRequest.requesterId);
      await createNotification({
        userId: counterpartUserId,
        actorId: req.user?._id,
        type: "item_request_status_changed",
        title: "Request status updated",
        message: `Open request status changed to ${status.replace("_", " ")}.`,
        link: `/requested-items/${itemRequest._id}`,
        metadata: {
          itemRequestId: String(itemRequest._id),
          status,
        },
      });
    }

    return res.json({ data: itemRequest });
  }),
);

router.patch(
  "/:id/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const itemRequest = await ItemRequest.findById(req.params.id);
    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }
    if (String(itemRequest.requesterId) !== req.user?._id) {
      return res.status(403).json({ message: "Only requester can cancel this request." });
    }

    itemRequest.status = "cancelled";
    await itemRequest.save();
    return res.json({ data: itemRequest });
  }),
);

router.get(
  "/:id/matches",
  requireAuth,
  asyncHandler(async (req, res) => {
    await expireOpenRequests();
    const itemRequest = await ItemRequest.findById(req.params.id).lean();
    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }
    const cityScoped =
      itemRequest.radiusKm === 999
        ? { city: itemRequest.city }
        : { city: itemRequest.city, locality: itemRequest.locality };

    const listings = await Listing.find({
      moderationStatus: "approved",
      availabilityStatus: "available",
      category: itemRequest.category,
      ...cityScoped,
    })
      .populate("ownerId", "name profilePhoto city locality kycStatus lenderRating isPhoneVerified")
      .limit(50)
      .lean();

    const scored = listings
      .map((listing) => {
        let score = 0;
        if (listing.subcategory === itemRequest.subcategory) score += 3;
        if (listing.locality === itemRequest.locality) score += 3;
        if (itemRequest.pickupDeliveryPreference === "either") score += 1;
        if (itemRequest.pickupDeliveryPreference === "delivery" && listing.deliveryAvailable) score += 2;
        if (
          itemRequest.pickupDeliveryPreference === "pickup" &&
          !listing.deliveryAvailable
        ) {
          score += 1;
        }

        const priceDistance = Math.abs((listing.rentPrice || 0) - (itemRequest.budgetAmount || 0));
        score += Math.max(0, 5 - priceDistance / 500);
        return { listing, score };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 12)
      .map((item) => item.listing);

    return res.json({ data: scored });
  }),
);

router.post(
  "/:id/respond",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = respondSchema.parse(req.body);
    const itemRequest = await ItemRequest.findById(req.params.id);
    if (!itemRequest) {
      return res.status(404).json({ message: "Item request not found." });
    }
    if (String(itemRequest.requesterId) === req.user?._id) {
      return res.status(400).json({ message: "You cannot respond to your own request." });
    }
    if (!["open", "responded", "chatting"].includes(itemRequest.status)) {
      return res.status(400).json({ message: "This request is no longer open for response." });
    }

    const listing = await Listing.findOne({
      _id: payload.listingId,
      ownerId: req.user?._id,
    }).lean();
    if (!listing) {
      return res.status(403).json({ message: "You can only attach your own listing." });
    }

    const response = await OpenRequestResponse.create({
      itemRequestId: itemRequest._id,
      lenderId: req.user?._id,
      listingId: listing._id,
      message: payload.message,
      proposedRent: payload.proposedRent || listing.rentPrice || itemRequest.budgetAmount,
      proposedDeposit: payload.proposedDeposit || listing.depositAmount || 0,
      status: "sent",
    });

    const conversationKey = {
      itemRequestId: itemRequest._id,
      renterId: itemRequest.requesterId,
      lenderId: req.user?._id,
    };
    let conversation = await Conversation.findOne(conversationKey);
    const responseText = `Lender responded to your request with: ${listing.title}`;

    if (!conversation) {
      conversation = await Conversation.create({
        ...conversationKey,
        listingId: listing._id,
        messages: [
          {
            senderId: req.user?._id,
            text: responseText,
            type: "system",
            createdAt: new Date(),
          },
          {
            senderId: req.user?._id,
            text: payload.message,
            type: "text",
            createdAt: new Date(),
          },
        ],
      });
    } else {
      if (!conversation.listingId) {
        conversation.listingId = listing._id;
      }
      conversation.messages.push({
        senderId: req.user?._id,
        text: responseText,
        type: "system",
        createdAt: new Date(),
      });
      conversation.messages.push({
        senderId: req.user?._id,
        text: payload.message,
        type: "text",
        createdAt: new Date(),
      });
      await conversation.save();
    }

    itemRequest.responseCount = await OpenRequestResponse.countDocuments({
      itemRequestId: itemRequest._id,
    });
    itemRequest.status = "responded";
    if (conversation.messages.some((message) => message.type === "text")) {
      itemRequest.status = "chatting";
    }
    itemRequest.lenderId = response.lenderId;
    await itemRequest.save();

    await createNotification({
      userId: String(itemRequest.requesterId),
      actorId: req.user?._id,
      type: "item_request_response",
      title: "You got a new response",
      message: `A lender responded with "${listing.title}" for your request.`,
      link: `/chat/${conversation._id}`,
      metadata: {
        itemRequestId: String(itemRequest._id),
        listingId: String(listing._id),
      },
    });

    return res.status(201).json({
      data: {
        response,
        conversationId: conversation._id,
      },
    });
  }),
);

export default router;
