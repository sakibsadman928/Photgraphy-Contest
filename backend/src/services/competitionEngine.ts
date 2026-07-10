import { Types } from "mongoose";
import Contest, { IContest } from "../models/Contest";
import ContestParticipant from "../models/ContestParticipant";
import Submission, { ISubmission } from "../models/Submission";
import Score from "../models/Score";
import TieResolution from "../models/TieResolution";
import { ApiError } from "../utils";
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
 * Checks whether every active judge has scored every submission in the contest.
 * Returns per-judge progress so the admin dashboard can show live counters.
 */
export async function getJudgingProgress(contestId: string) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");

  const activeJudgeIds = getActiveJudgeIds(contest);
  const submissions = await Submission.find({ contest: contestId });
  const totalSubmissions = submissions.length;

  const progress = await Promise.all(
    activeJudgeIds.map(async (judgeId) => {
      const scoredCount = await Score.countDocuments({
        contest: contestId,
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

/** Builds the ranked leaderboard for the contest, incorporating any prior tie resolutions. */
export async function buildRankedList(contestId: string): Promise<RankedEntry[]> {
  const submissions = await Submission.find({ contest: contestId });
  const resolutions = await TieResolution.find({ contest: contestId });

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
  submissionIds: string[],
  winnerSubmissionId: string,
  resolvedBy: string,
  note?: string
) {
  if (!submissionIds.includes(winnerSubmissionId)) {
    throw new ApiError(400, "Winner must be one of the tied submissions");
  }

  const submissions = await Submission.find({ _id: { $in: submissionIds }, contest: contestId });
  if (submissions.length !== submissionIds.length) {
    throw new ApiError(404, "One or more tied submissions were not found in this contest");
  }

  const resolution = await TieResolution.create({
    contest: contestId,
    submissionIds,
    winnerSubmission: winnerSubmissionId,
    resolvedBy,
    note,
  });

  await Submission.updateMany({ _id: { $in: submissionIds } }, { tieStatus: "resolved" });

  return resolution;
}

/** Public helper: returns submissions in true competition-engine rank order (score + tiebreaks + resolutions). */
export async function getPublishedLeaderboard(contestId: string) {
  const ranked = await buildRankedList(contestId);
  return ranked.map((entry, i) => ({ submission: entry.submission, rank: i + 1 }));
}

/**
 * Attempts to publish contest results. Runs the full competition engine:
 * averages -> ranking -> tie check at each award boundary (1st/2nd/3rd) ->
 * award winner/second/third; everyone else who submitted is eliminated.
 *
 * Throws (409) with tie details if a consequential tie blocks an award
 * position — the admin must resolve it via resolveTie() and call this again.
 */
export async function publishResults(contestId: string) {
  const contest = await Contest.findById(contestId);
  if (!contest) throw new ApiError(404, "Contest not found");
  if (contest.status !== "submissions_closed") {
    throw new ApiError(400, `Cannot publish results while contest is '${contest.status}'`);
  }

  const progress = await getJudgingProgress(contestId);
  if (!progress.complete) {
    throw new ApiError(409, "All assigned judges must finish scoring before results can be published", {
      progress: progress.progress,
    });
  }

  const ranked = await buildRankedList(contestId);

  // Only the top 3 positions are awards, so those are the only boundaries
  // that can block publishing on an unresolved tie.
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
    await ContestParticipant.updateOne({ contest: contestId, participant: participantId }, { result });
  }

  // Registered participants who never submitted a photo have no score to rank.
  const allParticipants = await ContestParticipant.find({ contest: contestId });
  const submittedIds = new Set(ranked.map((e) => e.submission.participant.toString()));
  for (const p of allParticipants) {
    if (!submittedIds.has(p.participant.toString()) && p.result === "pending") {
      p.result = "no_submission";
      await p.save();
    }
  }

  await Submission.updateMany({ contest: contestId }, { tieStatus: "none" });
  contest.status = "completed";
  await contest.save();

  for (const p of allParticipants) {
    await notifyUser(
      p.participant.toString(),
      "results_published",
      `Results are published for "${contest.title}".`,
      contest._id
    );
  }

  return { ranked: ranked.map((e, i) => ({ submissionId: e.submission._id, rank: i + 1 })) };
}
