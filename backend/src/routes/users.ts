import { Router } from "express";
import { z } from "zod";
import { User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();
const PUBLIC_USER_FIELDS =
  "name phone email profilePhoto city locality kycStatus lenderRating renterRating isPhoneVerified roleTags createdAt updatedAt";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  profilePhoto: z.string().url().optional(),
  city: z.string().min(2).optional(),
  locality: z.string().min(2).optional(),
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).select(PUBLIC_USER_FIELDS).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ data: user });
  }),
);

router.put(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = updateUserSchema.parse(req.body);
    if (payload.email) {
      const normalizedEmail = payload.email.toLowerCase().trim();
      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user?._id },
      })
        .select("_id")
        .lean();
      if (existing) {
        return res.status(409).json({ message: "Email is already in use." });
      }
      payload.email = normalizedEmail;
    }
    const updated = await User.findByIdAndUpdate(req.user?._id, payload, { new: true })
      .select(PUBLIC_USER_FIELDS)
      .lean();
    return res.json({ data: updated });
  }),
);

router.put(
  "/me/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.status(410).json({
      message:
        "Password login is disabled. Update your login method in Firebase Auth (Google or phone OTP).",
    });
  }),
);

export default router;
