// Approve a pending purchase (admin).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
import { processPurchaseActivationRewards } from "@/lib/referral";
import type { PurchasePublic } from "@/lib/types";

export const dynamic = "force-dynamic";

function toPublic(p: {
  id: string;
  userId: string;
  productId: string;
  price: number;
  dailyIncome: number;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  activationDate: Date | null;
  createdAt: Date;
  product?: { name: string; image: string } | null;
}): PurchasePublic {
  return {
    id: p.id,
    userId: p.userId,
    productId: p.productId,
    productName: p.product?.name ?? "",
    productImage: p.product?.image ?? "",
    price: p.price,
    dailyIncome: p.dailyIncome,
    status: p.status as PurchasePublic["status"],
    paymentMethod: p.paymentMethod,
    paymentRef: p.paymentRef,
    activationDate: p.activationDate ? p.activationDate.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Purchase id is required" },
        { status: 400 }
      );
    }

    const existing = await db.purchase.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Purchase not found" },
        { status: 404 }
      );
    }

    const purchase = await db.purchase.update({
      where: { id },
      data: {
        status: "ACTIVE",
        activationDate: new Date(),
        updatedAt: new Date(),
      },
      include: { product: { select: { name: true, image: true } } },
    });

    // Mark the matching PURCHASE transaction COMPLETED (if still PENDING).
    if (existing.status === "PENDING_APPROVAL") {
      await db.transaction.updateMany({
        where: {
          referenceId: id,
          type: "PURCHASE",
          status: "PENDING",
        },
        data: { status: "COMPLETED" },
      });
    }

    // Pay referral + welcome-bonus rewards for this activation. Idempotent +
    // non-fatal: any failure is logged inside the helper but never rethrown.
    try {
      await processPurchaseActivationRewards({
        id: purchase.id,
        userId: purchase.userId,
        price: purchase.price,
        status: purchase.status,
        activationDate: purchase.activationDate,
        product: purchase.product
          ? { name: purchase.product.name }
          : null,
      });
    } catch (rewardErr) {
      console.error(
        `[purchases/approve] reward processing failed (non-fatal) for ${purchase.id}:`,
        rewardErr
      );
    }

    return NextResponse.json({ ok: true, data: { purchase: toPublic(purchase) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
