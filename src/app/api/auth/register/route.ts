import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/session";
import { validatePhone } from "@/lib/validators";
import { handleError } from "@/lib/http";
import type { UserPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(user: {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  balance: number;
  status: string;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role as "USER" | "ADMIN",
    balance: user.balance,
    status: user.status as "ACTIVE" | "SUSPENDED",
    createdAt: user.createdAt.toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = validatePhone(body?.phone);
    const password = typeof body?.password === "string" ? body.password : "";
    const name =
      typeof body?.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : null;

    // Optional referral code: prefer the body, fall back to the pending_ref
    // cookie set by /api/referrals/track (so visitors who clicked a /?ref=
    // CODE link and later register still get attached to the referrer).
    const bodyCode =
      typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
    const cookieCode = (await cookies()).get("pending_ref")?.value ?? "";
    const referralCode =
      bodyCode && bodyCode.length > 0 && bodyCode.length <= 12
        ? bodyCode.toUpperCase()
        : cookieCode && cookieCode.length > 0 && cookieCode.length <= 12
          ? cookieCode.toUpperCase()
          : null;

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Valid phone number is required (9-15 digits)" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Phone number already registered" },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        phone,
        password: await hashPassword(password),
        name,
        role: "USER",
        status: "ACTIVE",
        balance: 0,
      },
    });

    // Attach a referrer (if a valid referralCode was provided and it points
    // to a different user). Self-referral is impossible at registration time
    // (the user didn't exist yet) but the guard is here for safety.
    if (referralCode) {
      try {
        const referrer = await db.user.findUnique({
          where: { referralCode },
          select: { id: true },
        });
        if (referrer && referrer.id !== user.id) {
          try {
            await db.referral.create({
              data: {
                referrerId: referrer.id,
                referredId: user.id,
                referralCode,
                status: "PENDING",
              },
            });
            // Log a history event on the referrer's side.
            await db.referralHistory
              .create({
                data: {
                  userId: referrer.id,
                  event: "REFERRED_REGISTERED",
                  amount: 0,
                  relatedId: user.id,
                },
              })
              .catch(() => {});
          } catch (createErr) {
            const code = (createErr as { code?: string } | null)?.code;
            // P2002 = this user already has a referrer row -> ignore.
            if (code !== "P2002") {
              console.error(
                "[register] failed to create Referral row (non-fatal):",
                createErr
              );
            }
          }
        }
      } catch (findErr) {
        // A bad/expired code should NEVER break registration.
        console.error(
          "[register] referral lookup failed (non-fatal):",
          findErr
        );
      }
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, data: { user: toPublic(user) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
