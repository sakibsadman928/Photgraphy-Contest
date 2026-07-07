"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Contest } from "@/types";
import ContestCard from "@/components/ContestCard";
import FrameDivider from "@/components/ui/FrameDivider";
import Button from "@/components/ui/Button";

const GRID_GRADIENTS = [
  "from-violet-500 to-fuchsia-500",
  "from-fuchsia-500 to-pink-400",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-rose-400",
  "from-violet-600 to-indigo-500",
  "from-teal-400 to-emerald-400",
  "from-orange-400 to-amber-300",
  "from-indigo-500 to-violet-400",
  "from-emerald-400 to-teal-300",
];

export default function HomePage() {
  const [contests, setContests] = useState<Contest[] | null>(null);

  useEffect(() => {
    api
      .get<{ contests: Contest[] }>("/contests?status=registration_open")
      .then((data) => setContests(data.contests))
      .catch(() => setContests([]));
  }, []);

  return (
    <div>
      <section className="grid gap-10 py-10 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent font-medium">
            Photography Competition Platform
          </p>
          <h1 className="mt-4 max-w-xl font-display font-extrabold text-5xl leading-[1.05] text-transparent bg-clip-text bg-brand-gradient">
            Every entry is a frame worth judging.
          </h1>
          <p className="mt-6 max-w-md text-ink-muted">
            Register, submit blind, and get scored on the merits — composition, light, and craft.
            Two rounds, one winner, no favoritism: judges never see who took the shot.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/contests">
              <Button variant="primary">Browse contests</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary">Create an account</Button>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {GRID_GRADIENTS.map((gradient, i) => (
            <div
              key={i}
              className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} shadow-sm`}
            />
          ))}
        </div>
      </section>

      <FrameDivider label="Open for registration" />

      {contests === null ? (
        <p className="font-mono text-sm text-ink-muted">Loading contests…</p>
      ) : contests.length === 0 ? (
        <p className="text-ink-muted">
          No contests are open for registration right now. Check back soon, or browse past contests.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {contests.map((c) => (
            <ContestCard key={c._id} contest={c} />
          ))}
        </div>
      )}
    </div>
  );
}
