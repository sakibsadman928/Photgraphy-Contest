"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ContestParticipation } from "@/types";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import RequireRole from "@/components/RequireRole";

function DashboardContent() {
  const [participations, setParticipations] = useState<ContestParticipation[] | null>(null);

  useEffect(() => {
    api
      .get<{ participations: ContestParticipation[] }>("/dashboard/participant")
      .then((data) => setParticipations(data.participations))
      .catch(() => setParticipations([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Your contests</h1>

      <div className="mt-6 flex flex-col gap-3">
        {participations === null && <p className="font-mono text-sm text-ink-muted">Loading…</p>}

        {participations?.length === 0 && (
          <Card>
            <p className="text-ink-muted">
              You haven't entered any contests yet.{" "}
              <Link href="/contests" className="text-accent hover:underline">
                Browse open contests
              </Link>
              .
            </p>
          </Card>
        )}

        {participations?.map((p) => (
          <Link key={p._id} href={`/contests/${p.contest._id}`}>
            <Card className="flex items-center justify-between transition-colors hover:border-ink">
              <div>
                <p className="font-display text-lg text-ink">{p.contest.title}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  Round 1: {p.round1Result.replace("_", " ")}
                  {p.finalResult !== "not_applicable" && ` · Final: ${p.finalResult.replace("_", " ")}`}
                </p>
              </div>
              <StatusBadge status={p.contest.status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ParticipantDashboardPage() {
  return (
    <RequireRole allow={["participant"]}>
      <DashboardContent />
    </RequireRole>
  );
}
