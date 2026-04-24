import { Schema, model, type InferSchemaType } from "mongoose";

const listingSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, index: true },
    description: { type: String, required: true },
    photos: { type: [String], default: [] },
    condition: { type: String, required: true },
    replacementValue: { type: Number, required: true },
    rentPrice: { type: Number, required: true, index: true },
    rentUnit: { type: String, enum: ["day", "week", "month"], required: true },
    depositAmount: { type: Number, required: true },
    locality: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable", "rented"],
      default: "available",
      index: true,
    },
    deliveryAvailable: { type: Boolean, default: false },
    rules: { type: [String], default: [] },
    accessories: { type: [String], default: [] },
    isVerifiedOwner: { type: Boolean, default: false, index: true },
    moderationStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    specifications: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

listingSchema.index({ category: 1, city: 1, locality: 1 });

export type ListingDocument = InferSchemaType<typeof listingSchema> & { _id: string };

export const Listing = model("Listing", listingSchema);
