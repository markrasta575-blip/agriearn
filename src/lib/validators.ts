// Input validation helpers shared by API route handlers.

/**
 * Strip spaces and validate a phone number.
 * Returns the cleaned digits string if valid (9-15 digits), otherwise null.
 */
export function validatePhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/\s+/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  if (cleaned.length < 9 || cleaned.length > 15) return null;
  return cleaned;
}

/**
 * Validate a positive monetary amount.
 * Accepts numbers or numeric strings. Returns the parsed number (>0) or null.
 */
export function validateAmount(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Map an error thrown inside a route handler to a HTTP status + message.
 * Recognises the auth sentinels thrown by src/lib/session.ts and a few
 * Prisma known-error codes (e.g. P2002 unique violation).
 */
export function mapError(err: unknown): { status: number; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  switch (msg) {
    case "UNAUTHORIZED":
      return { status: 401, message: "Authentication required" };
    case "FORBIDDEN":
      return { status: 403, message: "Admin access required" };
    case "SUSPENDED":
      return { status: 403, message: "Account suspended" };
  }
  // Prisma error code lives on err.code
  const code = (err as { code?: string } | null)?.code;
  if (code === "P2002") {
    return { status: 409, message: "Resource already exists" };
  }
  if (code === "P2025") {
    return { status: 404, message: "Resource not found" };
  }
  return { status: 500, message: msg || "Internal server error" };
}
