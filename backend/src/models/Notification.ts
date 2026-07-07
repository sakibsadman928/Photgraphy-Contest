import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "registration_confirmed"
  | "contest_cancelled"
  | "submission_received"
  | "advanced_to_final"
  | "eliminated"
  | "round1_results_published"
  | "final_results_published"
  | "judge_assigned"
  | "round_opened_for_judging";

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  contest?: Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    contest: { type: Schema.Types.ObjectId, ref: "Contest" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
