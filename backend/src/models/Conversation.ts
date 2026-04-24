import { Schema, model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: "RentalRequest", required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
    renterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lenderId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

conversationSchema.index({ renterId: 1, lenderId: 1, updatedAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema> & {
  _id: string;
};

export const Conversation = model("Conversation", conversationSchema);
