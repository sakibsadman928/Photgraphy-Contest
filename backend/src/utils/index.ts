import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { AuthTokenPayload } from "../types";

/** Standard operational error with an HTTP status code attached. */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Wraps an async Express handler so thrown errors (or rejected promises)
 * are forwarded to the error-handling middleware instead of crashing the
 * process or hanging the request.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Generates a random, human-typeable temporary password for new judge accounts. */
export function generateTempPassword(): string {
  return crypto.randomBytes(9).toString("base64url"); // 12-char URL-safe string
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}

export const AUTH_COOKIE_NAME = "pcp_token";

/** Cookie options are centralized here so dev vs. prod behavior only needs to change once. */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction, // requires HTTPS in production
    sameSite: (env.isProduction ? "none" : "lax") as "none" | "lax",
    domain: env.cookieDomain || undefined,
    maxAge: env.cookieMaxAgeDays * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
