import { Request, Response } from "express";
import Contest from "../models/Contest";
import Submission from "../models/Submission";
import Score from "../models/Score";
import { ApiError, asyncHandler } from "../utils";
import { recomputeSubmissionAverage } from "../services/competitionEngine";

function assertActiveJudgeOnContest(contest: any, judgeId: string) {
  const isActiveJudge = contest.judges.some((j: any) => j.judge.toString() === judgeId && j.active);
  if (!isActiveJudge) throw new ApiError(403, "You are not an active judge on this contest");
}

/** Anonymized submission list for a judge to score — no participant identity is included. */
export const listSubmissionsToJudge = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertActiveJudgeOnContest(contest, req.user!.id);

  if (contest.status !== "submissions_closed") {
    throw new ApiError(400, `Judging is not currently open (contest status: ${contest.status})`);
  }

  const submissions = await Submission.find({ contest: contest._id }).select(
    "title description photoUrl createdAt"
  );
  const myScores = await Score.find({ contest: contest._id, judge: req.user!.id });
  const scoredIds = new Set(myScores.map((s) => s.submission.toString()));

  res.json({
    submissions: submissions.map((s) => ({
      id: s._id,
      title: s.title,
      description: s.description,
      photoUrl: s.photoUrl,
      alreadyScored: scoredIds.has(s._id.toString()),
    })),
  });
});

export const submitScore = asyncHandler(async (req: Request, res: Response) => {
  const { submissionId, criteriaScores, comments } = req.body;
  if (!submissionId || !Array.isArray(criteriaScores) || criteriaScores.length === 0) {
    throw new ApiError(400, "submissionId and criteriaScores are required");
  }

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  const contest = await Contest.findById(submission.contest);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertActiveJudgeOnContest(contest, req.user!.id);

  if (contest.status !== "submissions_closed") {
    throw new ApiError(400, "Judging is not currently open");
  }

  // Validate each criterion against the contest's configured rubric.
  const rubric = new Map(contest.scoringCriteria.map((c) => [c.name.toLowerCase(), c.maxPoints]));
  let totalScore = 0;
  for (const cs of criteriaScores) {
    const maxPoints = rubric.get(String(cs.name).toLowerCase());
    if (maxPoints === undefined) throw new ApiError(400, `Unknown scoring criterion: ${cs.name}`);
    if (typeof cs.score !== "number" || cs.score < 0 || cs.score > maxPoints) {
      throw new ApiError(400, `Score for "${cs.name}" must be between 0 and ${maxPoints}`);
    }
    totalScore += cs.score;
  }

  // Upsert: judge can edit their score until results are published.
  const score = await Score.findOneAndUpdate(
    { submission: submissionId, judge: req.user!.id },
    {
      submission: submissionId,
      contest: contest._id,
      judge: req.user!.id,
      criteriaScores,
      totalScore,
      comments,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await recomputeSubmissionAverage(submission._id);

  res.status(201).json({ score });
});
