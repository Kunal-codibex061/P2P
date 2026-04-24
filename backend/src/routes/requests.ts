import { Router } from "express";
import { z } from "zod";
import { Conversation, Listing, RentalRequest } from "../models";
import { requireAuth } from "../middleware/auth";
import { canTransitionStatus } from "../utils/statusMachine";
import { asyncHandler } from "../utils/http";

const router = Router();

const createRequestSchema = z.object({
  listingId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  message: z.string().min(5),
  purpose: z.string().min(3),
  pickupPreference: z.enum(["pickup", "delivery"]),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "requested",
    "chatting",
    "accepted",
    "rejected",
    "confirmed",
    "active",
    "return_pending",
    "completed",
    "disputed",
    "cancelled",
  ]),
});

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const roleParam = String(req.query.role || "all");
    const role = ["renter", "lender", "all"].includes(roleParam) ? roleParam : "all";
    const status = req.query.status ? String(req.query.status) : null;
    const listingId = req.query.listingId ? String(req.query.listingId) : null;

    const query: Record<string, unknown> = {};
    if (role === "renter") query.renterId = req.user?._id;
    if (role === "lender") {
      const ownedListings = await Listing.find({ ownerId: req.user?._id })
        .select("_id")
        .lean();
      const ownedListingIds = ownedListings.map((listing) => listing._id);

      query.$or = [
        { lenderId: req.user?._id },
        { listingId: { $in: ownedListingIds } },
      ];
    }
    if (role === "all") {
      query.$or = [{ renterId: req.user?._id }, { lenderId: req.user?._id }];
    }
    if (status) query.status = status;
    if (listingId) {
      if (role === "lender") {
        const listing = await Listing.findOne({
          _id: listingId,
          ownerId: req.user?._id,
        })
          .select("_id")
          .lean();
        if (!listing) {
          return res.json({ data: [] });
        }
      }
      query.listingId = listingId;
    }

    const requests = await RentalRequest.find(query)
      .populate("listingId")
      .populate("renterId", "name profilePhoto city locality kycStatus")
      .populate("lenderId", "name profilePhoto city locality kycStatus")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ data: requests });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = createRequestSchema.parse(req.body);
    if (payload.endDate <= payload.startDate) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    const listing = await Listing.findById(payload.listingId).lean();
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    if (String(listing.ownerId) === req.user?._id) {
      return res.status(400).json({ message: "You cannot request your own listing." });
    }

    const existingOpenRequest = await RentalRequest.findOne({
      listingId: listing._id,
      renterId: req.user?._id,
      status: { $nin: ["rejected", "cancelled", "completed"] },
    }).lean();

    if (existingOpenRequest) {
      const existingConversation = await Conversation.findOne({
        requestId: existingOpenRequest._id,
      }).lean();
      return res.status(409).json({
        message: "Request already exists for this listing.",
        data: { requestId: existingOpenRequest._id, conversationId: existingConversation?._id },
      });
    }

    const request = await RentalRequest.create({
      listingId: listing._id,
      renterId: req.user?._id,
      lenderId: listing.ownerId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      message: payload.message,
      purpose: payload.purpose,
      pickupPreference: payload.pickupPreference,
      status: "requested",
      quotedRent: listing.rentPrice,
      depositAmount: listing.depositAmount,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
    });

    const conversation = await Conversation.create({
      requestId: request._id,
      listingId: listing._id,
      renterId: req.user?._id,
      lenderId: listing.ownerId,
      messages: [
        {
          senderId: req.user?._id,
          text: `Rental request created for ${listing.title}.`,
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

    return res.status(201).json({
      data: { request, conversationId: conversation._id },
    });
  }),
);

router.put(
  "/:id/status",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status } = updateStatusSchema.parse(req.body);
    const requestDoc = await RentalRequest.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({ message: "Rental request not found." });
    }
    const isRenter = String(requestDoc.renterId) === req.user?._id;
    const isLender = String(requestDoc.lenderId) === req.user?._id;
    if (!isRenter && !isLender) {
      return res.status(403).json({ message: "Not allowed for this request." });
    }
    if (!canTransitionStatus(requestDoc.status, status)) {
      return res.status(400).json({
        message: `Cannot move request from ${requestDoc.status} to ${status}.`,
      });
    }

    if (["accepted", "rejected"].includes(status) && !isLender) {
      return res.status(403).json({ message: "Only lender can accept or reject request." });
    }

    requestDoc.status = status;
    await requestDoc.save();

    const listing = await Listing.findById(requestDoc.listingId);
    if (listing) {
      if (status === "accepted") listing.availabilityStatus = "unavailable";
      if (status === "active") listing.availabilityStatus = "rented";
      if (["completed", "cancelled", "rejected"].includes(status)) {
        listing.availabilityStatus = "available";
      }
      await listing.save();
    }

    return res.json({ data: requestDoc });
  }),
);

export default router;
