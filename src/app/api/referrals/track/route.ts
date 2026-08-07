// Referral tracking API.
//
// GET  /api/referrals/track -> { ok, data: { code: <pending code | null> } }
//   Reads the "pending_ref" cookie set by POST (or by a /?ref=CODE landing).
//
// POST /api/referrals/track body { code } -> { ok, data: { code } }
//   Validates + stores the code in an httpOnly cookie (30 days). The register
//   route reads this cookie as a fallback when the body has no referralCode.
//
// The cookie is httpOnly (not readable by client JS) — the only consumer is
// the server-side register route, which reads it via cookies().get(...).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "pending_ref";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length === 0 || trimmed.length > 12) return null;
  // Letters + digits only (matches our code alphabet, but lenient enough for
  // legacy codes too).
  if (!/^[A-Z0-9]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function GET() {
  try {
    const store = await cookies();
    const code = store.get(COOKIE_NAME)?.value ?? null;
    return NextResponse.json({
      ok: true,
      data: { code: code && code.length > 0 ? code : null },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = normalizeCode(body?.code);
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Invalid referral code (max 12 chars, A-Z0-9)" },
        { status: 400 }
      );
    }

    const store = await cookies();
    store.set(COOKIE_NAME, code, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });

    return NextResponse.json({ ok: true, data: { code } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
