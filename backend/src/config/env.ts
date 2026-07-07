/**
 * Centralized, validated environment configuration.
 *
 * Every configurable value the app needs lives here and nowhere else reads
 * `process.env` directly. This means deploying to a new environment (local,
 * staging, production) is just a matter of changing the values in `.env` —
 * no code changes required.
 *
 * The app fails fast with a clear error message if a required variable is
 * missing, instead of failing confusingly later at runtime.
 */
import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env file against .env.example.`
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: optional("NODE_ENV", "development") === "production",
  port: parseInt(optional("PORT", "5000"), 10),

  mongoUri: required("MONGO_URI"),

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),
  cookieMaxAgeDays: parseInt(optional("COOKIE_MAX_AGE_DAYS", "7"), 10),
  cookieDomain: optional("COOKIE_DOMAIN", ""),

  clientUrl: required("CLIENT_URL"),

  adminName: optional("ADMIN_NAME", "Platform Admin"),
  adminEmail: optional("ADMIN_EMAIL", ""),
  adminPassword: optional("ADMIN_PASSWORD", ""),

  cloudinaryCloudName: required("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: required("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: required("CLOUDINARY_API_SECRET"),
};
