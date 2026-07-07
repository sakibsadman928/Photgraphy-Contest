import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] Connected to MongoDB (${env.isProduction ? "production" : "development"})`);
  } catch (err) {
    console.error("[db] Failed to connect to MongoDB:", err);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });
}
