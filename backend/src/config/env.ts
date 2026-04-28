import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  MONGO_URI: z.string().min(1, "MONGO_URI is required."),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long."),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required."),
  SEED_ON_START: booleanFromEnv.default(false),
  FIREBASE_WEB_API_KEY: z.string().min(1, "FIREBASE_WEB_API_KEY is required."),
  BACKEND_PUBLIC_URL: z.string().url().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${formatted}`);
}

const frontendOrigins = parsedEnv.data.FRONTEND_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (frontendOrigins.length === 0) {
  throw new Error("Invalid environment configuration: FRONTEND_URL must include at least one origin.");
}

export const env = {
  ...parsedEnv.data,
  FRONTEND_ORIGINS: frontendOrigins,
} as const;
