import mongoose from "mongoose";

export async function connectDB(mongoUri: string): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
}
