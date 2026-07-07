import { Schema, model, Document, Types } from "mongoose";
import { ContestStatus } from "../types";

export interface IScoringCriterion {
  name: string;
  maxPoints: number;
}

export interface IContestJudge {
  judge: Types.ObjectId;
  active: boolean;
  replacedBy?: Types.ObjectId;
  replacedAt?: Date;
}

export interface IContest extends Document {
  _id: Types.ObjectId;
  title: string;
  theme: string;
  registrationDeadline: Date;
  round1Deadline: Date;
  finalDeadline: Date;
  finalistsPercentage: number; // e.g. 20 means 20%
  scoringCriteria: IScoringCriterion[];
  judges: IContestJudge[];
  status: ContestStatus;
  cancelReason?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const scoringCriterionSchema = new Schema<IScoringCriterion>(
  {
    name: { type: String, required: true, trim: true },
    maxPoints: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const contestJudgeSchema = new Schema<IContestJudge>(
  {
    judge: { type: Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
    replacedBy: { type: Schema.Types.ObjectId, ref: "User" },
    replacedAt: { type: Date },
  },
  { _id: false }
);

const contestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true, trim: true },
    theme: { type: String, required: true, trim: true },
    registrationDeadline: { type: Date, required: true },
    round1Deadline: { type: Date, required: true },
    finalDeadline: { type: Date, required: true },
    finalistsPercentage: { type: Number, required: true, min: 1, max: 100 },
    scoringCriteria: {
      type: [scoringCriterionSchema],
      required: true,
      validate: (v: IScoringCriterion[]) => v.length > 0,
    },
    judges: { type: [contestJudgeSchema], default: [] },
    status: {
      type: String,
      enum: [
        "draft",
        "registration_open",
        "registration_closed",
        "cancelled",
        "round1_open",
        "round1_closed",
        "round1_results_published",
        "final_open",
        "final_closed",
        "completed",
      ],
      default: "draft",
    },
    cancelReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default model<IContest>("Contest", contestSchema);
