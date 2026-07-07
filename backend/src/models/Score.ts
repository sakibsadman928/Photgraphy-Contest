import { Schema, model, Document, Types } from "mongoose";
import { RoundType } from "../types";

export interface ICriterionScore {
  name: string;
  score: number;
}

export interface IScore extends Document {
  _id: Types.ObjectId;
  submission: Types.ObjectId;
  contest: Types.ObjectId;
  round: RoundType;
  judge: Types.ObjectId;
  criteriaScores: ICriterionScore[];
  totalScore: number;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const criterionScoreSchema = new Schema<ICriterionScore>(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const scoreSchema = new Schema<IScore>(
  {
    submission: { type: Schema.Types.ObjectId, ref: "Submission", required: true },
    contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
    round: { type: String, enum: ["round1", "final"], required: true },
    judge: { type: Schema.Types.ObjectId, ref: "User", required: true },
    criteriaScores: { type: [criterionScoreSchema], required: true },
    totalScore: { type: Number, required: true },
    comments: { type: String, default: "" },
  },
  { timestamps: true }
);

// A judge can only score a given submission once (updates overwrite this doc
// until results are published — see scoreController).
scoreSchema.index({ submission: 1, judge: 1 }, { unique: true });

export default model<IScore>("Score", scoreSchema);
