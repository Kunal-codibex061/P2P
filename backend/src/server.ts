import app from "./app";
import { seedDatabase } from "./seed/runSeed";
import { env } from "./config/env";
import { connectDB } from "./utils/db";

async function bootstrap() {
  await connectDB(env.MONGO_URI);
  if (env.SEED_ON_START) {
    await seedDatabase({ force: false, silent: true });
  }
  app.listen(env.PORT, () => {
    console.log(`Backend API running on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
