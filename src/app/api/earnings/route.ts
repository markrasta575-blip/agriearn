// Earnings list (runs accrual first).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import { accrueForUser } from "@/lib/earnings";
import type { EarningPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(e: {
  id: string;
  userId: string;
  purchaseId: string;
  amount: number;
  date: Date;
  createdAt: Date;
  purchase?: { name: string } | null;
}): EarningPublic {
  return {
    id: e.id,
    userId: e.userId,
    purchaseId: e.purchaseId,
    productName: e.purchase?.name ?? "",
    amount: e.amount,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await accrueForUser(user.id);

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(500, Math.max(1, Number(limitParam) || 50));

    const earnings = await db.earning.findMany({
      where: { userId: user.id },
      include: { purchase: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: limit,
    });
    return NextResponse.json({
      ok: true,
      data: { earnings: earnings.map(toPublic) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
