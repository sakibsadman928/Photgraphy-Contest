"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { Contest, Submission } from "@/types";
import { useAppSelector } from "@/store/hooks";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FrameDivider from "@/components/ui/FrameDivider";

interface Participation {
  result: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const RESULT_LABEL: Record<string, string> = {
  pending: "Awaiting results",
  winner: "🏆 Winner",
  second: "2nd place",
  third: "3rd place",
  eliminated: "Not selected",
  no_submission: "No submission received",
};

export default function ContestDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);

  const [data, setData] = useState<{ contest: Contest; registeredCount: number } | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [actionError, setActionError] = useState("");
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    const contestData = await api.get<{ contest: Contest; registeredCount: number }>(`/contests/${id}`);
    setData(contestData);

    if (isAuthenticated && user?.role === "participant") {
      const [p, sub] = await Promise.all([
        api.get<{ participation: Participation | null }>(`/contests/${id}/participation`),
        api.get<{ submission: Submission | null }>(`/contests/${id}/submissions/mine`),
      ]);
      setParticipation(p.participation);
      setSubmission(sub.submission);
    }
  }, [id, isAuthenticated, user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async () => {
    setJoining(true);
    setActionError("");
    try {
      await api.post(`/contests/${id}/join`);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Could not join contest.");
    } finally {
      setJoining(false);
    }
  };

  if (!data) return <p className="font-mono text-sm text-ink-muted">Loading…</p>;

  const { contest, registeredCount } = data;
  const now = new Date();
  const isParticipant = user?.role === "participant";
  const isJudgeOnContest =
    user?.role === "judge" &&
    contest.judges.some((j) => {
      const judgeId = typeof j.judge === "string" ? j.judge : j.judge._id;
      return judgeId === user.id && j.active;
    });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{contest.theme}</p>
          <h1 className="mt-1 font-display text-4xl text-ink">{contest.title}</h1>
        </div>
        <StatusBadge status={contest.status} />
      </div>

      {contest.status === "cancelled" && (
        <p className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-text">
          This contest was cancelled. {contest.cancelReason}
        </p>
      )}

      <Card className="mt-8">
        <dl className="grid grid-cols-2 gap-6 font-mono text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Registration closes</dt>
            <dd className="mt-1 text-ink">{formatDate(contest.registrationDeadline)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Submission deadline</dt>
            <dd className="mt-1 text-ink">{formatDate(contest.submissionDeadline)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Registered</dt>
            <dd className="mt-1 text-ink">{registeredCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-muted">Judges</dt>
            <dd className="mt-1 text-ink">{contest.judges.filter((j) => j.active).length}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-hairline pt-6">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Scoring criteria</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {contest.scoringCriteria.map((c) => (
              <span
                key={c.name}
                className="rounded-full border border-hairline px-3 py-1 font-mono text-xs text-ink"
              >
                {c.name} · {c.maxPoints} pts
              </span>
            ))}
          </div>
        </div>
      </Card>

      {isParticipant && (
        <>
          <FrameDivider label="Your entry" />
          <Card>
            {!participation ? (
              contest.status === "registration_open" && now < new Date(contest.registrationDeadline) ? (
                <div>
                  <p className="text-sm text-ink-muted">You're not registered for this contest yet.</p>
                  {actionError && <p className="mt-2 text-sm text-accent-text">{actionError}</p>}
                  <Button onClick={handleJoin} loading={joining} className="mt-4">
                    Join contest
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Registration isn't open for this contest.</p>
              )
            ) : (
              <div>
                <p className="text-ink">
                  {submission
                    ? `Submitted: "${submission.title}"`
                    : RESULT_LABEL[participation.result]}
                </p>
                {!submission && contest.status === "submissions_open" && (
                  <Link href={`/contests/${id}/submit`}>
                    <Button variant="secondary" className="mt-2">
                      Submit your photo
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {isJudgeOnContest && (
        <>
          <FrameDivider label="Judging" />
          <Card>
            {contest.status === "submissions_closed" ? (
              <Link href={`/judge/contests/${id}`}>
                <Button>Score submissions</Button>
              </Link>
            ) : (
              <p className="text-sm text-ink-muted">Not currently open for judging.</p>
            )}
          </Card>
        </>
      )}

      {user?.role === "admin" && (
        <>
          <FrameDivider label="Admin" />
          <Card>
            <Link href={`/admin/contests/${id}`}>
              <Button>Manage this contest</Button>
            </Link>
          </Card>
        </>
      )}

      {contest.status === "completed" && (
        <p className="mt-8 text-center">
          <Link href={`/contests/${id}/leaderboard`} className="text-sm text-accent-text hover:underline">
            View leaderboard
          </Link>
        </p>
      )}
    </div>
  );
}
