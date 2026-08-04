// Purchases API: list (current user or all admin) and create.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";

    if (all) {
      await requireAdmin();
      const purchases = await db.purchase.findMany({
        include: {
          product: { select: { name: true, image: true } },
          user: { select: { phone: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        ok: true,
        data: { purchases: purchases.map(toPublic) },
      });
    }

    const user = await requireUser();
    const purchases = await db.purchase.findMany({
      where: { userId: user.id },
      include: { product: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      ok: true,
      data: { purchases: purchases.map(toPublic) },
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
    const productId = typeof body.productId === "string" ? body.productId : "";
    const paymentMethod =
      typeof body.paymentMethod === "string" ? body.paymentMethod : "";
    const paymentRef =
      typeof body.paymentRef === "string" ? body.paymentRef : null;

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: "productId is required" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product not found" },
        { status: 404 }
      );
    }
    if (product.status !== "AVAILABLE") {
      return NextResponse.json(
        { ok: false, error: "Product is not available for purchase" },
        { status: 400 }
      );
    }

    const purchase = await db.purchase.create({
      data: {
        userId: user.id,
        productId: product.id,
        price: product.price,
        dailyIncome: product.dailyIncome,
        status: "PENDING_APPROVAL",
        paymentMethod: paymentMethod || null,
        paymentRef,
      },
      include: { product: { select: { name: true, image: true } } },
    });

    await db.transaction.create({
      data: {
        userId: user.id,
        type: "PURCHASE",
        amount: product.price,
        status: "PENDING",
        referenceId: purchase.id,
        description: `Purchase of ${product.name}`,
      },
    });

    return NextResponse.json({ ok: true, data: { purchase: toPublic(purchase) } });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
