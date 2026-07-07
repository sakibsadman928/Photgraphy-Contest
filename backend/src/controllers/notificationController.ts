import { Request, Response } from "express";
import Notification from "../models/Notification";
import { asyncHandler } from "../utils";

/** Polled by the frontend every 15-30s to update the Redux notifications slice. */
export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ user: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user!.id, read: false });
  res.json({ notifications, unreadCount });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
  res.json({ message: "All notifications marked as read" });
});

export const markOneRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user!.id }, { read: true });
  res.json({ message: "Notification marked as read" });
});
