"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Contest, ContestStatus } from "@/types";
import ContestCard from "@/components/ContestCard";

const FILTERS: { label: string; value: ContestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Registration Open", value: "registration_open" },
  { label: "Round 1", value: "round1_open" },
  { label: "Final", value: "final_open" },
  { label: "Completed", value: "completed" },
];

export default function BrowseContestsPage() {
  const [contests, setContests] = useState<Contest[] | null>(null);
  const [filter, setFilter] = useState<ContestStatus | "all">("all");

  useEffect(() => {
    const query = filter === "all" ? "" : `?status=${filter}`;
    setContests(null);
    api
      .get<{ contests: Contest[] }>(`/contests${query}`)
      .then((data) => setContests(data.contests))
      .catch(() => setContests([]));
  }, [filter]);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Contests</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors ${
              filter === f.value
                ? "border-accent bg-accent text-ink"
                : "border-hairline text-ink-muted hover:border-accent hover:text-accent-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {contests === null ? (
          <p className="font-mono text-sm text-ink-muted">Loading…</p>
        ) : contests.length === 0 ? (
          <p className="text-ink-muted">No contests match this filter yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {contests.map((c) => (
              <ContestCard key={c._id} contest={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
