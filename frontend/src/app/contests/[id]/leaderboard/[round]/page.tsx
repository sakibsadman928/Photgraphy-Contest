"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { Submission } from "@/types";
import Card from "@/components/ui/Card";
import FrameDivider from "@/components/ui/FrameDivider";

interface LeaderboardEntry {
  rank: number;
  submission: Submission;
}

const AWARD_LABEL: Record<number, string> = { 1: "🏆 1st", 2: "🥈 2nd", 3: "🥉 3rd" };

export default function LeaderboardPage() {
  const { id, round } = useParams<{ id: string; round: string }>();
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ leaderboard: LeaderboardEntry[] }>(`/contests/${id}/leaderboard/${round}`)
      .then((data) => setEntries(data.leaderboard))
      .catch((err) =>
        setError(err instanceof ApiClientError ? err.message : "Could not load the leaderboard.")
      );
  }, [id, round]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink capitalize">
        {round === "final" ? "Final" : "Round 1"} Leaderboard
      </h1>
      <FrameDivider />

      {error && <p className="text-sm text-accent">{error}</p>}

      {!entries && !error && <p className="font-mono text-sm text-ink-muted">Loading…</p>}

      {entries && entries.length === 0 && (
        <p className="text-ink-muted">No submissions were scored in this round.</p>
      )}

      {entries && entries.length > 0 && (
        <div className="flex flex-col gap-3">
          {entries.map(({ rank, submission }) => {
            const participant =
              typeof submission.participant === "object" ? submission.participant : null;
            return (
              <Card key={submission._id} className="flex items-center gap-4">
                <span className="w-12 shrink-0 font-mono text-lg text-ink-muted">
                  {round === "final" && AWARD_LABEL[rank] ? AWARD_LABEL[rank] : `#${rank}`}
                </span>
                <div className="flex-1">
                  <p className="text-ink">{submission.title}</p>
                  <p className="text-xs text-ink-muted">
                    {participant?.name ?? "Participant"}
                    {participant?.country ? ` · ${participant.country}` : ""}
                  </p>
                </div>
                <span className="font-mono text-lg text-ink">
                  {submission.averageScore?.toFixed(1) ?? "—"}
                </span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
