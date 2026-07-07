import { Request, Response } from "express";
import Contest from "../models/Contest";
import ContestParticipant from "../models/ContestParticipant";
import Submission from "../models/Submission";
import { ApiError, asyncHandler } from "../utils";
import { notifyUser } from "../services/notificationService";
import { uploadImageBuffer } from "../config/cloudinary";
import { RoundType } from "../types";

export const createSubmission = asyncHandler(async (req: Request, res: Response) => {
  const round = req.params.round as RoundType;
  const { title, description } = req.body;
  const file = req.file;

  if (!file) throw new ApiError(400, "A photo file is required");
  if (!title) throw new ApiError(400, "title is required");

  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");

  const participation = await ContestParticipant.findOne({ contest: contest._id, participant: req.user!.id });
  if (!participation) throw new ApiError(403, "You are not registered for this contest");

  if (round === "round1") {
    if (contest.status !== "round1_open") throw new ApiError(400, "Round 1 submissions are not currently open");
    if (new Date() > contest.round1Deadline) throw new ApiError(400, "The Round 1 submission deadline has passed");
  } else if (round === "final") {
    if (contest.status !== "final_open") throw new ApiError(400, "The Final round is not currently open");
    if (new Date() > contest.finalDeadline) throw new ApiError(400, "The Final submission deadline has passed");
    if (participation.round1Result !== "advanced") {
      throw new ApiError(403, "Only finalists may submit to the Final round");
    }
  } else {
    throw new ApiError(400, "Invalid round");
  }

  const existing = await Submission.findOne({ contest: contest._id, round, participant: req.user!.id });
  if (existing) throw new ApiError(409, "You have already submitted for this round — resubmission is not allowed");

  const uploaded = await uploadImageBuffer(file.buffer, "photo-contest-platform/submissions");

  const submission = await Submission.create({
    contest: contest._id,
    round,
    participant: req.user!.id,
    title,
    description,
    photoUrl: uploaded.url,
    cloudinaryPublicId: uploaded.publicId,
  });

  await notifyUser(req.user!.id, "submission_received", `Your submission for "${contest.title}" was received.`, contest._id);

  res.status(201).json({ submission });
});

/** A participant viewing their own submission for a round (e.g. to confirm it locked in). */
export const getMySubmission = asyncHandler(async (req: Request, res: Response) => {
  const round = req.params.round as RoundType;
  const submission = await Submission.findOne({
    contest: req.params.id,
    round,
    participant: req.user!.id,
  });
  res.json({ submission });
});
