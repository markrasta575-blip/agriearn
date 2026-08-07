// Referral API: returns the current user's referral code/link, stats, history
// and the list of users they have referred.
//
// GET /api/referrals -> {
//   ok, data: {
//     code, referralLink,
//     stats: { totalReferrals, activeReferrals, referralEarnings },
//     history: ReferralHistoryItem[],
//     referred: ReferredUserPublic[],
//     settings: ReferralSettingsPublic,
//   }
// }
//
// activeReferrals = count of Referral rows with status REWARDED (i.e. the
// referred user bought a qualifying package and got approved).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { handleError } from "@/lib/http";
import { ensureReferralCode, getReferralSettings } from "@/lib/referral";
import type {
  ReferralHistoryItem,
  ReferralResponse,
  ReferralStats,
  ReferredUserPublic,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const [code, settings] = await Promise.all([
      ensureReferralCode(user.id),
      getReferralSettings(),
    ]);

    const [totalReferrals, activeReferrals, rewardsAgg, historyRaw, referredRaw] =
      await Promise.all([
        db.referral.count({ where: { referrerId: user.id } }),
        db.referral.count({
          where: { referrerId: user.id, status: "REWARDED" },
        }),
        db.referralReward.aggregate({
          _sum: { amount: true },
          where: { referrerId: user.id },
        }),
        db.referralHistory.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.referral.findMany({
          where: { referrerId: user.id },
          include: {
            referred: { select: { phone: true, name: true, createdAt: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const stats: ReferralStats = {
      totalReferrals,
      activeReferrals,
      referralEarnings: rewardsAgg._sum.amount ?? 0,
    };

    const history: ReferralHistoryItem[] = historyRaw.map((h) => ({
      id: h.id,
      event: h.event,
      amount: h.amount,
      relatedId: h.relatedId,
      createdAt: h.createdAt.toISOString(),
    }));

    const referred: ReferredUserPublic[] = referredRaw.map((r) => ({
      id: r.id,
      referredName: r.referred?.name ?? null,
      referredPhone: r.referred?.phone ?? "",
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      rewardedAt: r.rewardedAt ? r.rewardedAt.toISOString() : null,
    }));

    // Build the public referral link from the request origin (so it works
    // under any preview domain). Falls back to a relative URL if no host.
    let origin = "";
    try {
      const url = new URL(req.url);
      origin = url.origin;
    } catch {
      origin = "";
    }
    const referralLink = origin
      ? `${origin}/?ref=${code}`
      : `/?ref=${code}`;

    const data: ReferralResponse = {
      code,
      referralLink,
      stats,
      history,
      referred,
      settings,
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
