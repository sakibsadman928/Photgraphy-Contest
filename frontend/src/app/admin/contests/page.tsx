"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Contest } from "@/types";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/RequireRole";

function ContestsContent() {
  const [contests, setContests] = useState<Contest[] | null>(null);

  useEffect(() => {
    api.get<{ contests: Contest[] }>("/contests").then((data) => setContests(data.contests));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">All contests</h1>
        <Link href="/admin/contests/new">
          <Button>Create contest</Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {contests === null && <p className="font-mono text-sm text-ink-muted">Loading…</p>}
        {contests?.map((c) => (
          <Link key={c._id} href={`/admin/contests/${c._id}`}>
            <Card className="flex items-center justify-between transition-colors hover:border-ink">
              <div>
                <p className="font-display text-lg text-ink">{c.title}</p>
                <p className="font-mono text-xs text-ink-muted">{c.theme}</p>
              </div>
              <StatusBadge status={c.status} />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminContestsPage() {
  return (
    <RequireRole allow={["admin"]}>
      <ContestsContent />
    </RequireRole>
  );
}
