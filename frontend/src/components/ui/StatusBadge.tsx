import { ContestStatus } from "@/types";

const STATUS_CONFIG: Record<ContestStatus, { label: string; classes: string }> =
  {
    draft: {
      label: "Draft",
      classes: "bg-paper text-ink-muted border-hairline",
    },
    registration_open: {
      label: "Registration Open",
      classes: "bg-teal-light text-teal border-teal/30",
    },
    registration_closed: {
      label: "Registration Closed",
      classes: "bg-amber-light text-amber border-amber/30",
    },
    cancelled: {
      label: "Cancelled",
      classes: "bg-ink/5 text-ink-muted border-ink/20",
    },
    submissions_open: {
      label: "Submissions Open",
      classes: "bg-teal-light text-teal border-teal/30",
    },
    submissions_closed: {
      label: "Judging",
      classes: "bg-amber-light text-amber border-amber/30",
    },
    completed: {
      label: "Completed",
      classes: "bg-accent text-ink border-accent",
    },
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
