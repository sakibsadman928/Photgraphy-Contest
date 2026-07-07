import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { ApiError, asyncHandler, generateTempPassword } from "../utils";

/** Admin creates a judge account. No public judge signup exists. */
export const createJudge = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) throw new ApiError(400, "name and email are required");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const judge = await User.create({
    name,
    email,
    passwordHash,
    role: "judge",
    mustChangePassword: true,
  });

  // Admin shares this temporary password with the judge manually (per design decision —
  // no invitation email flow). It is only ever returned in this one response.
  res.status(201).json({
    judge: { id: judge._id, name: judge.name, email: judge.email },
    tempPassword,
  });
});

export const listJudges = asyncHandler(async (_req: Request, res: Response) => {
  const judges = await User.find({ role: "judge" }).select("name email createdAt");
  res.json({ judges });
});
