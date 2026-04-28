import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "listings");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    callback(null, `listing-${unique}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed."));
      return;
    }
    callback(null, true);
  },
});

router.post("/images", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required." });
  }

  const relativePath = `/uploads/listings/${req.file.filename}`;
  const host = req.get("host");
  const forwardedProto = req
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol = forwardedProto || req.protocol;
  const requestBaseUrl = host ? `${protocol}://${host}` : "";
  const baseUrl = env.BACKEND_PUBLIC_URL || requestBaseUrl;
  const resolvedUrl = `${baseUrl}${relativePath}`;

  return res.status(201).json({
    data: {
      url: resolvedUrl,
      path: relativePath,
    },
  });
});

export default router;
