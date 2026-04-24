import { Router } from "express";
import { z } from "zod";
import { User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  profilePhoto: z.string().url().optional(),
  city: z.string().min(2).optional(),
  locality: z.string().min(2).optional(),
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id).lean();
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
    const updated = await User.findByIdAndUpdate(req.user?._id, payload, { new: true }).lean();
    return res.json({ data: updated });
  }),
);

export default router;
