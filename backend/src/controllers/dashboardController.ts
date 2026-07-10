import { Request, Response } from "express";
import Contest from "../models/Contest";
import ContestParticipant from "../models/ContestParticipant";
import Submission from "../models/Submission";
import Score from "../models/Score";
import User from "../models/User";
import { asyncHandler } from "../utils";

export const participantDashboard = asyncHandler(async (req: Request, res: Response) => {
  const participations = await ContestParticipant.find({ participant: req.user!.id }).populate(
    "contest",
    "title theme status registrationDeadline submissionDeadline"
  );

  const submissions = await Submission.find({ participant: req.user!.id }).select(
    "contest title averageScore createdAt"
  );

  res.json({ participations, submissions });
});

export const judgeDashboard = asyncHandler(async (req: Request, res: Response) => {
  const contests = await Contest.find({ "judges.judge": req.user!.id, "judges.active": true }).select(
    "title theme status"
  );

  const dashboard = await Promise.all(
    contests.map(async (contest) => {
      const judging = contest.status === "submissions_closed";
      if (!judging) return { contest, judging: false, pending: 0, completed: 0 };

      const totalSubmissions = await Submission.countDocuments({ contest: contest._id });
      const completed = await Score.countDocuments({ contest: contest._id, judge: req.user!.id });
      return { contest, judging: true, pending: totalSubmissions - completed, completed };
    })
  );

  res.json({ dashboard });
});

export const adminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [totalContests, activeContests, totalParticipants, totalJudges, totalSubmissions] = await Promise.all([
    Contest.countDocuments(),
    Contest.countDocuments({
      status: { $nin: ["draft", "completed", "cancelled"] },
    }),
    User.countDocuments({ role: "participant" }),
    User.countDocuments({ role: "judge" }),
    Submission.countDocuments(),
  ]);

  res.json({
    stats: { totalContests, activeContests, totalParticipants, totalJudges, totalSubmissions },
  });
});
