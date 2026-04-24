import dotenv from "dotenv";
import app from "./app";
import { seedDatabase } from "./seed/runSeed";
import { connectDB } from "./utils/db";

dotenv.config();

const PORT = Number(process.env.PORT || 8080);
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/rentals_v1";
const SEED_ON_START = process.env.SEED_ON_START === "true";

async function bootstrap() {
  await connectDB(MONGO_URI);
  if (SEED_ON_START) {
    await seedDatabase({ force: false, silent: true });
  }
  app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
