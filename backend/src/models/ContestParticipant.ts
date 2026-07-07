import { Schema, model, Document, Types } from "mongoose";
import { Round1Result, FinalResult } from "../types";

export interface IContestParticipant extends Document {
  _id: Types.ObjectId;
  contest: Types.ObjectId;
  participant: Types.ObjectId;
  round1Result: Round1Result;
  finalResult: FinalResult;
  registeredAt: Date;
}

const contestParticipantSchema = new Schema<IContestParticipant>({
  contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
  participant: { type: Schema.Types.ObjectId, ref: "User", required: true },
  round1Result: {
    type: String,
    enum: ["pending", "advanced", "eliminated", "no_submission"],
    default: "pending",
  },
  finalResult: {
    type: String,
    enum: ["not_applicable", "pending", "winner", "second", "third", "eliminated", "no_submission"],
    default: "not_applicable",
  },
  registeredAt: { type: Date, default: Date.now },
});

// A participant can only register once per contest.
contestParticipantSchema.index({ contest: 1, participant: 1 }, { unique: true });

export default model<IContestParticipant>("ContestParticipant", contestParticipantSchema);
