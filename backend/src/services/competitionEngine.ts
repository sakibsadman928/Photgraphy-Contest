import { Types } from "mongoose";
import Contest, { IContest } from "../models/Contest";
import ContestParticipant from "../models/ContestParticipant";
import Submission, { ISubmission } from "../models/Submission";
import Score from "../models/Score";
import TieResolution from "../models/TieResolution";
import { ApiError } from "../utils";
import { RoundType } from "../types";
import { notifyUser } from "./notificationService";

// Tie-break criteria, checked in this exact order. These must match the
// `name` fields configured in a contest's scoringCriteria to have any
// effect — if a contest doesn't use these criterion names, ties simply
// fall through to the next tiebreaker level (and ultimately to the admin).
const TIEBREAK_CRITERIA_ORDER = ["creativity", "theme relevance"];

interface RankedEntry {
  submission: ISubmission;
  averageScore: number;
  tiebreakValues: number[]; // one per TIEBREAK_CRITERIA_ORDER entry
  resolvedPriority: number; // 0 = won an explicit tie resolution, 1 = default
}

/** Returns the list of currently-active judge user IDs assigned to a contest. */
export function getActiveJudgeIds(contest: IContest): string[] {
  return contest.judges.filter((j) => j.active).map((j) => j.judge.toString());
}

/**
 * Checks whether every active judge has scored every submission in a round.
 * Returns per-judge progress so the admin dashboard can show live counters.
 */
export async function getJudgingProgress(contestId: string, round: RoundType) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");

  const activeJudgeIds = getActiveJudgeIds(contest);
  const submissions = await Submission.find({ contest: contestId, round });
  const totalSubmissions = submissions.length;

  const progress = await Promise.all(
    activeJudgeIds.map(async (judgeId) => {
      const scoredCount = await Score.countDocuments({
        contest: contestId,
        round,
        judge: judgeId,
      });
      return { judgeId, scoredCount, totalSubmissions };
    })
  );

  const complete =
    totalSubmissions > 0 && progress.every((p) => p.scoredCount === p.totalSubmissions);

  return { complete, totalSubmissions, progress };
}

/** Recomputes and stores a submission's average score across all judges who've scored it so far. */
export async function recomputeSubmissionAverage(submissionId: Types.ObjectId | string) {
  const scores = await Score.find({ submission: submissionId });
  const average =
    scores.length > 0 ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length : null;
  await Submission.findByIdAndUpdate(submissionId, { averageScore: average });
  return average;
}

/** Builds the ranked leaderboard for a round, incorporating any prior tie resolutions. */
export async function buildRankedList(contestId: string, round: RoundType): Promise<RankedEntry[]> {
  const submissions = await Submission.find({ contest: contestId, round });
  const resolutions = await TieResolution.find({ contest: contestId, round });

  // Map: submissionId -> 0 if it won its tie group, 1 otherwise (only submissions
  // that appeared in a resolution get a defined priority; everyone else is untouched).
  const priorityMap = new Map<string, number>();
  for (const res of resolutions) {
    for (const subId of res.submissionIds) {
      const key = subId.toString();
      const isWinner = res.winnerSubmission.toString() === key;
      priorityMap.set(key, isWinner ? 0 : 1);
    }
  }

  const entries: RankedEntry[] = [];
  for (const submission of submissions) {
    const scores = await Score.find({ submission: submission._id });
    const tiebreakValues = TIEBREAK_CRITERIA_ORDER.map((criterionName) => {
      const values = scores
        .map((s) => s.criteriaScores.find((c) => c.name.toLowerCase() === criterionName)?.score)
        .filter((v): v is number => typeof v === "number");
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    });

    entries.push({
      submission,
      averageScore: submission.averageScore ?? 0,
      tiebreakValues,
      resolvedPriority: priorityMap.get(submission._id.toString()) ?? 1,
    });
  }

  entries.sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    for (let i = 0; i < TIEBREAK_CRITERIA_ORDER.length; i++) {
      if (b.tiebreakValues[i] !== a.tiebreakValues[i]) return b.tiebreakValues[i] - a.tiebreakValues[i];
    }
    // Explicit admin resolution breaks any remaining tie.
    return a.resolvedPriority - b.resolvedPriority;
  });

  return entries;
}

/** True if two ranked entries are fully tied (same score + all tiebreak values), ignoring past resolutions. */
function isRawTie(a: RankedEntry, b: RankedEntry): boolean {
  if (a.averageScore !== b.averageScore) return false;
  return a.tiebreakValues.every((v, i) => v === b.tiebreakValues[i]);
}

/** Finds contiguous groups of raw-tied entries that straddle a given 1-indexed cutoff position. */
function findUnresolvedBoundaryTie(
  ranked: RankedEntry[],
  cutoffPosition: number
): RankedEntry[] | null {
  const lastInIdx = cutoffPosition - 1; // last index INSIDE the cutoff
  const firstOutIdx = cutoffPosition; // first index OUTSIDE the cutoff
  if (lastInIdx < 0 || firstOutIdx >= ranked.length) return null;

  const boundaryEntry = ranked[lastInIdx];
  const nextEntry = ranked[firstOutIdx];
  if (!isRawTie(boundaryEntry, nextEntry)) return null;

  // Already resolved if both have distinct resolvedPriority (one is 0, meaning a
  // TieResolution exists covering this exact pair/group).
  if (boundaryEntry.resolvedPriority !== nextEntry.resolvedPriority) return null;

  // Collect the full tied group (could be 3+ way ties).
  const group = ranked.filter((e) => isRawTie(e, boundaryEntry));
  return group;
}

/**
 * Admin resolves a consequential tie by picking a winner among the tied
 * submissions. Recorded permanently; the next publish attempt will then
 * rank the winner above the rest of the tied group.
 */
export async function resolveTie(
  contestId: string,
  round: RoundType,
  submissionIds: string[],
  winnerSubmissionId: string,
  resolvedBy: string,
  note?: string
) {
  if (!submissionIds.includes(winnerSubmissionId)) {
    throw new ApiError(400, "Winner must be one of the tied submissions");
  }

  const submissions = await Submission.find({ _id: { $in: submissionIds }, contest: contestId, round });
  if (submissions.length !== submissionIds.length) {
    throw new ApiError(404, "One or more tied submissions were not found in this contest/round");
  }

  const resolution = await TieResolution.create({
    contest: contestId,
    round,
    submissionIds,
    winnerSubmission: winnerSubmissionId,
    resolvedBy,
    note,
  });

  await Submission.updateMany({ _id: { $in: submissionIds } }, { tieStatus: "resolved" });

  return resolution;
}

/** Public helper: returns submissions in true competition-engine rank order (score + tiebreaks + resolutions). */
export async function getPublishedLeaderboard(contestId: string, round: RoundType) {
  const ranked = await buildRankedList(contestId, round);
  return ranked.map((entry, i) => ({ submission: entry.submission, rank: i + 1 }));
}

export function calculateFinalistCount(registeredCount: number, finalistsPercentage: number): number {
  return Math.max(2, Math.ceil((registeredCount * finalistsPercentage) / 100));
}

/**
 * Attempts to publish Round 1 results. Runs the full competition engine:
 * averages -> ranking -> finalist cutoff -> tie check -> advance/eliminate.
 *
 * Throws (409) with tie details if a consequential tie blocks the cutoff —
 * the admin must resolve it via resolveTie() and call this again.
 */
export async function publishRound1Results(contestId: string) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status !== "round1_closed") {
    throw new ApiError(400, `Cannot publish Round 1 results while contest is '${contest.status}'`);
  }

  const progress = await getJudgingProgress(contestId, "round1");
  if (!progress.complete) {
    throw new ApiError(409, "All assigned judges must finish scoring before results can be published", {
      progress: progress.progress,
    });
  }

  const ranked = await buildRankedList(contestId, "round1");

  const registeredCount = await ContestParticipant.countDocuments({ contest: contestId });
  const finalistCount = Math.min(
    calculateFinalistCount(registeredCount, contest.finalistsPercentage),
    ranked.length
  );

  const tieGroup = findUnresolvedBoundaryTie(ranked, finalistCount);
  if (tieGroup) {
    await Submission.updateMany(
      { _id: { $in: tieGroup.map((e) => e.submission._id) } },
      { tieStatus: "pending" }
    );
    throw new ApiError(409, "A tie at the finalist cutoff needs admin resolution before publishing", {
      tiedSubmissionIds: tieGroup.map((e) => e.submission._id),
    });
  }

  const advancedIds = new Set(ranked.slice(0, finalistCount).map((e) => e.submission.participant.toString()));

  // Anyone who submitted but isn't in the advanced set is eliminated.
  for (const entry of ranked) {
    const participantId = entry.submission.participant.toString();
    const result = advancedIds.has(participantId) ? "advanced" : "eliminated";
    await ContestParticipant.updateOne(
      { contest: contestId, participant: participantId },
      { round1Result: result }
    );
    await notifyUser(
      participantId,
      result === "advanced" ? "advanced_to_final" : "eliminated",
      result === "advanced"
        ? `You advanced to the Final in "${contest.title}"!`
        : `Round 1 results are in for "${contest.title}" — you were not selected to advance.`,
      contest._id
    );
  }

  // Anyone registered but with no submission was already excluded from ranking;
  // make sure their status reflects that.
  await ContestParticipant.updateMany(
    { contest: contestId, round1Result: "pending" },
    { round1Result: "no_submission" }
  );

  await Submission.updateMany({ contest: contestId, round: "round1" }, { tieStatus: "none" });
  contest.status = "round1_results_published";
  await contest.save();

  return { finalistCount, advancedParticipantIds: Array.from(advancedIds) };
}

/**
 * Attempts to publish the Final results (1st/2nd/3rd). Same engine pattern as
 * Round 1, but checks ties at each award boundary (1v2, 2v3, 3v4) rather than
 * a single cutoff, since each position is its own award.
 */
export async function publishFinalResults(contestId: string) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status !== "final_closed") {
    throw new ApiError(400, `Cannot publish Final results while contest is '${contest.status}'`);
  }

  const progress = await getJudgingProgress(contestId, "final");
  if (!progress.complete) {
    throw new ApiError(409, "All assigned judges must finish scoring before winners can be published", {
      progress: progress.progress,
    });
  }

  const ranked = await buildRankedList(contestId, "final");

  const awardBoundaries = [1, 2, 3].filter((pos) => pos < ranked.length);
  for (const boundary of awardBoundaries) {
    const tieGroup = findUnresolvedBoundaryTie(ranked, boundary);
    if (tieGroup) {
      await Submission.updateMany(
        { _id: { $in: tieGroup.map((e) => e.submission._id) } },
        { tieStatus: "pending" }
      );
      throw new ApiError(409, `A tie affecting award position #${boundary} needs admin resolution`, {
        tiedSubmissionIds: tieGroup.map((e) => e.submission._id),
      });
    }
  }

  const labels: Record<number, "winner" | "second" | "third"> = { 0: "winner", 1: "second", 2: "third" };
  for (let i = 0; i < ranked.length; i++) {
    const participantId = ranked[i].submission.participant.toString();
    const result = labels[i] ?? "eliminated";
    await ContestParticipant.updateOne(
      { contest: contestId, participant: participantId },
      { finalResult: result }
    );
  }

  // Finalists who registered for the round but never submitted the Final photo.
  const finalParticipants = await ContestParticipant.find({ contest: contestId, round1Result: "advanced" });
  const submittedIds = new Set(ranked.map((e) => e.submission.participant.toString()));
  for (const p of finalParticipants) {
    if (!submittedIds.has(p.participant.toString()) && p.finalResult === "not_applicable") {
      p.finalResult = "no_submission";
      await p.save();
    }
  }

  await Submission.updateMany({ contest: contestId, round: "final" }, { tieStatus: "none" });
  contest.status = "completed";
  await contest.save();

  for (const p of finalParticipants) {
    await notifyUser(
      p.participant.toString(),
      "final_results_published",
      `Final results are published for "${contest.title}".`,
      contest._id
    );
  }

  return { ranked: ranked.map((e, i) => ({ submissionId: e.submission._id, rank: i + 1 })) };
}
