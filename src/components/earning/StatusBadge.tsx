"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tone = "gold" | "green" | "amber" | "red" | "blue" | "muted";

const toneClasses: Record<Tone, string> = {
  gold: "bg-gold-gradient text-primary-foreground border-transparent",
  green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  red: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
  blue: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  label,
  tone = "muted",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        toneClasses[tone],
        className
      )}
    >
      {label}
    </Badge>
  );
}

export function purchaseStatusTone(
  status: string
): Tone {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "PENDING_APPROVAL":
      return "amber";
    case "REJECTED":
      return "red";
    case "COMPLETED":
      return "gold";
    default:
      return "muted";
  }
}

export function withdrawalStatusTone(status: string): Tone {
  switch (status) {
    case "APPROVED":
      return "green";
    case "PENDING":
      return "amber";
    case "REJECTED":
      return "red";
    default:
      return "muted";
  }
}

export function transactionStatusTone(status: string): Tone {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "PENDING":
      return "amber";
    case "FAILED":
      return "red";
    case "REJECTED":
      return "red";
    default:
      return "muted";
  }
}
