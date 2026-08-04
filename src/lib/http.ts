// HTTP helpers shared by API route handlers.
import { NextResponse } from "next/server";
import { mapError } from "@/lib/validators";

/**
 * Map an error thrown inside a route handler to a {status, message} pair.
 * Auth sentinels (UNAUTHORIZED / FORBIDDEN / SUSPENDED) thrown by
 * src/lib/session.ts are converted to 401 / 403. Prisma unique violation
 * (P2002) becomes 409, not-found (P2025) becomes 404, anything else 500.
 */
export function handleError(err: unknown): { status: number; message: string } {
  return mapError(err);
}

/**
 * Wrap an async route handler. Any thrown Error is mapped to a JSON response
 * with an appropriate status code. Auth sentinels (UNAUTHORIZED / FORBIDDEN /
 * SUSPENDED) thrown by src/lib/session.ts are converted to 401 / 403.
 */
export function withHandler<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await fn(...args);
    } catch (err) {
      const { status, message } = mapError(err);
      return NextResponse.json({ ok: false, error: message }, { status });
    }
  };
}

export function ok<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function fail(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
