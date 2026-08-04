// Formatting helpers for the Earning Platform.
// ETB currency + readable dates.

export function formatETB(amount: number | null | undefined): string {
  const value = typeof amount === "number" && isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
  return `${formatted} ETB`;
}

export function formatNumber(value: number | null | undefined): string {
  const v = typeof value === "number" && isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-US").format(v);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskAccountNumber(account: string | null | undefined): string {
  if (!account) return "—";
  const trimmed = account.trim();
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return `${"•".repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

export function shortDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
