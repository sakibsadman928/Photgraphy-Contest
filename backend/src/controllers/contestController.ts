import { Request, Response } from "express";
import Contest from "../models/Contest";
import ContestParticipant from "../models/ContestParticipant";
import Submission from "../models/Submission";
import User from "../models/User";
import { ApiError, asyncHandler } from "../utils";
import {
  getJudgingProgress,
  publishRound1Results,
  publishFinalResults,
  resolveTie,
  getPublishedLeaderboard,
} from "../services/competitionEngine";
import { notifyUsers } from "../services/notificationService";
import { RoundType } from "../types";

const MIN_PARTICIPANTS = 5;

function assertStatus(contest: { status: string }, expected: string, action: string) {
  if (contest.status !== expected) {
    throw new ApiError(400, `Cannot ${action}: contest status is '${contest.status}', expected '${expected}'`);
  }
}

// ── Creation & browsing ──────────────────────────────────────────────

export const createContest = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    theme,
    registrationDeadline,
    round1Deadline,
    finalDeadline,
    finalistsPercentage,
    scoringCriteria,
    judgeIds,
  } = req.body;

  if (!title || !theme || !registrationDeadline || !round1Deadline || !finalDeadline) {
    throw new ApiError(400, "title, theme, registrationDeadline, round1Deadline, and finalDeadline are required");
  }
  if (!Array.isArray(scoringCriteria) || scoringCriteria.length === 0) {
    throw new ApiError(400, "At least one scoring criterion is required");
  }
  if (!finalistsPercentage || finalistsPercentage <= 0 || finalistsPercentage > 100) {
    throw new ApiError(400, "finalistsPercentage must be between 1 and 100");
  }

  const regDate = new Date(registrationDeadline);
  const r1Date = new Date(round1Deadline);
  const finalDate = new Date(finalDeadline);
  if (!(regDate < r1Date && r1Date < finalDate)) {
    throw new ApiError(400, "Deadlines must be strictly increasing: registration < round1 < final");
  }

  let judges: { judge: string; active: boolean }[] = [];
  if (judgeIds && Array.isArray(judgeIds) && judgeIds.length > 0) {
    const foundJudges = await User.find({ _id: { $in: judgeIds }, role: "judge" });
    if (foundJudges.length !== judgeIds.length) {
      throw new ApiError(400, "One or more judgeIds are invalid or not judge accounts");
    }
    judges = judgeIds.map((id: string) => ({ judge: id, active: true }));
  }

  const contest = await Contest.create({
    title,
    theme,
    registrationDeadline: regDate,
    round1Deadline: r1Date,
    finalDeadline: finalDate,
    finalistsPercentage,
    scoringCriteria,
    judges,
    status: "draft",
    createdBy: req.user!.id,
  });

  res.status(201).json({ contest });
});

export const listContests = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const contests = await Contest.find(filter).sort({ createdAt: -1 });
  res.json({ contests });
});

export const getContest = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id).populate("judges.judge", "name email");
  if (!contest) throw new ApiError(404, "Contest not found");

  const registeredCount = await ContestParticipant.countDocuments({ contest: contest._id });
  res.json({ contest, registeredCount });
});

// ── Lifecycle: Registration ──────────────────────────────────────────

export const publishContest = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "draft", "publish contest");
  if (!contest.judges.some((j) => j.active)) {
    throw new ApiError(400, "Assign at least one judge before publishing the contest");
  }

  contest.status = "registration_open";
  await contest.save();
  res.json({ contest });
});

/** Lets the logged-in participant check their own registration/round status for a contest. */
export const getMyParticipation = asyncHandler(async (req: Request, res: Response) => {
  const participation = await ContestParticipant.findOne({
    contest: req.params.id,
    participant: req.user!.id,
  });
  res.json({ participation });
});

export const joinContest = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "registration_open", "join contest");
  if (new Date() > contest.registrationDeadline) {
    throw new ApiError(400, "The registration deadline has passed");
  }

  const already = await ContestParticipant.findOne({ contest: contest._id, participant: req.user!.id });
  if (already) throw new ApiError(409, "You are already registered for this contest");

  await ContestParticipant.create({ contest: contest._id, participant: req.user!.id });
  res.status(201).json({ message: "Registered successfully" });
});

export const closeRegistration = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "registration_open", "close registration");

  const registeredCount = await ContestParticipant.countDocuments({ contest: contest._id });

  if (registeredCount < MIN_PARTICIPANTS) {
    contest.status = "cancelled";
    contest.cancelReason = `Only ${registeredCount} participant(s) registered; minimum is ${MIN_PARTICIPANTS}.`;
    await contest.save();

    const participants = await ContestParticipant.find({ contest: contest._id });
    await notifyUsers(
      participants.map((p) => p.participant),
      "contest_cancelled",
      `"${contest.title}" was cancelled due to insufficient registrations.`,
      contest._id
    );

    res.json({ contest, cancelled: true });
    return;
  }

  contest.status = "registration_closed";
  await contest.save();
  res.json({ contest, cancelled: false, registeredCount });
});

// ── Lifecycle: Round 1 ────────────────────────────────────────────────

export const openRound1 = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "registration_closed", "open Round 1");

  contest.status = "round1_open";
  await contest.save();

  const participants = await ContestParticipant.find({ contest: contest._id });
  await notifyUsers(
    participants.map((p) => p.participant),
    "round_opened_for_judging",
    `Round 1 submissions are now open for "${contest.title}".`,
    contest._id
  );

  res.json({ contest });
});

export const closeRound1 = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "round1_open", "close Round 1");

  contest.status = "round1_closed";
  await contest.save();
  res.json({ contest });
});

export const getRound1Progress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await getJudgingProgress(req.params.id, "round1");
  res.json(progress);
});

export const publishRound1 = asyncHandler(async (req: Request, res: Response) => {
  const result = await publishRound1Results(req.params.id);
  res.json({ message: "Round 1 results published", ...result });
});

export const resolveRound1Tie = asyncHandler(async (req: Request, res: Response) => {
  const { submissionIds, winnerSubmissionId, note } = req.body;
  if (!Array.isArray(submissionIds) || submissionIds.length < 2 || !winnerSubmissionId) {
    throw new ApiError(400, "submissionIds (2+) and winnerSubmissionId are required");
  }
  const resolution = await resolveTie(req.params.id, "round1", submissionIds, winnerSubmissionId, req.user!.id, note);
  res.status(201).json({ resolution });
});

// ── Lifecycle: Final ──────────────────────────────────────────────────

export const openFinal = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "round1_results_published", "open the Final");

  contest.status = "final_open";
  await contest.save();

  const finalists = await ContestParticipant.find({ contest: contest._id, round1Result: "advanced" });
  await notifyUsers(
    finalists.map((p) => p.participant),
    "round_opened_for_judging",
    `The Final round is now open for "${contest.title}". Submit your photo before the deadline!`,
    contest._id
  );

  res.json({ contest });
});

export const closeFinal = asyncHandler(async (req: Request, res: Response) => {
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  assertStatus(contest, "final_open", "close the Final");

  contest.status = "final_closed";
  await contest.save();
  res.json({ contest });
});

export const getFinalProgress = asyncHandler(async (req: Request, res: Response) => {
  const progress = await getJudgingProgress(req.params.id, "final");
  res.json(progress);
});

export const publishFinal = asyncHandler(async (req: Request, res: Response) => {
  const result = await publishFinalResults(req.params.id);
  res.json({ message: "Final results published", ...result });
});

export const resolveFinalTie = asyncHandler(async (req: Request, res: Response) => {
  const { submissionIds, winnerSubmissionId, note } = req.body;
  if (!Array.isArray(submissionIds) || submissionIds.length < 2 || !winnerSubmissionId) {
    throw new ApiError(400, "submissionIds (2+) and winnerSubmissionId are required");
  }
  const resolution = await resolveTie(req.params.id, "final", submissionIds, winnerSubmissionId, req.user!.id, note);
  res.status(201).json({ resolution });
});

// ── Judges on a contest ───────────────────────────────────────────────

export const addJudgeToContest = asyncHandler(async (req: Request, res: Response) => {
  const { judgeId } = req.body;
  if (!judgeId) throw new ApiError(400, "judgeId is required");

  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (["completed", "cancelled"].includes(contest.status)) {
    throw new ApiError(400, "Cannot modify judges on a completed or cancelled contest");
  }

  const judge = await User.findOne({ _id: judgeId, role: "judge" });
  if (!judge) throw new ApiError(404, "Judge not found");

  if (contest.judges.some((j) => j.judge.toString() === judgeId && j.active)) {
    throw new ApiError(409, "Judge is already assigned to this contest");
  }

  contest.judges.push({ judge: judge._id, active: true } as any);
  await contest.save();

  await notifyUsers([judge._id], "judge_assigned", `You've been assigned to judge "${contest.title}".`, contest._id);

  res.status(201).json({ contest });
});

/**
 * Permanently replaces an unresponsive judge. The departing judge's
 * already-submitted scores remain valid and counted; only their unscored
 * submissions become the new judge's responsibility.
 */
export const replaceJudge = asyncHandler(async (req: Request, res: Response) => {
  const { judgeId } = req.params;
  const { newJudgeId } = req.body;
  if (!newJudgeId) throw new ApiError(400, "newJudgeId is required");

  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");

  const current = contest.judges.find((j) => j.judge.toString() === judgeId && j.active);
  if (!current) throw new ApiError(404, "Active judge assignment not found on this contest");

  const newJudge = await User.findOne({ _id: newJudgeId, role: "judge" });
  if (!newJudge) throw new ApiError(404, "Replacement judge not found");
  if (contest.judges.some((j) => j.judge.toString() === newJudgeId && j.active)) {
    throw new ApiError(409, "Replacement judge is already assigned to this contest");
  }

  current.active = false;
  current.replacedBy = newJudge._id;
  current.replacedAt = new Date();
  contest.judges.push({ judge: newJudge._id, active: true } as any);
  await contest.save();

  await notifyUsers(
    [newJudge._id],
    "judge_assigned",
    `You've been assigned to judge "${contest.title}" (replacing another judge).`,
    contest._id
  );

  res.json({ contest });
});

// ── Leaderboard ───────────────────────────────────────────────────────

/** Admin-only: view all submissions in a round with participant identity visible — used to preview
 * standings before publishing and to see who's involved when resolving a tie. */
export const getRoundSubmissionsForAdmin = asyncHandler(async (req: Request, res: Response) => {
  const round = req.params.round as RoundType;
  const submissions = await Submission.find({ contest: req.params.id, round })
    .populate("participant", "name email country")
    .sort({ averageScore: -1 });
  res.json({ submissions });
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const round = req.params.round as RoundType;
  const contest = await Contest.findById(req.params.id);
  if (!contest) throw new ApiError(404, "Contest not found");

  const visibleForRound1 = ["round1_results_published", "final_open", "final_closed", "completed"];
  const visibleForFinal = ["completed"];
  const visible = round === "round1" ? visibleForRound1.includes(contest.status) : visibleForFinal.includes(contest.status);
  if (!visible) throw new ApiError(403, "Results for this round have not been published yet");

  const ranked = await getPublishedLeaderboard(req.params.id, round);
  const populated = await Submission.populate(
    ranked.map((r) => r.submission),
    { path: "participant", select: "name country profilePhotoUrl" }
  );

  res.json({
    leaderboard: ranked.map((r, i) => ({
      rank: r.rank,
      submission: populated[i],
    })),
  });
});
