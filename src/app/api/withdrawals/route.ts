// Withdrawal list + create.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/session";
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";

    if (all) {
      await requireAdmin();
      const withdrawals = await db.withdrawal.findMany({
        include: { user: { select: { phone: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        ok: true,
        data: { withdrawals: withdrawals.map(toPublic) },
      });
    }

    const user = await requireUser();
    const withdrawals = await db.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      data: { withdrawals: withdrawals.map(toPublic) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = Number(body.amount);
    const bankName =
      typeof body.bankName === "string" ? body.bankName.trim() : "";
    const accountHolder =
      typeof body.accountHolder === "string" ? body.accountHolder.trim() : "";
    const accountNumber =
      typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";

    if (!Number.isFinite(amount) || amount < 300) {
      return NextResponse.json(
        { ok: false, error: "Minimum withdrawal is 300 ETB" },
        { status: 400 }
      );
    }
    if (amount > user.balance) {
      return NextResponse.json(
        { ok: false, error: "Insufficient balance" },
        { status: 400 }
      );
    }
    if (!bankName || !accountHolder || !accountNumber) {
      return NextResponse.json(
        { ok: false, error: "Bank details are required" },
        { status: 400 }
      );
    }

    const withdrawal = await db.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          bankName,
          accountHolder,
          accountNumber,
          status: "PENDING",
        },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          amount,
          status: "PENDING",
          referenceId: w.id,
          description: "Withdrawal request",
        },
      });
      return w;
    });

    return NextResponse.json({ ok: true, data: { withdrawal: toPublic(withdrawal) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
