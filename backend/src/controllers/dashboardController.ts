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
    "title theme status registrationDeadline round1Deadline finalDeadline"
  );

  const submissions = await Submission.find({ participant: req.user!.id }).select(
    "contest round title averageScore createdAt"
  );

  res.json({ participations, submissions });
});

export const judgeDashboard = asyncHandler(async (req: Request, res: Response) => {
  const contests = await Contest.find({ "judges.judge": req.user!.id, "judges.active": true }).select(
    "title theme status"
  );

  const dashboard = await Promise.all(
    contests.map(async (contest) => {
      const round: "round1" | "final" | null =
        contest.status === "round1_closed" ? "round1" : contest.status === "final_closed" ? "final" : null;

      if (!round) return { contest, pending: 0, completed: 0 };

      const totalSubmissions = await Submission.countDocuments({ contest: contest._id, round });
      const completed = await Score.countDocuments({ contest: contest._id, round, judge: req.user!.id });
      return { contest, round, pending: totalSubmissions - completed, completed };
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
