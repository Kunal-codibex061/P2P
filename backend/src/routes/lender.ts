import { Router } from "express";
import { ItemRequest, Listing } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

router.get(
  "/open-requests",
  requireAuth,
  asyncHandler(async (req, res) => {
    await ItemRequest.updateMany(
      {
        status: { $in: ["open", "responded", "chatting"] },
        expiresAt: { $lt: new Date() },
      },
      { $set: { status: "expired" } },
    );

    const listings = await Listing.find({
      ownerId: req.user?._id,
      moderationStatus: "approved",
    })
      .select("category city locality")
      .lean();

    const categories = Array.from(new Set(listings.map((listing) => listing.category)));
    const cities = Array.from(new Set(listings.map((listing) => listing.city)));
    const localities = Array.from(new Set(listings.map((listing) => listing.locality)));

    const query: Record<string, unknown> = {
      type: "open_request",
      status: { $in: ["open", "responded", "chatting"] },
      requesterId: { $ne: req.user?._id },
    };

    if (categories.length > 0) query.category = { $in: categories };
    if (cities.length > 0) query.city = { $in: cities };
    if (localities.length > 0) query.locality = { $in: localities };

    const requests = await ItemRequest.find(query)
      .populate("requesterId", "name profilePhoto city locality kycStatus")
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();

    return res.json({ data: requests });
  }),
);

export default router;
