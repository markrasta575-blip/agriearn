// Admin users: list and update status/role.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
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

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      data: { users: users.map(toPublic) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "User id is required" },
        { status: 400 }
      );
    }
    const data: { status?: string; role?: string } = {};
    if (body.status === "ACTIVE" || body.status === "SUSPENDED") {
      data.status = body.status;
    }
    if (body.role === "USER" || body.role === "ADMIN") {
      data.role = body.role;
    }

    const user = await db.user.update({ where: { id }, data });
    return NextResponse.json({ ok: true, data: { user: toPublic(user) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
