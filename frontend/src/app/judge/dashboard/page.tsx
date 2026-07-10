"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Contest } from "@/types";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import RequireRole from "@/components/RequireRole";

interface DashboardEntry {
  contest: Contest;
  judging: boolean;
  pending: number;
  completed: number;
}

function DashboardContent() {
  const [entries, setEntries] = useState<DashboardEntry[] | null>(null);

  useEffect(() => {
    api
      .get<{ dashboard: DashboardEntry[] }>("/dashboard/judge")
      .then((data) => setEntries(data.dashboard))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Your assignments</h1>

      <div className="mt-6 flex flex-col gap-3">
        {entries === null && (
          <p className="font-mono text-sm text-ink-muted">Loading…</p>
        )}
        {entries?.length === 0 && (
          <Card>
            <p className="text-ink-muted">No contests assigned yet.</p>
          </Card>
        )}

        {entries?.map((e) => (
          <Card
            key={e.contest._id}
            className="flex items-center justify-between"
          >
            <div>
              <p className="font-display text-lg text-ink">{e.contest.title}</p>
              {e.judging ? (
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {e.completed} scored, {e.pending} pending
                </p>
              ) : (
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  Not currently open for judging
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={e.contest.status} />
              {e.judging && (
                <Link
                  href={`/judge/contests/${e.contest._id}`}
                  className="rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-hover"
                >
                  Score
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function JudgeDashboardPage() {
  return (
    <RequireRole allow={["judge"]}>
      <DashboardContent />
    </RequireRole>
  );
}
