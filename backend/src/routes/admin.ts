import { Router } from "express";
import { z } from "zod";
import { Listing, RentalRequest, User } from "../models";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ data: users });
  }),
);

router.get(
  "/listings",
  asyncHandler(async (_req, res) => {
    const listings = await Listing.find()
      .populate("ownerId", "name email kycStatus")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: listings });
  }),
);

router.get(
  "/requests",
  asyncHandler(async (_req, res) => {
    const requests = await RentalRequest.find()
      .populate("listingId", "title category city locality")
      .populate("renterId", "name email")
      .populate("lenderId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: requests });
  }),
);

router.put(
  "/listings/:id/moderation",
  asyncHandler(async (req, res) => {
    const schema = z.object({ moderationStatus: z.enum(["approved", "rejected", "pending"]) });
    const { moderationStatus } = schema.parse(req.body);
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { moderationStatus },
      { new: true },
    ).lean();
    res.json({ data: listing });
  }),
);

router.put(
  "/users/:id/kyc",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      kycStatus: z.enum(["verified", "pending", "failed", "not_started"]),
    });
    const { kycStatus } = schema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { kycStatus }, { new: true }).lean();
    res.json({ data: user });
  }),
);

router.get("/reports", (_req, res) => {
  res.json({
    data: [
      {
        id: "rpt_1",
        type: "listing",
        reason: "Suspected misleading condition",
        status: "open",
        createdAt: new Date().toISOString(),
      },
      {
        id: "rpt_2",
        type: "user",
        reason: "Unresponsive after payment request",
        status: "reviewing",
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

export default router;
