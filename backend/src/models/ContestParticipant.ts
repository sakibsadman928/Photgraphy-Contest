import { Schema, model, Document, Types } from "mongoose";
import { ParticipantResult } from "../types";

export interface IContestParticipant extends Document {
  _id: Types.ObjectId;
  contest: Types.ObjectId;
  participant: Types.ObjectId;
  result: ParticipantResult;
  registeredAt: Date;
}

const contestParticipantSchema = new Schema<IContestParticipant>({
  contest: { type: Schema.Types.ObjectId, ref: "Contest", required: true },
  participant: { type: Schema.Types.ObjectId, ref: "User", required: true },
  result: {
    type: String,
    enum: ["pending", "winner", "second", "third", "eliminated", "no_submission"],
    default: "pending",
  },
  registeredAt: { type: Date, default: Date.now },
});

// A participant can only register once per contest.
contestParticipantSchema.index({ contest: 1, participant: 1 }, { unique: true });

export default model<IContestParticipant>("ContestParticipant", contestParticipantSchema);
