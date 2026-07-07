import { Types } from "mongoose";
import Notification, { NotificationType } from "../models/Notification";

export async function notifyUser(
  userId: string | Types.ObjectId,
  type: NotificationType,
  message: string,
  contestId?: string | Types.ObjectId
) {
  await Notification.create({ user: userId, type, message, contest: contestId });
}

export async function notifyUsers(
  userIds: (string | Types.ObjectId)[],
  type: NotificationType,
  message: string,
  contestId?: string | Types.ObjectId
) {
  await Notification.insertMany(
    userIds.map((user) => ({ user, type, message, contest: contestId }))
  );
}
