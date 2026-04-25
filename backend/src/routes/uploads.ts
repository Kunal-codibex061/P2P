import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
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

  const host = req.get("host");
  const baseUrl = `${req.protocol}://${host}`;
  const relativePath = `/uploads/listings/${req.file.filename}`;

  return res.status(201).json({
    data: {
      url: `${baseUrl}${relativePath}`,
      path: relativePath,
    },
  });
});

export default router;
