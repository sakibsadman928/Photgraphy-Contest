import { Schema, model, Document, Types } from "mongoose";
import { RoundType, TieStatus } from "../types";

export interface ISubmission extends Document {
  _id: Types.ObjectId;
  contest: Types.ObjectId;
  round: RoundType;
  participant: Types.ObjectId;
  title: string;
  description?: string;
  photoUrl: string;
  cloudinaryPublicId: string;
  averageScore: number | null;
  tieStatus: TieStatus;
  createdAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
    round: { type: String, enum: ["round1", "final"], required: true },
    participant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    photoUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    averageScore: { type: Number, default: null },
    tieStatus: { type: String, enum: ["none", "pending", "resolved"], default: "none" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// One submission per participant, per round, per contest — enforces the
// "one-shot upload, no resubmission" rule at the database level.
submissionSchema.index({ contest: 1, round: 1, participant: 1 }, { unique: true });

export default model<ISubmission>("Submission", submissionSchema);
