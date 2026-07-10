import { Schema, model, Document, Types } from "mongoose";

export interface ITieResolution extends Document {
  _id: Types.ObjectId;
  contest: Types.ObjectId;
  submissionIds: Types.ObjectId[];
  winnerSubmission: Types.ObjectId;
  resolvedBy: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const tieResolutionSchema = new Schema<ITieResolution>(
  {
    contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
    submissionIds: [{ type: Schema.Types.ObjectId, ref: "Submission", required: true }],
    winnerSubmission: { type: Schema.Types.ObjectId, ref: "Submission", required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<ITieResolution>("TieResolution", tieResolutionSchema);
