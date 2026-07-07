import { ContestStatus } from "@/types";

const STATUS_CONFIG: Record<ContestStatus, { label: string; classes: string }> = {
  draft: { label: "Draft", classes: "bg-paper text-ink-muted border-hairline" },
  registration_open: { label: "Registration Open", classes: "bg-teal-light text-teal border-teal/30" },
  registration_closed: { label: "Registration Closed", classes: "bg-amber-light text-amber border-amber/30" },
  cancelled: { label: "Cancelled", classes: "bg-accent/10 text-accent border-accent/30" },
  round1_open: { label: "Round 1 · Open", classes: "bg-teal-light text-teal border-teal/30" },
  round1_closed: { label: "Round 1 · Judging", classes: "bg-amber-light text-amber border-amber/30" },
  round1_results_published: { label: "Round 1 · Results Published", classes: "bg-teal-light text-teal border-teal/30" },
  final_open: { label: "Final · Open", classes: "bg-teal-light text-teal border-teal/30" },
  final_closed: { label: "Final · Judging", classes: "bg-amber-light text-amber border-amber/30" },
  completed: { label: "Completed", classes: "bg-ink text-white border-ink" },
};

export default function StatusBadge({ status }: { status: ContestStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-mono uppercase tracking-wide ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
