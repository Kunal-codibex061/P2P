import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models";
import { asyncHandler } from "../utils/http";

const router = Router();

router.get(
  "/demo-users",
  asyncHandler(async (_req, res) => {
    const users = await User.find()
      .sort({ createdAt: 1 })
      .select("name email city locality kycStatus roleTags profilePhoto")
      .lean();
    res.json({ data: users });
  }),
);

router.post(
  "/mock-login",
  asyncHandler(async (req, res) => {
    const schema = z.object({ userId: z.string().min(1) });
    const { userId } = schema.parse(req.body);
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "Demo user not found." });
    }
    const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET || "dev-secret", {
      expiresIn: "30d",
    });
    return res.json({
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          city: user.city,
          locality: user.locality,
          roleTags: user.roleTags || [],
          kycStatus: user.kycStatus,
          profilePhoto: user.profilePhoto,
        },
      },
    });
  }),
);

export default router;
