// Bank accounts: list / create / delete (current user only).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import type { BankAccountPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(b: {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  createdAt: Date;
}): BankAccountPublic {
  return {
    id: b.id,
    userId: b.userId,
    bankName: b.bankName,
    accountHolder: b.accountHolder,
    accountNumber: b.accountNumber,
    createdAt: b.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const accounts = await db.bankAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      data: { accounts: accounts.map(toPublic) },
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
    const bankName =
      typeof body.bankName === "string" ? body.bankName.trim() : "";
    const accountHolder =
      typeof body.accountHolder === "string" ? body.accountHolder.trim() : "";
    const accountNumber =
      typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";

    if (!bankName || !accountHolder || !accountNumber) {
      return NextResponse.json(
        { ok: false, error: "All bank account fields are required" },
        { status: 400 }
      );
    }

    const account = await db.bankAccount.create({
      data: { userId: user.id, bankName, accountHolder, accountNumber },
    });
    return NextResponse.json({ ok: true, data: { account: toPublic(account) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Account id is required" },
        { status: 400 }
      );
    }
    const account = await db.bankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: "Account not found" },
        { status: 404 }
      );
    }
    await db.bankAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
