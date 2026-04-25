import { Router } from "express";
import { z } from "zod";
import { Conversation, ItemRequest, RentalRequest } from "../models";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/http";

const router = Router();

const messageSchema = z.object({
  text: z.string().min(1),
  type: z.enum(["text", "system"]).default("text"),
});

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

    return res.status(201).json({
      data: conversation.messages[conversation.messages.length - 1],
    });
  }),
);

export default router;
