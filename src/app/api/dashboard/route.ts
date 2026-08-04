// User dashboard. Runs lazy accrual then aggregates balances, daily/total
// earnings, active products, pending withdrawals, recent transactions, the
// user's active purchases, and a 7-day earnings trend.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import { accrueForUser } from "@/lib/earnings";
import type {
  DashboardStats,
  PurchasePublic,
  TransactionPublic,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

function utcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function toPurchasePublic(p: {
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

function toTransactionPublic(t: {
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

export async function GET() {
  try {
    const user = await requireUser();
    await accrueForUser(user.id);

    const today = utcDay(new Date());
    const sevenDaysAgo = new Date(today.getTime() - 6 * DAY_MS);

    const [
      earningsSum,
      dailyEarningsSum,
      activeProductsCount,
      pendingWithdrawalsCount,
      recentTransactionsRaw,
      activePurchasesRaw,
      last7dEarnings,
      refreshedUser,
    ] = await Promise.all([
      db.earning.aggregate({
        _sum: { amount: true },
        where: { userId: user.id },
      }),
      db.earning.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          date: { gte: today },
        },
      }),
      db.purchase.count({
        where: { userId: user.id, status: "ACTIVE" },
      }),
      db.withdrawal.count({
        where: { userId: user.id, status: "PENDING" },
      }),
      db.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.purchase.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        include: { product: { select: { name: true, image: true } } },
        orderBy: { activationDate: "desc" },
      }),
      db.earning.findMany({
        where: {
          userId: user.id,
          date: { gte: sevenDaysAgo },
        },
        select: { amount: true, date: true },
      }),
      db.user.findUnique({ where: { id: user.id } }),
    ]);

    const balance = refreshedUser?.balance ?? user.balance;

    const stats: DashboardStats = {
      currentBalance: balance,
      dailyEarnings: dailyEarningsSum._sum.amount ?? 0,
      totalEarnings: earningsSum._sum.amount ?? 0,
      activeProducts: activeProductsCount,
      withdrawalBalance: balance,
      pendingWithdrawals: pendingWithdrawalsCount,
    };

    // Build 7-day earnings buckets.
    const earnings7d: { date: string; total: number }[] = [];
    const bucketMap = new Map<string, number>();
    for (const e of last7dEarnings) {
      const key = utcDay(e.date).toISOString();
      bucketMap.set(key, (bucketMap.get(key) ?? 0) + e.amount);
    }
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getTime() - i * DAY_MS);
      const key = day.toISOString();
      earnings7d.push({ date: key, total: bucketMap.get(key) ?? 0 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        stats,
        recentTransactions: recentTransactionsRaw.map(toTransactionPublic),
        activePurchases: activePurchasesRaw.map(toPurchasePublic),
        earnings7d,
      },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
