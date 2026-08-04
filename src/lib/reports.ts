// Admin platform-wide reports. Computes aggregate KPIs over users, products,
// purchases, earnings and withdrawals, plus 7-day revenue / purchase trends.
import { db } from "@/lib/db";
import type { AdminReport } from "@/lib/types";

const DAY_MS = 86_400_000;

function utcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

export interface DayBucket {
  date: string;
  total: number;
}

export interface AdminReportResult {
  report: AdminReport;
  revenue7d: DayBucket[];
  purchases7d: DayBucket[];
}

export async function computeAdminReport(): Promise<AdminReportResult> {
  const today = utcDay(new Date());

  const [
    totalUsersRow,
    totalProductsRow,
    totalPurchasesRow,
    activePurchasesRow,
    pendingPaymentsRow,
    pendingWithdrawalsRow,
    revenueRows,
    earningsSumRow,
    withdrawnSumRow,
    recentPurchases,
  ] = await Promise.all([
    db.user.count(),
    db.product.count(),
    db.purchase.count(),
    db.purchase.count({ where: { status: "ACTIVE" } }),
    db.purchase.count({ where: { status: "PENDING_APPROVAL" } }),
    db.withdrawal.count({ where: { status: "PENDING" } }),
    db.purchase.aggregate({
      _sum: { price: true },
      where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    }),
    db.earning.aggregate({ _sum: { amount: true } }),
    db.withdrawal.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
    db.purchase.findMany({
      where: { createdAt: { gte: new Date(today.getTime() - 7 * DAY_MS) } },
      select: { price: true, createdAt: true },
    }),
  ]);

  const report: AdminReport = {
    totalUsers: totalUsersRow,
    totalProducts: totalProductsRow,
    totalPurchases: totalPurchasesRow,
    activePurchases: activePurchasesRow,
    pendingPayments: pendingPaymentsRow,
    pendingWithdrawals: pendingWithdrawalsRow,
    totalRevenue: revenueRows._sum.price ?? 0,
    totalEarningsPaid: earningsSumRow._sum.amount ?? 0,
    totalWithdrawn: withdrawnSumRow._sum.amount ?? 0,
  };

  // Build 7-day buckets ending today (UTC). Each bucket is one UTC day.
  const revenue7d: DayBucket[] = [];
  const purchases7d: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today.getTime() - i * DAY_MS);
    revenue7d.push({ date: day.toISOString(), total: 0 });
    purchases7d.push({ date: day.toISOString(), total: 0 });
  }

  const revMap = new Map<string, number>();
  const purMap = new Map<string, number>();
  for (const p of recentPurchases) {
    const day = utcDay(p.createdAt);
    const key = day.toISOString();
    revMap.set(key, (revMap.get(key) ?? 0) + p.price);
    purMap.set(key, (purMap.get(key) ?? 0) + 1);
  }

  for (let i = 0; i < 7; i++) {
    const key = revenue7d[i].date;
    revenue7d[i].total = revMap.get(key) ?? 0;
    purchases7d[i].total = purMap.get(key) ?? 0;
  }

  return { report, revenue7d, purchases7d };
}
