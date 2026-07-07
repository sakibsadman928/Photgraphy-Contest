"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { Contest } from "@/types";
import RequireRole from "@/components/RequireRole";

interface JudgeSubmission {
  id: string;
  title: string;
  description?: string;
  photoUrl: string;
  alreadyScored: boolean;
}

function ScoringScreen() {
  const { id, round } = useParams<{ id: string; round: string }>();
  const [contest, setContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<JudgeSubmission[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    const [contestData, subsData] = await Promise.all([
      api.get<{ contest: Contest }>(`/contests/${id}`),
      api.get<{ submissions: JudgeSubmission[] }>(`/contests/${id}/submissions/${round}/to-judge`),
    ]);
    setContest(contestData.contest);
    setSubmissions(subsData.submissions);
    const firstPending = subsData.submissions.find((s) => !s.alreadyScored);
    setSelectedId(firstPending?.id ?? subsData.submissions[0]?.id ?? null);
  }, [id, round]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Reset the form's local score state whenever the selected submission changes.
    if (!contest) return;
    const defaults: Record<string, number> = {};
    contest.scoringCriteria.forEach((c) => (defaults[c.name] = 0));
    setScores(defaults);
    setComments("");
  }, [selectedId, contest]);

  const handleScoreChange = (name: string, value: number) => {
    setScores((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitScore = async () => {
    if (!selectedId || !contest) return;
    setSaving(true);
    setError("");
    try {
      const criteriaScores = contest.scoringCriteria.map((c) => ({ name: c.name, score: scores[c.name] ?? 0 }));
      await api.post("/scores", { submissionId: selectedId, criteriaScores, comments });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);

      const updated = submissions!.map((s) => (s.id === selectedId ? { ...s, alreadyScored: true } : s));
      setSubmissions(updated);
      const nextPending = updated.find((s) => !s.alreadyScored);
      setSelectedId(nextPending?.id ?? selectedId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save this score.");
    } finally {
      setSaving(false);
    }
  };

  if (!contest || !submissions) {
    return (
      <div className="min-h-screen bg-darkroom text-darkroom-ink flex items-center justify-center font-mono text-sm">
        Loading submissions…
      </div>
    );
  }

  const selected = submissions.find((s) => s.id === selectedId);
  const scoredCount = submissions.filter((s) => s.alreadyScored).length;

  return (
    <div className="-mx-6 -my-10 min-h-screen bg-darkroom px-6 py-10 text-darkroom-ink">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline justify-between border-b border-darkroom-hairline pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-safelight">
              {round === "final" ? "Final" : "Round 1"} · Blind review
            </p>
            <h1 className="mt-1 font-display text-2xl text-darkroom-ink">{contest.title}</h1>
          </div>
          <p className="font-mono text-sm text-darkroom-ink-muted">
            {scoredCount} / {submissions.length} scored
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[100px_1fr_320px]">
          {/* Film-strip frame selector */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {submissions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left font-mono text-xs transition-colors ${
                  s.id === selectedId
                    ? "border-safelight text-safelight"
                    : s.alreadyScored
                    ? "border-darkroom-hairline text-darkroom-ink-muted"
                    : "border-darkroom-hairline text-darkroom-ink hover:border-darkroom-ink"
                }`}
              >
                #{String(i + 1).padStart(2, "0")}
                {s.alreadyScored && <span className="ml-1 text-teal">✓</span>}
              </button>
            ))}
          </div>

          {/* Photo viewer */}
          <div className="flex flex-col items-center">
            {selected && (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.photoUrl}
                  alt="Submission under review — participant identity withheld"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
            {selected && (
              <div className="mt-4 w-full">
                <h2 className="font-display text-xl text-darkroom-ink">{selected.title}</h2>
                {selected.description && (
                  <p className="mt-1 text-sm text-darkroom-ink-muted">{selected.description}</p>
                )}
              </div>
            )}
          </div>

          {/* Scoring panel */}
          {selected && (
            <div className="rounded-xl border border-darkroom-hairline bg-darkroom-surface p-5">
              <p className="font-mono text-xs uppercase tracking-wide text-darkroom-ink-muted">Score</p>
              <div className="mt-4 flex flex-col gap-4">
                {contest.scoringCriteria.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-sm">
                      <label htmlFor={c.name} className="text-darkroom-ink">
                        {c.name}
                      </label>
                      <span className="font-mono text-safelight">
                        {scores[c.name] ?? 0} / {c.maxPoints}
                      </span>
                    </div>
                    <input
                      id={c.name}
                      type="range"
                      min={0}
                      max={c.maxPoints}
                      value={scores[c.name] ?? 0}
                      onChange={(e) => handleScoreChange(c.name, Number(e.target.value))}
                      className="mt-1.5 w-full accent-safelight"
                    />
                  </div>
                ))}
              </div>

              <label htmlFor="comments" className="mt-5 block font-mono text-xs uppercase tracking-wide text-darkroom-ink-muted">
                Comments
              </label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-darkroom-hairline bg-darkroom px-3 py-2 text-sm text-darkroom-ink placeholder:text-darkroom-ink-muted focus:outline-none focus:border-safelight"
                placeholder="Optional feedback for the participant…"
              />

              {error && <p className="mt-3 text-sm text-accent">{error}</p>}
              {savedFlash && <p className="mt-3 text-sm text-teal">Score saved.</p>}

              <button
                onClick={handleSubmitScore}
                disabled={saving}
                className="mt-4 w-full rounded-xl bg-safelight px-4 py-2.5 text-sm font-medium text-darkroom transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : selected.alreadyScored ? "Update score" : "Save score"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JudgeScoringPage() {
  return (
    <RequireRole allow={["judge"]}>
      <ScoringScreen />
    </RequireRole>
  );
}
