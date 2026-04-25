import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models";
import { asyncHandler } from "../utils/http";
import { comparePassword } from "../utils/password";

const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const { email, password } = schema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user?.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
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
