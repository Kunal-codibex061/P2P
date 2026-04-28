import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models";
import type { AuthUserPayload } from "../types";

function getToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.replace("Bearer ", "").trim();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET,
    ) as AuthUserPayload;
    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }
    req.user = {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      roleTags: user.roleTags || [],
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized request." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized request." });
  }
  const isAdmin = req.user.roleTags.includes("admin");
  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }
  return next();
}
