"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
  Copy,
  Gift,
  Users,
  Bell,
  ShoppingCart,
  CreditCard,
  User as UserIcon,
  Headphones,
  Calendar,
  Hash,
  Banknote,
  CheckCircle2,
  Plus,
  Clock,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "green" | "gold" | "blue" | "muted";
  when: string;
}

export function DashboardView() {
  const { user, setView } = useStore();
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

  const referralLink = useMemo(() => {
    if (!user) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/?ref=${user.id}`;
  }, [user]);

  const notifications: NotificationItem[] = useMemo(() => {
    if (!data) return [];
    const items: NotificationItem[] = [];
    const txns = data.recentTransactions;
    // Daily earnings received
    const earning = txns.find((t) => t.type === "EARNING" && t.status === "COMPLETED");
    if (earning) {
      items.push({
        id: "earning-" + earning.id,
        icon: <Coins className="size-4 text-green-deep" />,
        title: "Daily earnings received",
        body: `${formatETB(earning.amount)} added to your wallet.`,
        tone: "green",
        when: formatDate(earning.createdAt),
      });
    }
    // Payment approved
    const purchase = txns.find((t) => t.type === "PURCHASE" && t.status === "COMPLETED");
    if (purchase) {
      items.push({
        id: "purchase-" + purchase.id,
        icon: <CheckCircle2 className="size-4 text-green-deep" />,
        title: "Payment approved",
        body: "Your investment package is now active.",
        tone: "green",
        when: formatDate(purchase.createdAt),
      });
    }
    // Withdrawal approved
    const withdrawal = txns.find((t) => t.type === "WITHDRAWAL" && t.status === "COMPLETED");
    if (withdrawal) {
      items.push({
        id: "withdrawal-" + withdrawal.id,
        icon: <Banknote className="size-4 text-gold-deep" />,
        title: "Withdrawal approved",
        body: `${formatETB(withdrawal.amount)} sent to your account.`,
        tone: "gold",
        when: formatDate(withdrawal.createdAt),
      });
    }
    // New product announcement (static)
    items.push({
      id: "product-corn",
      icon: <Sparkles className="size-4 text-gold-deep" />,
      title: "New product available",
      body: "Corn Investment Package — earn 350 ETB/day.",
      tone: "gold",
      when: "Recently",
    });
    return items.slice(0, 6);
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
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

  const { stats, recentTransactions, activePurchases, earnings7d, earningsByMonth, investmentTrend } = data;
  const dailyChart = earnings7d.map((e) => ({ date: shortDate(e.date), total: e.total }));
  const hasActive = activePurchases.length > 0;
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const displayName = user?.name || user?.phone || "Investor";
  const userIdShort = user?.id ? user.id.slice(-8).toUpperCase() : "—";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      {/* 1. Welcome hero + 9. Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-gold-soft via-card to-green-soft p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gold-deep backdrop-blur">
                <Sparkles className="size-3" /> Investor Dashboard
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Welcome, <span className="text-gold-gradient">{displayName}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-green-deep" /> {todayStr}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="size-3.5 text-green-deep" /> User ID:{" "}
                  <span className="font-mono font-semibold text-foreground">{userIdShort}</span>
                </span>
              </div>
            </div>
            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
              <QuickAction icon={<ShoppingCart className="size-4" />} label="Buy Product" onClick={() => setView("product")} tone="gold" />
              <QuickAction icon={<Banknote className="size-4" />} label="Withdraw" onClick={() => setView("withdrawal")} tone="green" />
              <QuickAction icon={<Package className="size-4" />} label="My Products" onClick={() => setView("myproducts")} tone="outline" />
              <QuickAction icon={<UserIcon className="size-4" />} label="Profile" onClick={() => setView("dashboard")} tone="outline" />
              <QuickAction
                icon={<Headphones className="size-4" />}
                label="Support"
                onClick={() => toast.info("Customer support: call 0990-000-000 or email support@agriearn.app")}
                tone="outline"
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 2. Balance Cards */}
      <section>
        <SectionTitle icon={<Wallet className="size-5 text-gold-deep" />} title="Balance Overview" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            icon={<Wallet className="size-4" />}
            label="Available Balance"
            value={formatETB(stats.currentBalance)}
            sublabel="Ready to withdraw"
          />
          <StatCard
            icon={<Coins className="size-4" />}
            label="Total Earnings"
            value={formatETB(stats.totalEarnings)}
            sublabel="Lifetime income"
          />
          <StatCard
            icon={<TrendingUp className="size-4" />}
            label="Today's Earnings"
            value={formatETB(stats.dailyEarnings)}
            sublabel="Accrued today"
          />
          <StatCard
            icon={<Banknote className="size-4" />}
            label="Total Withdrawn"
            value={formatETB(stats.totalWithdrawn)}
            sublabel="Approved payouts"
          />
        </div>
      </section>

      {/* 10. Statistics Charts */}
      <section>
        <SectionTitle icon={<TrendingUp className="size-5 text-gold-deep" />} title="Statistics" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Daily Earnings Chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <Card className="gold-ring h-full p-5">
              <ChartHeader title="Daily Earnings" subtitle="Last 7 days" badge={`${formatETB(stats.dailyEarnings)}/day`} />
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChart} margin={{ left: -12, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.74 0.14 80)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="oklch(0.85 0.11 92)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 85)" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} width={48} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [formatETB(v), "Earnings"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="oklch(0.74 0.14 80)" strokeWidth={2.5} fill="url(#goldFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Monthly Earnings Chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-1">
            <Card className="h-full p-5 green-ring">
              <ChartHeader title="Monthly Earnings" subtitle="Last 6 months" badge={formatETB(stats.monthlyIncome)} tone="green" />
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earningsByMonth} margin={{ left: -12, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="greenBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.7 0.15 150)" />
                        <stop offset="100%" stopColor="oklch(0.55 0.16 150)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 150)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} width={48} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [formatETB(v), "Earnings"]}
                    />
                    <Bar dataKey="total" fill="url(#greenBar)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Total Investment Chart */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
            <Card className="gold-ring h-full p-5">
              <ChartHeader title="Total Investment" subtitle="Cumulative (6 mo)" badge={formatETB(stats.totalInvestment)} />
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={investmentTrend} margin={{ left: -12, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="investFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.16 145)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.62 0.16 145)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 85)" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 75)" }} width={48} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number) => [formatETB(v), "Invested"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="oklch(0.62 0.16 145)" strokeWidth={2.5} fill="url(#investFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* 4. Earnings Summary */}
      <section>
        <SectionTitle icon={<Coins className="size-5 text-gold-deep" />} title="Earnings Summary" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryTile icon={<TrendingUp className="size-4" />} label="Daily Income" value={formatETB(stats.dailyEarnings)} tone="green" />
          <SummaryTile icon={<Calendar className="size-4" />} label="Weekly Income" value={formatETB(stats.weeklyIncome)} tone="gold" />
          <SummaryTile icon={<Clock className="size-4" />} label="Monthly Income" value={formatETB(stats.monthlyIncome)} tone="green" />
          <SummaryTile icon={<Coins className="size-4" />} label="Total Income" value={formatETB(stats.totalEarnings)} tone="gold" />
        </div>
      </section>

      {/* 3. Active Products */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle icon={<Sparkles className="size-5 text-gold-deep" />} title="Active Products" inline />
          <Button size="sm" variant="outline" onClick={() => setView("myproducts")} className="rounded-full">
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
                      <img src={p.productImage} alt={p.productName} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-sm font-bold text-foreground">{p.productName}</h4>
                        <StatusBadge label="Active" tone="green" />
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span>Price: <span className="font-semibold text-foreground">{formatETB(p.price)}</span></span>
                        <span>Purchased: <span className="font-semibold text-foreground">{formatDate(p.createdAt)}</span></span>
                        <span>Income: <span className="font-semibold text-green-deep">{formatETB(p.dailyIncome)}/day</span></span>
                        <span>Active since: <span className="font-semibold text-foreground">{formatDate(p.activationDate)}</span></span>
                      </div>
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
              <Button onClick={() => setView("product")} className="bg-gold-gradient text-primary-foreground rounded-full">
                Browse Products
              </Button>
            }
          />
        )}
      </section>

      {/* 7. Withdrawal + 6. Referral (side by side on large screens) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Withdrawal Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="gold-ring h-full p-6">
            <div className="mb-4 flex items-center gap-2">
              <Banknote className="size-5 text-gold-deep" />
              <h3 className="text-lg font-bold text-foreground">Withdrawal</h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-gold-soft/40 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Current Withdrawal Balance</div>
                <div className="mt-1 text-2xl font-extrabold text-gold-gradient">{formatETB(stats.withdrawalBalance)}</div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <Info className="size-4 text-green-deep" />
                Minimum withdrawal amount is <span className="font-semibold text-foreground">300 ETB</span>.
              </div>
              <Button
                onClick={() => setView("withdrawal")}
                disabled={stats.withdrawalBalance < 300}
                className="w-full bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full font-semibold"
              >
                <Banknote className="size-4" /> Withdraw Now
              </Button>
              {stats.withdrawalBalance < 300 && (
                <p className="text-center text-xs text-muted-foreground">
                  Balance below the 300 ETB minimum.
                </p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Referral Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="green-ring h-full p-6">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="size-5 text-green-deep" />
              <h3 className="text-lg font-bold text-foreground">Referral Program</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Users className="size-3" /> Total Referrals
                  </div>
                  <div className="mt-1 text-xl font-extrabold text-foreground">0</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Gift className="size-3" /> Referral Bonus
                  </div>
                  <div className="mt-1 text-xl font-extrabold text-green-deep">{formatETB(0)}</div>
                </div>
              </div>
              <div>
                <Label2>Your Referral Link</Label2>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 truncate rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs font-mono text-foreground"
                    aria-label="Referral link"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        toast.success("Referral link copied");
                      } catch {
                        toast.error("Could not copy — select and copy manually");
                      }
                    }}
                    className="shrink-0 rounded-full bg-green-gradient text-white shadow hover:opacity-90"
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Share your link. Earn bonuses when friends invest.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 5. Recent Transactions + 8. Notifications (side by side on large screens) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent Transactions */}
        <section className="lg:col-span-3">
          <SectionTitle icon={<Wallet className="size-5 text-gold-deep" />} title="Recent Transactions" />
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
                            className={cn(
                              "text-right font-semibold",
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            )}
                          >
                            {isCredit ? "+" : "−"}
                            {formatETB(t.amount)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge label={t.status} tone={transactionStatusTone(t.status)} />
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

        {/* Notifications */}
        <section className="lg:col-span-2">
          <SectionTitle icon={<Bell className="size-5 text-gold-deep" />} title="Notifications" />
          <Card className="p-0">
            <div className="max-h-96 overflow-y-auto scroll-gold">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {notifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-3 p-4">
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          n.tone === "green" && "bg-green-soft",
                          n.tone === "gold" && "bg-gold-soft",
                          n.tone === "blue" && "bg-sky-500/15",
                          n.tone === "muted" && "bg-muted"
                        )}
                      >
                        {n.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{n.when}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, inline }: { icon: React.ReactNode; title: string; inline?: boolean }) {
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
    </div>
  );
}

function ChartHeader({ title, subtitle, badge, tone = "gold" }: { title: string; subtitle: string; badge: string; tone?: "gold" | "green" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <Badge className={cn("rounded-full", tone === "green" ? "bg-green-soft text-green-deep" : "bg-gold-soft text-gold-deep")}>
        {badge}
      </Badge>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone: "gold" | "green" | "outline";
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className={cn(
        "rounded-full font-semibold",
        tone === "gold" && "bg-gold-gradient text-primary-foreground shadow hover:opacity-90",
        tone === "green" && "bg-green-gradient text-white shadow hover:opacity-90",
        tone === "outline" && "border-green-deep/40 text-green-deep hover:bg-green-soft/60"
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "gold" | "green";
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card className="flex items-center gap-3 p-4">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            tone === "gold" && "bg-gold-soft text-gold-deep",
            tone === "green" && "bg-green-soft text-green-deep"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={cn("truncate text-lg font-extrabold", tone === "gold" ? "text-gold-gradient" : "text-green-deep")}>
            {value}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Label2({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{children}</div>;
}
