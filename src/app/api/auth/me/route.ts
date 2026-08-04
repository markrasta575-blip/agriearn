import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
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
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: true, data: { user: null } });
  }
  return NextResponse.json({ ok: true, data: { user: toPublic(user) } });
}
