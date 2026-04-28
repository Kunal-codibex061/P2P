import { Router } from "express";
import { Notification } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rawLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;
    const unreadOnly = String(req.query.unreadOnly || "false") === "true";

    const query: Record<string, unknown> = {
      userId: req.user?._id,
    };
    if (unreadOnly) {
      query.readAt = null;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ data: notifications });
  }),
);

router.get(
  "/unread-count",
  requireAuth,
  asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
      userId: req.user?._id,
      readAt: null,
    });
    return res.json({ data: { unreadCount: count } });
  }),
);

router.put(
  "/read-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user?._id, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res.json({ message: "All notifications marked as read." });
  }),
);

router.put(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id, readAt: null },
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();

    if (!notification) {
      const fallback = await Notification.findOne({
        _id: req.params.id,
        userId: req.user?._id,
      }).lean();
      if (!fallback) {
        return res.status(404).json({ message: "Notification not found." });
      }
      return res.json({ data: fallback });
    }

    return res.json({ data: notification });
  }),
);

export default router;
