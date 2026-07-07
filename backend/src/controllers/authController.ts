import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { ApiError, asyncHandler, AUTH_COOKIE_NAME, getAuthCookieOptions, signAuthToken } from "../utils";

function publicUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    country: user.country,
    profilePhotoUrl: user.profilePhotoUrl,
    mustChangePassword: user.mustChangePassword,
  };
}

/** Participant self-registration. Admin and judge accounts cannot be created here. */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, bio, country } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, "name, email, and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "participant",
    bio,
    country,
  });

  const token = signAuthToken({ userId: user._id.toString(), role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.status(201).json({ user: publicUser(user) });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, "Invalid email or password");

  const token = signAuthToken({ userId: user._id.toString(), role: user.role });
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  res.json({ user: publicUser(user) });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...getAuthCookieOptions(), maxAge: undefined });
  res.status(204).send();
});

/** Called on app load to rehydrate the Redux auth slice from the httpOnly cookie. */
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(401, "Not authenticated");
  res.json({ user: publicUser(user) });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(400, "newPassword must be at least 8 characters");
  }

  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user) throw new ApiError(401, "Not authenticated");

  // Judges on their forced first change may not know a "current" password flow
  // beyond the temp password itself — still require it for security.
  const match = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
  if (!match) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  await user.save();

  res.json({ message: "Password updated" });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, bio, country, profilePhotoUrl } = req.body;
  const user = await User.findById(req.user!.id);
  if (!user) throw new ApiError(401, "Not authenticated");

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (country !== undefined) user.country = country;
  if (profilePhotoUrl !== undefined) user.profilePhotoUrl = profilePhotoUrl;

  await user.save();
  res.json({ user: publicUser(user) });
});
