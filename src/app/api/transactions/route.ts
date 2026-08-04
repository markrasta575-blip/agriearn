// Transactions list (current user).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import type { TransactionPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(t: {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  referenceId: string | null;
  createdAt: Date;
}): TransactionPublic {
  return {
    id: t.id,
    userId: t.userId,
    type: t.type as TransactionPublic["type"],
    amount: t.amount,
    status: t.status as TransactionPublic["status"],
    description: t.description,
    referenceId: t.referenceId,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(500, Math.max(1, Number(limitParam) || 100));

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({
      ok: true,
      data: { transactions: transactions.map(toPublic) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
