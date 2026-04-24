import { Schema, model, type InferSchemaType } from "mongoose";

const itemRequestSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["listing_request", "open_request"],
      required: true,
      default: "open_request",
      index: true,
    },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", default: null, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, default: "", index: true },
    purpose: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budgetAmount: { type: Number, required: true, min: 0 },
    budgetUnit: { type: String, enum: ["day", "week", "month", "total"], default: "total" },
    depositPreference: {
      type: String,
      enum: ["none", "upto_1000", "upto_5000", "flexible"],
      default: "flexible",
    },
    pickupDeliveryPreference: {
      type: String,
      enum: ["pickup", "delivery", "either"],
      default: "either",
    },
    city: { type: String, required: true, index: true },
    locality: { type: String, required: true, index: true },
    radiusKm: { type: Number, enum: [2, 5, 10, 999], default: 5 },
    message: { type: String, required: true },
    urgency: { type: String, enum: ["today", "this_week", "flexible"], default: "flexible" },
    kycWillingness: { type: Boolean, default: false },
    referenceImageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "open",
        "responded",
        "chatting",
        "accepted",
        "confirmed",
        "active",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "open",
      index: true,
    },
    responseCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

itemRequestSchema.index({ requesterId: 1, createdAt: -1 });
itemRequestSchema.index({ category: 1, city: 1, status: 1 });

export type ItemRequestDocument = InferSchemaType<typeof itemRequestSchema> & { _id: string };

export const ItemRequest = model("ItemRequest", itemRequestSchema);
