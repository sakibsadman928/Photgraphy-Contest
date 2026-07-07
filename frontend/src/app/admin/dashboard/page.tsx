"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import RequireRole from "@/components/RequireRole";

interface Stats {
  totalContests: number;
  activeContests: number;
  totalParticipants: number;
  totalJudges: number;
  totalSubmissions: number;
}

function DashboardContent() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<{ stats: Stats }>("/dashboard/admin").then((data) => setStats(data.stats));
  }, []);

  const items: { label: string; value: number | string }[] = stats
    ? [
        { label: "Total contests", value: stats.totalContests },
        { label: "Active contests", value: stats.activeContests },
        { label: "Participants", value: stats.totalParticipants },
        { label: "Judges", value: stats.totalJudges },
        { label: "Submissions", value: stats.totalSubmissions },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Admin</h1>
        <div className="flex gap-3">
          <Link href="/admin/judges">
            <Button variant="secondary">Manage judges</Button>
          </Link>
          <Link href="/admin/contests/new">
            <Button>Create contest</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {stats === null
          ? Array.from({ length: 5 }).map((_, i) => <Card key={i} className="h-20 animate-pulse" />)
          : items.map((item) => (
              <Card key={item.label}>
                <p className="font-mono text-3xl text-ink">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-muted">{item.label}</p>
              </Card>
            ))}
      </div>

      <div className="mt-10">
        <Link href="/admin/contests" className="text-sm text-accent hover:underline">
          View all contests →
        </Link>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole allow={["admin"]}>
      <DashboardContent />
    </RequireRole>
  );
}
