"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Copy,
  Users,
  CheckCircle2,
  Coins,
  Share2,
  MessageCircle,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  TrendingUp,
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
import { referralsApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/earning/EmptyState";
import { toast } from "sonner";
import type { ReferralResponse } from "@/lib/types";

export function ReferralView() {
  const { setView } = useStore();
  const [data, setData] = useState<ReferralResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await referralsApi.get();
        if (active) setData(res);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Failed to load referral data");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const copyLink = async (text: string, label = "Referral link") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  const share = (platform: "telegram" | "whatsapp" | "facebook") => {
    if (!data) return;
    const link = data.referralLink;
    const text = "Join AgriEarn and earn daily income from agriculture packages!";
    let url = "";
    if (platform === "telegram") {
      url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    } else if (platform === "whatsapp") {
      url = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
    } else {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`;
    }
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer,width=620,height=640");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <EmptyState
          icon={<Gift className="size-6" />}
          title="Referral data unavailable"
          description="We couldn't load your referral info. Please try again."
          action={
            <Button onClick={() => window.location.reload()} className="bg-gold-gradient text-primary-foreground rounded-full">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const { code, referralLink, stats, history, referred, settings } = data;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-green-soft via-card to-gold-soft p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-green-deep backdrop-blur">
                <Gift className="size-3" /> Referral Program
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Invite Friends. <span className="text-green-gradient">Earn Together.</span>
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Share your referral link. When a friend registers, buys the{" "}
                {formatETB(settings.qualifyingPrice)} package, and gets approved,
                you earn <span className="font-semibold text-green-deep">{formatETB(settings.referralReward)}</span>{" "}
                — and they get a <span className="font-semibold text-gold-deep">{formatETB(settings.welcomeBonus)}</span>{" "}
                welcome bonus.
                {!settings.enabled && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    Program paused by admin
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Referral code + link + share */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <LinkIcon className="size-5 text-gold-deep" />
          <h3 className="text-lg font-bold text-foreground">Your Referral Link</h3>
        </div>
        <Card className="gold-ring p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Referral code */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Your Referral Code
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-xl border border-border/60 bg-gold-soft/50 px-4 py-2.5 font-mono text-lg font-extrabold tracking-[0.2em] text-gold-deep">
                  {code}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => copyLink(code, "Code")}
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
              </div>
            </div>
            {/* Referral link */}
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Referral Link
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={referralLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 truncate rounded-full border border-border/60 bg-muted/40 px-4 py-2.5 text-xs font-mono text-foreground"
                  aria-label="Referral link"
                />
                <Button
                  onClick={() => copyLink(referralLink)}
                  className="shrink-0 rounded-full bg-green-gradient text-white shadow hover:opacity-90"
                >
                  <Copy className="size-3.5" /> Copy Link
                </Button>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Share2 className="mr-1 inline size-3.5" /> Share via
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => share("telegram")}
            >
              <MessageCircle className="size-4 text-sky-600" /> Telegram
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => share("whatsapp")}
            >
              <MessageCircle className="size-4 text-emerald-600" /> WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => share("facebook")}
            >
              <Share2 className="size-4 text-blue-700" /> Facebook
            </Button>
          </div>
        </Card>
      </section>

      {/* Stats cards */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-5 text-gold-deep" />
          <h3 className="text-lg font-bold text-foreground">Referral Rewards</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            icon={<Users className="size-4" />}
            label="Total Referrals"
            value={String(stats.totalReferrals)}
            sublabel="Friends you invited"
            tone="gold"
          />
          <StatTile
            icon={<CheckCircle2 className="size-4" />}
            label="Active Referrals"
            value={String(stats.activeReferrals)}
            sublabel="Qualified (bought + approved)"
            tone="green"
          />
          <StatTile
            icon={<Coins className="size-4" />}
            label="Referral Earnings"
            value={formatETB(stats.referralEarnings)}
            sublabel="Total rewards earned"
            tone="gold"
          />
        </div>
      </section>

      {/* Referred users + history */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Referred users */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-green-deep" />
            <h3 className="text-lg font-bold text-foreground">Your Referrals</h3>
          </div>
          {referred.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No referrals yet"
              description="Share your link above to invite friends."
              action={
                <Button onClick={() => copyLink(referralLink)} className="bg-green-gradient text-white rounded-full">
                  <Copy className="size-4" /> Copy Link
                </Button>
              }
            />
          ) : (
            <Card className="p-0">
              <div className="max-h-96 overflow-y-auto scroll-gold">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Friend</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referred.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {r.referredName ?? "Investor"}
                          </div>
                          <div className="text-xs text-muted-foreground">{r.referredPhone}</div>
                        </TableCell>
                        <TableCell>
                          {r.status === "REWARDED" ? (
                            <Badge className="bg-green-soft text-green-deep">Rewarded</Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </section>

        {/* Referral history */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-gold-deep" />
            <h3 className="text-lg font-bold text-foreground">Referral History</h3>
          </div>
          {history.length === 0 ? (
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title="No activity yet"
              description="Referral events and rewards will appear here."
              action={
                <Button onClick={() => setView("product")} variant="outline" className="rounded-full">
                  Browse Products
                </Button>
              }
            />
          ) : (
            <Card className="p-0">
              <div className="max-h-96 overflow-y-auto scroll-gold">
                <ul className="divide-y divide-border/60">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-start gap-3 p-4">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
                        {h.event === "REFERRAL_REWARDED" ? (
                          <Coins className="size-4" />
                        ) : h.event === "WELCOME_BONUS" ? (
                          <Gift className="size-4" />
                        ) : (
                          <Users className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {labelFor(h.event)}
                          </p>
                          {h.amount > 0 && (
                            <span className="shrink-0 text-sm font-bold text-green-deep">
                              +{formatETB(h.amount)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(h.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}

function labelFor(event: string): string {
  switch (event) {
    case "REFERRED_REGISTERED":
      return "Friend registered with your code";
    case "REFERRAL_REWARDED":
      return "Referral reward earned";
    case "WELCOME_BONUS":
      return "Welcome bonus received";
    default:
      return event;
  }
}

function StatTile({
  icon,
  label,
  value,
  sublabel,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  tone: "gold" | "green";
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <Card className="flex items-center gap-4 p-5">
        <span
          className={`flex size-12 items-center justify-center rounded-full ${
            tone === "gold" ? "bg-gold-soft text-gold-deep" : "bg-green-soft text-green-deep"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`text-2xl font-extrabold ${tone === "gold" ? "text-gold-gradient" : "text-green-deep"}`}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        </div>
      </Card>
    </motion.div>
  );
}
