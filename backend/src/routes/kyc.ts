import { Router } from "express";
import { User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

router.post(
  "/mock/start",
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await User.findByIdAndUpdate(
      req.user?._id,
      { kycStatus: "pending" },
      { new: true },
    ).lean();
    return res.json({
      message: "Identity verification powered by Digio (mock).",
      data: updated,
    });
  }),
);

router.post(
  "/mock/verify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await User.findByIdAndUpdate(
      req.user?._id,
      { kycStatus: "verified", isPhoneVerified: true },
      { new: true },
    ).lean();
    return res.json({
      message: "KYC verification completed (mock).",
      data: updated,
    });
  }),
);

export default router;
