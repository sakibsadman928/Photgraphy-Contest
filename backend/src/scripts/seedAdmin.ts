/**
 * Creates the single seeded admin account from ADMIN_NAME / ADMIN_EMAIL /
 * ADMIN_PASSWORD in .env. Safe to run multiple times — it's a no-op if an
 * admin with that email already exists.
 *
 * Usage: npm run seed:admin
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import User from "../models/User";
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function seedAdmin() {
  if (!env.adminEmail || !env.adminPassword) {
    console.error(
      "[seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin account.",
    );
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ email: env.adminEmail.toLowerCase() });
  if (existing) {
    console.log(
      `[seed] Admin account already exists for ${env.adminEmail}. Nothing to do.`,
    );
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 12);
  await User.create({
    name: env.adminName,
    email: env.adminEmail,
    passwordHash,
    role: "admin",
    emailVerified: true,
  });

  console.log(`[seed] Admin account created for ${env.adminEmail}.`);
  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
