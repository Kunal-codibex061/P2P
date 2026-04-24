import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import authRoutes from "./routes/auth";
import categoriesRoutes from "./routes/categories";
import listingsRoutes from "./routes/listings";
import requestsRoutes from "./routes/requests";
import itemRequestsRoutes from "./routes/itemRequests";
import conversationRoutes from "./routes/conversations";
import userRoutes from "./routes/users";
import kycRoutes from "./routes/kyc";
import adminRoutes from "./routes/admin";
import lenderRoutes from "./routes/lender";
import uploadRoutes from "./routes/uploads";
import { errorHandler, notFound } from "./middleware/errorHandler";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL?.split(",") || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/item-requests", itemRequestsRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/lender", lenderRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
