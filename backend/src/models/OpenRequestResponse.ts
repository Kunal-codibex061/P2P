import { Schema, model, type InferSchemaType } from "mongoose";

const openRequestResponseSchema = new Schema(
  {
    itemRequestId: { type: Schema.Types.ObjectId, ref: "ItemRequest", required: true, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", default: null, index: true },
    message: { type: String, required: true },
    proposedRent: { type: Number, default: 0 },
    proposedDeposit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["sent", "accepted", "rejected", "chatting"],
      default: "sent",
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

openRequestResponseSchema.index({ itemRequestId: 1, lenderId: 1, createdAt: -1 });

export type OpenRequestResponseDocument = InferSchemaType<typeof openRequestResponseSchema> & {
  _id: string;
};

export const OpenRequestResponse = model("OpenRequestResponse", openRequestResponseSchema);
