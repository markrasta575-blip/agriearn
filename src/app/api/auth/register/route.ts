import { NextResponse } from "next/server";
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

    await createSession(user.id);
    return NextResponse.json({ ok: true, data: { user: toPublic(user) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
