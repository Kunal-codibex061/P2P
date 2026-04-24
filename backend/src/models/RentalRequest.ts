import { Schema, model, type InferSchemaType } from "mongoose";

const rentalRequestSchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    renterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    message: { type: String, required: true },
    purpose: { type: String, required: true },
    pickupPreference: { type: String, enum: ["pickup", "delivery"], default: "pickup" },
    status: {
      type: String,
      enum: [
        "requested",
        "chatting",
        "accepted",
        "rejected",
        "confirmed",
        "active",
        "return_pending",
        "completed",
        "disputed",
        "cancelled",
      ],
      default: "requested",
      index: true,
    },
    quotedRent: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

rentalRequestSchema.index({ renterId: 1, status: 1, createdAt: -1 });
rentalRequestSchema.index({ lenderId: 1, status: 1, createdAt: -1 });

export type RentalRequestDocument = InferSchemaType<typeof rentalRequestSchema> & { _id: string };

export const RentalRequest = model("RentalRequest", rentalRequestSchema);
