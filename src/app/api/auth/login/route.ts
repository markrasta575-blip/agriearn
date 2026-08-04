import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/crypto";
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

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Valid phone number is required" },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { ok: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid phone or password" },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { ok: false, error: "Account suspended. Contact support." },
        { status: 403 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, data: { user: toPublic(user) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
