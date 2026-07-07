import Link from "next/link";
import { Contest } from "@/types";
import StatusBadge from "./ui/StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ContestCard({ contest }: { contest: Contest }) {
  return (
    <Link
      href={`/contests/${contest._id}`}
      className="group block overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm transition-all hover:-translate-y-1 hover:shadow-glow hover:border-accent/40"
    >
      {/* Frame "sprocket" edge, evoking a negative strip frame */}
      <div className="flex items-center justify-between border-b border-hairline bg-paper px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {contest.theme}
        </span>
        <StatusBadge status={contest.status} />
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl text-ink group-hover:text-accent">{contest.title}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs text-ink-muted">
          <div>
            <dt className="uppercase tracking-wide">Registration closes</dt>
            <dd className="mt-0.5 text-ink">{formatDate(contest.registrationDeadline)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide">Finalists</dt>
            <dd className="mt-0.5 text-ink">{contest.finalistsPercentage}% advance</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
