import { Schema, model, Document, Types } from "mongoose";
import { UserRole } from "../types";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  bio?: string;
  country?: string;
  profilePhotoUrl?: string;
  emailVerified: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "judge", "participant"],
      required: true,
    },
    bio: { type: String, default: "" },
    country: { type: String, default: "" },
    profilePhotoUrl: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false },
    // Forces a judge to set their own password on first login.
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IUser>("User", userSchema);
