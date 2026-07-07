"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { Contest, JudgingProgress } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import FrameDivider from "@/components/ui/FrameDivider";
import RequireRole from "@/components/RequireRole";

interface Judge {
  _id: string;
  name: string;
  email: string;
}

interface SubmissionRow {
  _id: string;
  title: string;
  averageScore: number | null;
  tieStatus: "none" | "pending" | "resolved";
  participant: { _id: string; name: string; email: string; country?: string };
}

const NEXT_ACTION: Partial<Record<Contest["status"], { label: string; endpoint: string; method: "post" }>> = {
  draft: { label: "Publish contest", endpoint: "publish", method: "post" },
  registration_open: { label: "Close registration", endpoint: "close-registration", method: "post" },
  registration_closed: { label: "Open Round 1", endpoint: "round1/open", method: "post" },
  round1_open: { label: "Close Round 1", endpoint: "round1/close", method: "post" },
  round1_results_published: { label: "Open Final", endpoint: "final/open", method: "post" },
  final_open: { label: "Close Final", endpoint: "final/close", method: "post" },
};

function ManageContestContent() {
  const { id } = useParams<{ id: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [progress, setProgress] = useState<JudgingProgress | null>(null);
  const [tiedSubmissions, setTiedSubmissions] = useState<SubmissionRow[] | null>(null);
  const [tieWinnerId, setTieWinnerId] = useState<string>("");
  const [allJudges, setAllJudges] = useState<Judge[]>([]);
  const [addJudgeId, setAddJudgeId] = useState("");
  const [replacingJudgeId, setReplacingJudgeId] = useState<string | null>(null);
  const [replacementJudgeId, setReplacementJudgeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const currentRound: "round1" | "final" | null =
    contest?.status === "round1_closed" ? "round1" : contest?.status === "final_closed" ? "final" : null;

  const load = useCallback(async () => {
    const data = await api.get<{ contest: Contest; registeredCount: number }>(`/contests/${id}`);
    setContest(data.contest);
    setRegisteredCount(data.registeredCount);

    const round = data.contest.status === "round1_closed" ? "round1" : data.contest.status === "final_closed" ? "final" : null;
    if (round) {
      const progressData = await api.get<JudgingProgress>(`/contests/${id}/${round}/progress`);
      setProgress(progressData);
    } else {
      setProgress(null);
    }

    const judgesData = await api.get<{ judges: Judge[] }>("/judges");
    setAllJudges(judgesData.judges);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (endpoint: string, method: "post" = "post", body?: unknown) => {
    setBusy(true);
    setMessage(null);
    try {
      const fn = method === "post" ? api.post : api.post;
      await fn(`/contests/${id}/${endpoint}`, body);
      setMessage({ type: "success", text: "Done." });
      setTiedSubmissions(null);
      await load();
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 409 && (err.details as any)?.tiedSubmissionIds) {
        const ids: string[] = (err.details as any).tiedSubmissionIds;
        const round = currentRound ?? "round1";
        const allSubs = await api.get<{ submissions: SubmissionRow[] }>(`/contests/${id}/submissions/${round}/all`);
        setTiedSubmissions(allSubs.submissions.filter((s) => ids.includes(s._id)));
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "Action failed." });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResolveTie = async () => {
    if (!tiedSubmissions || !tieWinnerId || !currentRound) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.post(`/contests/${id}/${currentRound}/resolve-tie`, {
        submissionIds: tiedSubmissions.map((s) => s._id),
        winnerSubmissionId: tieWinnerId,
      });
      setTiedSubmissions(null);
      setTieWinnerId("");
      setMessage({ type: "success", text: "Tie resolved. You can try publishing again." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiClientError ? err.message : "Could not resolve tie." });
    } finally {
      setBusy(false);
    }
  };

  const handleAddJudge = async () => {
    if (!addJudgeId) return;
    await runAction("judges", "post", { judgeId: addJudgeId });
    setAddJudgeId("");
  };

  const handleReplaceJudge = async (judgeId: string) => {
    if (!replacementJudgeId) return;
    await runAction(`judges/${judgeId}/replace`, "post", { newJudgeId: replacementJudgeId });
    setReplacingJudgeId(null);
    setReplacementJudgeId("");
  };

  if (!contest) return <p className="font-mono text-sm text-ink-muted">Loading…</p>;

  const nextAction = NEXT_ACTION[contest.status];
  const publishRoundAction =
    contest.status === "round1_closed"
      ? { label: "Publish Round 1 results", endpoint: "round1/publish-results" }
      : contest.status === "final_closed"
      ? { label: "Publish winners", endpoint: "final/publish-winners" }
      : null;

  const assignedJudgeIds = new Set(
    contest.judges.filter((j) => j.active).map((j) => (typeof j.judge === "string" ? j.judge : j.judge._id))
  );
  const availableJudgesToAdd = allJudges.filter((j) => !assignedJudgeIds.has(j._id));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">{contest.theme}</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{contest.title}</h1>
        </div>
        <StatusBadge status={contest.status} />
      </div>

      {message && (
        <p className={`mt-4 text-sm ${message.type === "error" ? "text-accent-text" : "text-teal"}`}>{message.text}</p>
      )}

      <FrameDivider label="Lifecycle" />
      <Card>
        <p className="text-sm text-ink-muted">
          Registered participants: <span className="font-mono text-ink">{registeredCount}</span>
        </p>

        {contest.status === "cancelled" && (
          <p className="mt-3 text-sm text-accent-text">Cancelled: {contest.cancelReason}</p>
        )}

        {progress && currentRound && (
          <div className="mt-4 border-t border-hairline pt-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              Judging progress ({currentRound === "round1" ? "Round 1" : "Final"})
            </p>
            <div className="mt-2 flex flex-col gap-1 font-mono text-sm">
              {progress.progress.map((p) => (
                <div key={p.judgeId} className="flex justify-between">
                  <span className="text-ink-muted">{p.judgeId}</span>
                  <span className={p.scoredCount === p.totalSubmissions ? "text-teal" : "text-amber"}>
                    {p.scoredCount} / {p.totalSubmissions}
                  </span>
                </div>
              ))}
            </div>
            {!progress.complete && (
              <p className="mt-2 text-xs text-amber">
                Publishing is blocked until every judge finishes. Replace an unresponsive judge below if needed.
              </p>
            )}
          </div>
        )}

        {tiedSubmissions && (
          <div className="mt-4 rounded-xl border border-amber/30 bg-amber-light p-4">
            <p className="text-sm font-medium text-ink">A tie needs your decision:</p>
            <div className="mt-2 flex flex-col gap-2">
              {tiedSubmissions.map((s) => (
                <label key={s._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tieWinner"
                    checked={tieWinnerId === s._id}
                    onChange={() => setTieWinnerId(s._id)}
                  />
                  {s.title} — {s.participant.name} ({s.participant.email})
                  <span className="font-mono text-ink-muted">avg {s.averageScore?.toFixed(1)}</span>
                </label>
              ))}
            </div>
            <Button onClick={handleResolveTie} loading={busy} disabled={!tieWinnerId} className="mt-3">
              Confirm winner
            </Button>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {nextAction && (
            <Button onClick={() => runAction(nextAction.endpoint)} loading={busy}>
              {nextAction.label}
            </Button>
          )}
          {publishRoundAction && (
            <Button onClick={() => runAction(publishRoundAction.endpoint)} loading={busy}>
              {publishRoundAction.label}
            </Button>
          )}
          {contest.status === "completed" && <p className="text-sm text-teal">Contest completed.</p>}
        </div>
      </Card>

      <FrameDivider label="Judges" />
      <Card>
        <div className="flex flex-col gap-2">
          {contest.judges.map((j, i) => {
            const judgeObj = typeof j.judge === "string" ? null : j.judge;
            return (
              <div key={i} className="flex items-center justify-between border-b border-hairline py-2 last:border-b-0">
                <div>
                  <p className={`text-sm ${j.active ? "text-ink" : "text-ink-muted line-through"}`}>
                    {judgeObj?.name ?? (typeof j.judge === "string" ? j.judge : "")}
                  </p>
                  {!j.active && <p className="text-xs text-ink-muted">Replaced</p>}
                </div>
                {j.active && !["completed", "cancelled"].includes(contest.status) && (
                  <div>
                    {replacingJudgeId === (judgeObj?._id ?? j.judge) ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={replacementJudgeId}
                          onChange={(e) => setReplacementJudgeId(e.target.value)}
                          className="rounded-xl border border-hairline px-2 py-1 text-sm"
                        >
                          <option value="">Choose replacement…</option>
                          {availableJudgesToAdd.map((aj) => (
                            <option key={aj._id} value={aj._id}>
                              {aj.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="secondary"
                          onClick={() => handleReplaceJudge(judgeObj?._id ?? (j.judge as string))}
                          loading={busy}
                        >
                          Confirm
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplacingJudgeId(judgeObj?._id ?? (j.judge as string))}
                        className="text-xs text-accent-text hover:underline"
                      >
                        Replace (unresponsive)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!["completed", "cancelled"].includes(contest.status) && availableJudgesToAdd.length > 0 && (
          <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-4">
            <select
              value={addJudgeId}
              onChange={(e) => setAddJudgeId(e.target.value)}
              className="flex-1 rounded-xl border border-hairline px-2 py-2 text-sm"
            >
              <option value="">Add a judge…</option>
              {availableJudgesToAdd.map((j) => (
                <option key={j._id} value={j._id}>
                  {j.name} ({j.email})
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={handleAddJudge} loading={busy}>
              Add
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ManageContestPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ManageContestContent />
    </RequireRole>
  );
}
