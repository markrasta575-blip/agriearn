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
    const thirtyDaysAgo = new Date(today.getTime() - 29 * DAY_MS);
    const sixMonthsAgo = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1)
    );

    const [
      earningsSum,
      dailyEarningsSum,
      weeklyEarningsSum,
      monthlyEarningsSum,
      activeProductsCount,
      pendingWithdrawalsCount,
      totalWithdrawnAgg,
      totalInvestmentAgg,
      recentTransactionsRaw,
      activePurchasesRaw,
      last7dEarnings,
      last6mEarnings,
      allPurchasesForTrend,
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
      db.earning.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          date: { gte: sevenDaysAgo },
        },
      }),
      db.earning.aggregate({
        _sum: { amount: true },
        where: {
          userId: user.id,
          date: { gte: thirtyDaysAgo },
        },
      }),
      db.purchase.count({
        where: { userId: user.id, status: "ACTIVE" },
      }),
      db.withdrawal.count({
        where: { userId: user.id, status: "PENDING" },
      }),
      db.withdrawal.aggregate({
        _sum: { amount: true },
        where: { userId: user.id, status: "APPROVED" },
      }),
      db.purchase.aggregate({
        _sum: { price: true },
        where: { userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
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
      db.earning.findMany({
        where: {
          userId: user.id,
          date: { gte: sixMonthsAgo },
        },
        select: { amount: true, date: true },
      }),
      db.purchase.findMany({
        where: { userId: user.id },
        select: { price: true, createdAt: true, status: true },
        orderBy: { createdAt: "asc" },
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
      totalWithdrawn: totalWithdrawnAgg._sum.amount ?? 0,
      weeklyIncome: weeklyEarningsSum._sum.amount ?? 0,
      monthlyIncome: monthlyEarningsSum._sum.amount ?? 0,
      totalInvestment: totalInvestmentAgg._sum.price ?? 0,
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

    // Build 6-month earnings buckets.
    const earningsByMonth: { month: string; total: number }[] = [];
    const monthMap = new Map<string, number>();
    for (const e of last6mEarnings) {
      const d = new Date(e.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount);
    }
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      earningsByMonth.push({ month: label, total: monthMap.get(key) ?? 0 });
    }

    // Build cumulative investment trend (by month, last 6 months).
    const investmentTrend: { month: string; total: number }[] = [];
    const invMonthMap = new Map<string, number>();
    for (const p of allPurchasesForTrend) {
      if (p.status === "REJECTED") continue;
      const d = new Date(p.createdAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      invMonthMap.set(key, (invMonthMap.get(key) ?? 0) + p.price);
    }
    let cumulative = 0;
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      cumulative += invMonthMap.get(key) ?? 0;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      investmentTrend.push({ month: label, total: cumulative });
    }

    return NextResponse.json({
      ok: true,
      data: {
        stats,
        recentTransactions: recentTransactionsRaw.map(toTransactionPublic),
        activePurchases: activePurchasesRaw.map(toPurchasePublic),
        earnings7d,
        earningsByMonth,
        investmentTrend,
      },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
