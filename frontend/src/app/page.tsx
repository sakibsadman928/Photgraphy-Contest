"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";
import { Contest } from "@/types";
import ContestCard from "@/components/ContestCard";
import FrameDivider from "@/components/ui/FrameDivider";
import Button from "@/components/ui/Button";

// Drop real photo URLs in here (e.g. Cloudinary URLs of standout submissions).
// Empty slots render a placeholder tile instead of breaking the layout.
const HERO_IMAGES: string[] = ["", "", "", "", "", "", "", "", ""];

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
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent-text font-medium">
            Photography Competition Platform
          </p>
          <h1 className="mt-4 max-w-xl font-display font-extrabold text-5xl leading-[1.05] text-ink">
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
          {HERO_IMAGES.map((src, i) =>
            src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                className="aspect-square rounded-xl border border-hairline object-cover shadow-sm"
              />
            ) : (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-hairline bg-paper"
              >
                <Camera size={20} className="text-ink-muted/40" />
              </div>
            )
          )}
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

