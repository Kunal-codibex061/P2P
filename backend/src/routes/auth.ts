import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models";
import { env } from "../config/env";
import { asyncHandler } from "../utils/http";
import { verifyFirebaseIdToken } from "../utils/firebaseAuth";

const router = Router();

function createSessionToken(userId: string) {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

function buildPublicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  city: string;
  locality: string;
  roleTags?: string[];
  kycStatus: string;
  profilePhoto: string;
  phone: string;
  isPhoneVerified?: boolean;
  lenderRating?: number;
  renterRating?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    locality: user.locality,
    roleTags: user.roleTags || [],
    kycStatus: user.kycStatus,
    profilePhoto: user.profilePhoto,
    isPhoneVerified: Boolean(user.isPhoneVerified),
    lenderRating: user.lenderRating ?? 4.5,
    renterRating: user.renterRating ?? 4.5,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function pickAuthProvider(providers: string[], hasPhoneNumber: boolean) {
  if (providers.includes("google.com")) return "firebase_google";
  if (hasPhoneNumber || providers.includes("phone")) return "firebase_phone";
  return "firebase_unknown";
}

function getFallbackName(email: string | null, uid: string) {
  if (email) {
    const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    if (localPart) {
      return localPart
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }
  return `User ${uid.slice(-6).toUpperCase()}`;
}

function getFallbackProfilePhoto(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=1d4ed8&color=ffffff`;
}

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    return res.status(410).json({
      message:
        "Email/password login has been removed. Please continue with Google or phone OTP login.",
    });
  }),
);

router.post(
  "/firebase",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      idToken: z.string().min(10),
    });
    const { idToken } = schema.parse(req.body);
    const firebaseUser = await verifyFirebaseIdToken(idToken);

    let user =
      (await User.findOne({ firebaseUid: firebaseUser.uid }).lean()) ||
      (firebaseUser.email
        ? await User.findOne({ email: firebaseUser.email }).lean()
        : null) ||
      (firebaseUser.phoneNumber
        ? await User.findOne({ phone: firebaseUser.phoneNumber }).lean()
        : null);

    const displayName = firebaseUser.displayName || user?.name || getFallbackName(firebaseUser.email, firebaseUser.uid);
    const profilePhoto =
      firebaseUser.photoUrl || user?.profilePhoto || getFallbackProfilePhoto(displayName);
    const resolvedEmail =
      firebaseUser.email || user?.email || `${firebaseUser.uid.toLowerCase()}@phone-auth.local`;
    const resolvedPhone = firebaseUser.phoneNumber || user?.phone || "0000000000";
    const authProvider = pickAuthProvider(firebaseUser.providers, Boolean(firebaseUser.phoneNumber));
    const isPhoneVerified = Boolean(firebaseUser.phoneNumber || user?.isPhoneVerified);
    const city = user?.city || "Delhi";
    const locality = user?.locality || "Saket";

    if (user) {
      user = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            firebaseUid: firebaseUser.uid,
            authProvider,
            name: displayName,
            email: resolvedEmail,
            phone: resolvedPhone,
            profilePhoto,
            isPhoneVerified,
          },
        },
        { new: true },
      ).lean();
    } else {
      user = await User.create({
        firebaseUid: firebaseUser.uid,
        authProvider,
        name: displayName,
        email: resolvedEmail,
        phone: resolvedPhone,
        profilePhoto,
        city,
        locality,
        isPhoneVerified,
        roleTags: [],
      });
    }

    if (!user) {
      return res.status(500).json({ message: "Unable to start session right now." });
    }

    const token = createSessionToken(String(user._id));
    return res.json({
      data: {
        token,
        user: buildPublicUser(user),
      },
    });
  }),
);

export default router;
