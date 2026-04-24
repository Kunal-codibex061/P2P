import { Router } from "express";
import { z } from "zod";
import { Listing, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

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
  depositAmount: z.number().nonnegative(),
  locality: z.string().min(2),
  city: z.string().min(2),
  availabilityStatus: z.enum(["available", "unavailable", "rented"]).optional(),
  deliveryAvailable: z.boolean(),
  rules: z.array(z.string()).default([]),
  accessories: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.any()).optional().default({}),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      category,
      city,
      locality,
      minPrice,
      maxPrice,
      availability,
      verifiedOnly,
      deliveryAvailable,
      q,
      ownerId,
      moderationStatus,
    } = req.query;

    const query: Record<string, unknown> = {};

    if (category) query.category = category;
    if (city) query.city = city;
    if (locality) query.locality = locality;
    if (availability) query.availabilityStatus = availability;
    if (ownerId) query.ownerId = ownerId;
    if (moderationStatus) query.moderationStatus = moderationStatus;
    if (!moderationStatus) query.moderationStatus = "approved";
    if (verifiedOnly === "true") query.isVerifiedOwner = true;
    if (deliveryAvailable === "true") query.deliveryAvailable = true;
    if (q) {
      query.$or = [
        { title: { $regex: String(q), $options: "i" } },
        { description: { $regex: String(q), $options: "i" } },
        { subcategory: { $regex: String(q), $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      query.rentPrice = {};
      if (minPrice) {
        (query.rentPrice as Record<string, unknown>).$gte = Number(minPrice);
      }
      if (maxPrice) {
        (query.rentPrice as Record<string, unknown>).$lte = Number(maxPrice);
      }
    }

    const listings = await Listing.find(query)
      .populate("ownerId", "name profilePhoto city locality kycStatus lenderRating isPhoneVerified")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: listings });
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
    const user = await User.findById(req.user?._id).lean();
    if (!user) {
      return res.status(404).json({ message: "Owner profile not found." });
    }
    const listing = await Listing.create({
      ...payload,
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
    const payload = listingBodySchema.partial().parse(req.body);
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }
    const isOwner = String(listing.ownerId) === req.user?._id;
    const isAdmin = req.user?.roleTags.includes("admin");
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can only edit your own listing." });
    }
    Object.assign(listing, payload);
    await listing.save();
    return res.json({ data: listing });
  }),
);

export default router;
