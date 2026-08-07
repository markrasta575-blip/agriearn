// Admin referrals API.
//
// GET  /api/admin/referrals -> {
//   ok, data: {
//     referrals: AdminReferralPublic[],
//     rewards:   AdminReferralRewardPublic[],
//     settings:  ReferralSettingsPublic,
//     stats: {
//       totalReferrals, totalRewardsPaid, totalRewardsAmount,
//       totalWelcomeBonuses, totalWelcomeBonusAmount,
//     }
//   }
// }
//
// POST /api/admin/referrals body {
//   enabled?: boolean,
//   referralReward?: number, welcomeBonus?: number, qualifyingPrice?: number
// } -> { ok, data: { settings: ReferralSettingsPublic } }
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleError } from "@/lib/http";
import {
  SETTINGS_SINGLE_ID,
  getReferralSettings,
} from "@/lib/referral";
import type {
  AdminReferralPublic,
  AdminReferralReport,
  AdminReferralRewardPublic,
  ReferralSettingsPublic,
} from "@/lib/types";

export const dynamic = "force-dynamic";

function toSettings(row: {
  enabled: boolean;
  referralReward: number;
  welcomeBonus: number;
  qualifyingPrice: number;
}): ReferralSettingsPublic {
  return {
    enabled: row.enabled,
    referralReward: row.referralReward,
    welcomeBonus: row.welcomeBonus,
    qualifyingPrice: row.qualifyingPrice,
  };
}

export async function GET() {
  try {
    await requireAdmin();

    const [referralsRaw, rewardsRaw, welcomeAgg, rewardsAgg, settings] =
      await Promise.all([
        db.referral.findMany({
          include: {
            referrer: { select: { phone: true, name: true } },
            referred: { select: { phone: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        // ReferralReward has no `referred` relation on User (only the referrer
        // side), so we fetch rewards + referrer, then resolve the referred
        // user's phone/name via a separate lookup below.
        db.referralReward.findMany({
          include: {
            referrer: { select: { phone: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        db.bonusHistory.aggregate({
          _sum: { amount: true },
          _count: { _all: true },
          where: { type: "WELCOME" },
        }),
        db.referralReward.aggregate({
          _sum: { amount: true },
          _count: { _all: true },
        }),
        getReferralSettings(),
      ]);

    // Resolve referred user phone/name for the rewards list.
    const referredIds = Array.from(
      new Set(rewardsRaw.map((r) => r.referredId))
    );
    const referredUsers = referredIds.length
      ? await db.user.findMany({
          where: { id: { in: referredIds } },
          select: { id: true, phone: true, name: true },
        })
      : [];
    const referredMap = new Map(referredUsers.map((u) => [u.id, u]));

    const referrals: AdminReferralPublic[] = referralsRaw.map((r) => ({
      id: r.id,
      referrerPhone: r.referrer?.phone ?? "",
      referrerName: r.referrer?.name ?? null,
      referredPhone: r.referred?.phone ?? "",
      referredName: r.referred?.name ?? null,
      referralCode: r.referralCode,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      rewardedAt: r.rewardedAt ? r.rewardedAt.toISOString() : null,
    }));

    const rewards: AdminReferralRewardPublic[] = rewardsRaw.map((rw) => {
      const referred = referredMap.get(rw.referredId);
      return {
        id: rw.id,
        referrerPhone: rw.referrer?.phone ?? "",
        referrerName: rw.referrer?.name ?? null,
        referredPhone: referred?.phone ?? "",
        amount: rw.amount,
        purchaseId: rw.purchaseId,
        createdAt: rw.createdAt.toISOString(),
      };
    });

    const data: AdminReferralReport = {
      referrals,
      rewards,
      settings,
      stats: {
        totalReferrals: referralsRaw.length,
        totalRewardsPaid: rewardsAgg._count._all,
        totalRewardsAmount: rewardsAgg._sum.amount ?? 0,
        totalWelcomeBonuses: welcomeAgg._count._all,
        totalWelcomeBonusAmount: welcomeAgg._sum.amount ?? 0,
      },
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const data: {
      enabled?: boolean;
      referralReward?: number;
      welcomeBonus?: number;
      qualifyingPrice?: number;
    } = {};

    if (typeof body.enabled === "boolean") data.enabled = body.enabled;
    if (
      (typeof body.referralReward === "number" ||
        typeof body.referralReward === "string") &&
      Number(body.referralReward) > 0
    ) {
      data.referralReward = Math.round(Number(body.referralReward) * 100) / 100;
    }
    if (
      (typeof body.welcomeBonus === "number" ||
        typeof body.welcomeBonus === "string") &&
      Number(body.welcomeBonus) > 0
    ) {
      data.welcomeBonus = Math.round(Number(body.welcomeBonus) * 100) / 100;
    }
    if (
      (typeof body.qualifyingPrice === "number" ||
        typeof body.qualifyingPrice === "string") &&
      Number(body.qualifyingPrice) > 0
    ) {
      data.qualifyingPrice =
        Math.round(Number(body.qualifyingPrice) * 100) / 100;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No valid fields supplied. Provide enabled, referralReward, welcomeBonus or qualifyingPrice (numbers > 0).",
        },
        { status: 400 }
      );
    }

    const updated = await db.referralSetting.upsert({
      where: { id: SETTINGS_SINGLE_ID },
      update: data,
      create: {
        id: SETTINGS_SINGLE_ID,
        enabled: data.enabled ?? true,
        referralReward: data.referralReward ?? 200,
        welcomeBonus: data.welcomeBonus ?? 100,
        qualifyingPrice: data.qualifyingPrice ?? 2000,
      },
    });

    return NextResponse.json({
      ok: true,
      data: { settings: toSettings(updated) },
    });
  } catch (err) {
    const { status, message } = handleError(err);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
