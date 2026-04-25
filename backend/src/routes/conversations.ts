import { Router, type Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Conversation, ItemRequest, RentalRequest, User } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";
import type { AuthUserPayload } from "../types";

const router = Router();
const sseClients = new Map<string, Set<Response>>();

const messageSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["text", "system"]).default("text"),
});

function writeSseEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function addSseClient(userId: string, res: Response) {
  const existing = sseClients.get(userId) || new Set<Response>();
  existing.add(res);
  sseClients.set(userId, existing);

  res.on("close", () => {
    const clients = sseClients.get(userId);
    if (!clients) return;
    clients.delete(res);
    if (clients.size === 0) sseClients.delete(userId);
  });
}

function emitConversationMessage(userId: string, payload: unknown) {
  const clients = sseClients.get(userId);
  if (!clients) return;
  for (const client of clients) {
    writeSseEvent(client, "conversation-message", payload);
  }
}

async function getUserIdFromToken(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as AuthUserPayload;
  const user = await User.findById(decoded.id).select("_id").lean();
  return user ? String(user._id) : null;
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
      $or: [{ renterId: req.user?._id }, { lenderId: req.user?._id }],
    })
      .populate("listingId", "title photos rentPrice rentUnit city locality")
      .populate("requestId", "status startDate endDate quotedRent depositAmount pickupPreference")
      .populate(
        "itemRequestId",
        "type title category subcategory purpose startDate endDate budgetAmount status city locality responseCount",
      )
      .populate("renterId", "name profilePhoto")
      .populate("lenderId", "name profilePhoto")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ data: conversations });
  }),
);

router.get(
  "/events",
  asyncHandler(async (req, res) => {
    const token = String(req.query.token || "");
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    let userId: string | null = null;
    try {
      userId = await getUserIdFromToken(token);
    } catch {
      return res.status(401).json({ message: "Unauthorized request." });
    }
    if (!userId) {
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    addSseClient(userId, res);
    writeSseEvent(res, "connected", { ok: true });

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 25000);

    res.on("close", () => {
      clearInterval(heartbeat);
    });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id)
      .populate("listingId")
      .populate("requestId")
      .populate("itemRequestId")
      .populate("renterId", "name profilePhoto")
      .populate("lenderId", "name profilePhoto")
      .lean();
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    const isParticipant =
      String(conversation.renterId?._id || conversation.renterId) === req.user?._id ||
      String(conversation.lenderId?._id || conversation.lenderId) === req.user?._id;
    if (!isParticipant) {
      return res.status(403).json({ message: "You cannot access this conversation." });
    }
    return res.json({ data: conversation });
  }),
);

router.post(
  "/:id/messages",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = messageSchema.parse(req.body);
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    const isParticipant =
      String(conversation.renterId) === req.user?._id || String(conversation.lenderId) === req.user?._id;
    if (!isParticipant) {
      return res.status(403).json({ message: "You cannot send a message here." });
    }

    conversation.messages.push({
      senderId: req.user?._id,
      text: payload.text,
      type: payload.type,
      createdAt: new Date(),
    });
    await conversation.save();
    const message = conversation.messages[conversation.messages.length - 1];

    if (payload.type === "text") {
      if (conversation.requestId) {
        await RentalRequest.updateOne(
          { _id: conversation.requestId, status: "requested" },
          { $set: { status: "chatting" } },
        );
      }
      if (conversation.itemRequestId) {
        await ItemRequest.updateOne(
          { _id: conversation.itemRequestId, status: { $in: ["open", "responded"] } },
          { $set: { status: "chatting" } },
        );
      }
    }

    const eventPayload = {
      conversationId: String(conversation._id),
      message,
      updatedAt: conversation.updatedAt,
    };
    emitConversationMessage(String(conversation.renterId), eventPayload);
    emitConversationMessage(String(conversation.lenderId), eventPayload);

    return res.status(201).json({
      data: message,
    });
  }),
);

export default router;
