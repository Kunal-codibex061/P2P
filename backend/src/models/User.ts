import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    profilePhoto: { type: String, required: true },
    city: { type: String, required: true, index: true },
    locality: { type: String, required: true, index: true },
    kycStatus: {
      type: String,
      enum: ["not_started", "pending", "verified", "failed"],
      default: "not_started",
      index: true,
    },
    lenderRating: { type: Number, default: 4.5 },
    renterRating: { type: Number, default: 4.5 },
    isPhoneVerified: { type: Boolean, default: false },
    roleTags: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: string };

export const User = model("User", userSchema);
