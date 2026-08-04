"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Coins,
  Package,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboardApi, type DashboardResponse } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB, formatDate, shortDate } from "@/lib/format";
import { StatCard } from "@/components/earning/StatCard";
import { StatusBadge, transactionStatusTone } from "@/components/earning/StatusBadge";
import { EmptyState } from "@/components/earning/EmptyState";
import { toast } from "sonner";
import type { TransactionPublic } from "@/lib/types";

export function DashboardView() {
  const { setView } = useStore();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await dashboardApi.get();
        if (active) setData(res);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={<LayoutDashboard className="size-6" />}
          title="Dashboard unavailable"
          description="We couldn't load your dashboard. Please try again."
          action={
            <Button
              onClick={() => window.location.reload()}
              className="bg-gold-gradient text-primary-foreground rounded-full"
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { stats, recentTransactions, activePurchases, earnings7d } = data;
  const chartData = earnings7d.map((e) => ({
    date: shortDate(e.date),
    total: e.total,
  }));
  const hasActive = activePurchases.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Your <span className="text-gold-gradient">Dashboard</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your balance, daily earnings and active investments.
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Wallet className="size-4" />}
          label="Current Balance"
          value={formatETB(stats.currentBalance)}
          sublabel="Available to withdraw"
        />
        <StatCard
          icon={<TrendingUp className="size-4" />}
          label="Daily Earnings"
          value={formatETB(stats.dailyEarnings)}
          sublabel="Today's accrual"
        />
        <StatCard
          icon={<Coins className="size-4" />}
          label="Total Earnings"
          value={formatETB(stats.totalEarnings)}
          sublabel="Lifetime"
        />
        <StatCard
          icon={<Package className="size-4" />}
          label="Active Products"
          value={String(stats.activeProducts)}
          sublabel="Currently earning"
        />
        <StatCard
          icon={<PiggyBank className="size-4" />}
          label="Pending Withdrawals"
          value={String(stats.pendingWithdrawals)}
          sublabel="Awaiting approval"
        />
      </div>

      {/* Earnings chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="gold-ring gap-3 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Earnings (7 days)</h3>
              <p className="text-xs text-muted-foreground">
                Daily total earnings over the last week
              </p>
            </div>
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-deep">
              {formatETB(stats.dailyEarnings)}/day
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -10, right: 8, top: 10 }}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.14 80)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.85 0.11 92)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 85)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.02 75)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "oklch(0.5 0.02 75)" }}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [formatETB(value), "Earnings"]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.74 0.14 80)"
                  strokeWidth={2.5}
                  fill="url(#goldFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Active Products */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-gold-deep" />
            <h3 className="text-lg font-bold text-foreground">Active Products</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setView("myproducts")}
            className="rounded-full"
          >
            View all
          </Button>
        </div>
        {hasActive ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePurchases.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="flex flex-row gap-4 p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {p.productImage ? (
                      <img
                        src={p.productImage}
                        alt={p.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-bold text-foreground">
                          {p.productName}
                        </h4>
                        <StatusBadge label="Active" tone="green" />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Activated {formatDate(p.activationDate)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-sm font-bold text-gold-gradient">
                      <TrendingUp className="size-3.5" />
                      {formatETB(p.dailyIncome)}/day
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Package className="size-6" />}
            title="No active products yet"
            description="Buy your first investment package to start earning daily income."
            action={
              <Button
                onClick={() => setView("product")}
                className="bg-gold-gradient text-primary-foreground rounded-full"
              >
                Browse Products
              </Button>
            }
          />
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="size-5 text-gold-deep" />
          <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
        </div>
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={<Coins className="size-6" />}
            title="No transactions yet"
            description="Your earnings and withdrawals will appear here."
          />
        ) : (
          <Card className="p-0">
            <div className="max-h-96 overflow-y-auto scroll-gold">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((t: TransactionPublic) => {
                    const isCredit = t.type === "EARNING";
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase">
                            {isCredit ? (
                              <ArrowUpRight className="size-3.5 text-emerald-600" />
                            ) : (
                              <ArrowDownRight className="size-3.5 text-rose-600" />
                            )}
                            {t.type}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">
                          {t.description ?? "—"}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${
                            isCredit ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isCredit ? "+" : "−"}
                          {formatETB(t.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={t.status}
                            tone={transactionStatusTone(t.status)}
                          />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(t.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
