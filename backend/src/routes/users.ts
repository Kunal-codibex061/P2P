import { Router } from "express";
import { z } from "zod";
import { User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";
import { comparePassword, hashPassword } from "../utils/password";

const router = Router();
const PUBLIC_USER_FIELDS =
  "name phone email profilePhoto city locality kycStatus lenderRating renterRating isPhoneVerified roleTags createdAt updatedAt";
const DEFAULT_DEMO_PASSWORD = "demo12345";

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  profilePhoto: z.string().url().optional(),
  city: z.string().min(2).optional(),
  locality: z.string().min(2).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from current password.",
    path: ["newPassword"],
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
    const payload = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user?._id).select("passwordHash").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    let currentPasswordHash = user.passwordHash;
    if (!currentPasswordHash) {
      currentPasswordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);
      await User.findByIdAndUpdate(req.user?._id, { passwordHash: currentPasswordHash });
    }

    const isCurrentPasswordValid = await comparePassword(payload.currentPassword, currentPasswordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const nextPasswordHash = await hashPassword(payload.newPassword);
    await User.findByIdAndUpdate(req.user?._id, {
      passwordHash: nextPasswordHash,
      passwordUpdatedAt: new Date(),
    });

    return res.json({ message: "Password updated successfully." });
  }),
);

export default router;
