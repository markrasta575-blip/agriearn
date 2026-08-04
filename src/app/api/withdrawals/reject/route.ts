// Reject a pending withdrawal (admin). Refunds the reserved balance.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
import type { WithdrawalPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(w: {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  status: string;
  processedAt: Date | null;
  createdAt: Date;
}): WithdrawalPublic {
  return {
    id: w.id,
    userId: w.userId,
    amount: w.amount,
    bankName: w.bankName,
    accountHolder: w.accountHolder,
    accountNumber: w.accountNumber,
    status: w.status as WithdrawalPublic["status"],
    processedAt: w.processedAt ? w.processedAt.toISOString() : null,
    createdAt: w.createdAt.toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Withdrawal id is required" },
        { status: 400 }
      );
    }

    const existing = await db.withdrawal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Withdrawal not found" },
        { status: 404 }
      );
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { ok: false, error: "Withdrawal is not pending" },
        { status: 400 }
      );
    }

    await db.$transaction([
      db.withdrawal.update({
        where: { id },
        data: { status: "REJECTED", processedAt: new Date() },
      }),
      db.user.update({
        where: { id: existing.userId },
        data: { balance: { increment: existing.amount } },
      }),
      db.transaction.updateMany({
        where: { referenceId: id, type: "WITHDRAWAL" },
        data: { status: "REJECTED" },
      }),
    ]);

    const withdrawal = await db.withdrawal.findUnique({ where: { id } });
    return NextResponse.json({
      ok: true,
      data: { withdrawal: toPublic(withdrawal!) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
