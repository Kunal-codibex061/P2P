import { Schema, model, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: [
        "request_created",
        "request_status_changed",
        "item_request_response",
        "item_request_status_changed",
        "listing_status_changed",
        "listing_deleted",
        "general",
      ],
      default: "general",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & { _id: string };

export const Notification = model("Notification", notificationSchema);
