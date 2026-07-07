import { Request, Response, NextFunction } from "express";
import { ApiError, asyncHandler, AUTH_COOKIE_NAME, verifyAuthToken } from "../utils";
import User from "../models/User";
import { UserRole } from "../types";

/**
 * Verifies the httpOnly auth cookie and attaches `req.user`.
 * The JWT never touches the frontend's JS — it lives only in the cookie.
 */
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "Not authenticated");
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new ApiError(401, "Session expired or invalid, please log in again");
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});

/** Restricts a route to one or more roles. Use after `protect`. */
export function restrictTo(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
