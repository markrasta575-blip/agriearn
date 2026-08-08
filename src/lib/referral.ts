// Referral reward engine + helpers.
//
// Responsibilities:
//   - generateReferralCode(): 8-char uppercase alphanumeric (no ambiguous chars).
//   - ensureReferralCode(userId): lazy-set a user's referralCode (idempotent).
//   - getReferralSettings(): fetch the single ReferralSetting row (upsert-on-first-read).
//   - processPurchaseActivationRewards(purchase): called by the approve route
//     AFTER setting status ACTIVE. Pays:
//       (a) welcome bonus to the buyer (once per account, requires qualifyingPrice),
//       (b) referral reward to the buyer's referrer (once per referred user,
//           requires qualifyingPrice + program enabled).
//     Idempotent and non-blocking: any reward failure is logged but never
//     rethrown (activation must not fail because of rewards).
//
// Design notes:
//   - Idempotency is enforced BOTH by a check-before-insert AND a Prisma
//     @@unique constraint (ReferralReward @@unique([referredId]),
//     BonusHistory @@unique([userId, type])). A duplicate insert (P2002) is
//     treated as "already done" and skipped.
//   - The welcome bonus is INDEPENDENT of the referral program toggle.
//     When settings.enabled=false, referral rewards are NOT paid, but the
//     welcome bonus still is. This is intentional and documented here.

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import type { ReferralSettingsPublic } from "@/lib/types";

// Unambiguous alphabet (no O/0/I/1/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;
export const SETTINGS_SINGLE_ID = "settings-single";

// Teff Investment Package — carries a one-time 500 ETB activation bonus credited
// on first activation (once per purchase). Identified by name so admin-created
// duplicates or re-seeds still match.
export const TEFF_PRODUCT_NAME = "Teff Investment Package";
export const TEFF_ACTIVATION_BONUS = 500;

const DEFAULT_SETTINGS: ReferralSettingsPublic = {
  enabled: true,
  referralReward: 200,
  welcomeBonus: 100,
  qualifyingPrice: 2000,
};

/**
 * Generate an 8-char uppercase alphanumeric code using crypto.randomBytes.
 * Avoids ambiguous characters (O/0/I/1/L).
 */
export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * Ensure a user has a referralCode. If null, generate one and persist it,
 * retrying on unique-collision (P2002) up to a few times. Returns the code.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user?.referralCode) return user.referralCode;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateReferralCode();
    try {
      const updated = await db.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode ?? code;
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "P2002") {
        // collision — extremely unlikely with 8 chars from 30-alphabet, but
        // try again with a fresh code.
        continue;
      }
      throw err;
    }
  }
  // Exhausted retries: return a non-persisted code so the API still responds.
  // (This branch is effectively unreachable.)
  return generateReferralCode();
}

/**
 * Fetch the single ReferralSetting row. Creates a default row on first read
 * via upsert (id "settings-single"). Returns defaults if anything goes wrong.
 */
export async function getReferralSettings(): Promise<ReferralSettingsPublic> {
  try {
    const row = await db.referralSetting.upsert({
      where: { id: SETTINGS_SINGLE_ID },
      update: {},
      create: {
        id: SETTINGS_SINGLE_ID,
        enabled: DEFAULT_SETTINGS.enabled,
        referralReward: DEFAULT_SETTINGS.referralReward,
        welcomeBonus: DEFAULT_SETTINGS.welcomeBonus,
        qualifyingPrice: DEFAULT_SETTINGS.qualifyingPrice,
      },
    });
    return {
      enabled: row.enabled,
      referralReward: row.referralReward,
      welcomeBonus: row.welcomeBonus,
      qualifyingPrice: row.qualifyingPrice,
    };
  } catch (err) {
    console.error("[referral] getReferralSettings failed (non-fatal):", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/** True when err is a Prisma unique-constraint violation (P2002). */
function isP2002(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === "P2002";
}

/**
 * Pay the welcome bonus to the buyer for a qualifying purchase. Idempotent:
 * if a BonusHistory(userId, "WELCOME") row already exists, this is a no-op.
 * Wrapped in a single db.$transaction so balance + bonus + tx + history land
 * together. P2002 on the bonus insert is treated as "already paid" and swallowed.
 */
async function payWelcomeBonus(args: {
  userId: string;
  purchaseId: string;
  amount: number;
}): Promise<void> {
  const { userId, purchaseId, amount } = args;

  // Check-before-insert (the @@unique is the real guard; this avoids needless
  // transactions in the common already-paid case).
  const existing = await db.bonusHistory.findUnique({
    where: { userId_type: { userId, type: "WELCOME" } },
    select: { id: true },
  });
  if (existing) return;

  try {
    await db.$transaction(async (tx) => {
      await tx.bonusHistory.create({
        data: {
          userId,
          type: "WELCOME",
          amount,
          purchaseId,
          status: "COMPLETED",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "BONUS",
          amount,
          status: "COMPLETED",
          description: "Welcome Bonus",
          referenceId: purchaseId,
        },
      });
      await tx.referralHistory.create({
        data: {
          userId,
          event: "WELCOME_BONUS",
          amount,
          relatedId: purchaseId,
        },
      });
    });
  } catch (err) {
    if (isP2002(err)) return; // already paid by a concurrent approve
    throw err;
  }
}

/**
 * Pay the one-time Teff activation bonus (500 ETB) to the buyer on the FIRST
 * activation of the Teff Investment Package. Idempotent:
 *   - keyed on BonusHistory.purchaseId (unique) so re-approving the same
 *     purchase never credits a second 500 ETB.
 *   - the product name must match TEFF_PRODUCT_NAME.
 * Recorded as a separate BONUS transaction (type "ACTIVATION_BONUS").
 *
 * NOTE: this is independent of the WELCOME bonus (which is once per account
 * for any qualifying purchase). The Teff activation bonus is once per Teff
 * purchase.
 */
async function payActivationBonus(args: {
  userId: string;
  purchaseId: string;
  productId: string;
  productName: string;
  amount: number;
}): Promise<void> {
  const { userId, purchaseId, productId, productName, amount } = args;

  // Only the Teff product earns the activation bonus.
  if (productName !== TEFF_PRODUCT_NAME) return;

  // Check-before-insert keyed on (purchaseId, type="ACTIVATION"). The compound
  // @unique([purchaseId, type]) is the real guard; this avoids needless
  // transactions in the common already-paid case.
  const existing = await db.bonusHistory.findFirst({
    where: { purchaseId, type: "ACTIVATION" },
    select: { id: true },
  });
  if (existing) return;

  try {
    await db.$transaction(async (tx) => {
      await tx.bonusHistory.create({
        data: {
          userId,
          type: "ACTIVATION",
          amount,
          purchaseId,
          productId,
          status: "COMPLETED",
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          userId,
          type: "ACTIVATION_BONUS",
          amount,
          status: "COMPLETED",
          description: "Teff activation bonus",
          referenceId: purchaseId,
        },
      });
      await tx.referralHistory.create({
        data: {
          userId,
          event: "ACTIVATION_BONUS",
          amount,
          relatedId: purchaseId,
        },
      });
    });
  } catch (err) {
    if (isP2002(err)) return; // already paid by a concurrent approve
    throw err;
  }
}

/**
 * Pay a referral reward to the referrer of `referredId` for the given
 * purchase. Idempotent: if a ReferralReward row already exists for this
 * referredId, or the program is disabled, or the purchase is below the
 * qualifying price, this is a no-op.
 */
async function payReferralReward(args: {
  referredId: string;
  purchaseId: string;
  purchasePrice: number;
  settings: ReferralSettingsPublic;
}): Promise<void> {
  const { referredId, purchaseId, purchasePrice, settings } = args;

  if (!settings.enabled) return; // program disabled -> do not pay
  if (purchasePrice < settings.qualifyingPrice) return;

  const referral = await db.referral.findUnique({
    where: { referredId },
  });
  if (!referral) return; // not referred by anyone

  // Already rewarded for this referred user?
  const existing = await db.referralReward.findUnique({
    where: { referredId },
    select: { id: true },
  });
  if (existing) return;

  const referrerId = referral.referrerId;
  const amount = settings.referralReward;

  try {
    await db.$transaction(async (tx) => {
      await tx.referralReward.create({
        data: {
          referrerId,
          referredId,
          referralId: referral.id,
          purchaseId,
          amount,
          status: "COMPLETED",
        },
      });
      await tx.user.update({
        where: { id: referrerId },
        data: { balance: { increment: amount } },
      });
      await tx.transaction.create({
        data: {
          userId: referrerId,
          type: "REFERRAL",
          amount,
          status: "COMPLETED",
          description: "Referral reward",
          referenceId: purchaseId,
        },
      });
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: "REWARDED", rewardedAt: new Date() },
      });
      await tx.referralHistory.create({
        data: {
          userId: referrerId,
          event: "REFERRAL_REWARDED",
          amount,
          relatedId: referral.id,
        },
      });
    });
  } catch (err) {
    if (isP2002(err)) return; // concurrent approve already paid
    throw err;
  }
}

/**
 * Process referral + welcome-bonus rewards for a freshly approved purchase.
 *
 * Called by the approve route AFTER setting status ACTIVE. Safe to call many
 * times — every step is idempotent (welcome bonus per (userId, WELCOME);
 * referral reward per referredId).
 *
 * Failures are logged and swallowed: an activation must never fail because a
 * reward payout broke.
 */
export async function processPurchaseActivationRewards(purchase: {
  id: string;
  userId: string;
  price: number;
  status: string;
  activationDate: Date | null;
  productId: string;
  product: { name: string } | null;
}): Promise<void> {
  try {
    // Only meaningful on ACTIVE purchases (caller just set ACTIVE, but guard).
    if (purchase.status !== "ACTIVE") return;

    const settings = await getReferralSettings();
    const productName = purchase.product?.name ?? "";

    // (a) Welcome bonus — paid regardless of the referral toggle, but only if
    //     the purchase price meets the qualifying threshold.
    if (purchase.price >= settings.qualifyingPrice) {
      try {
        await payWelcomeBonus({
          userId: purchase.userId,
          purchaseId: purchase.id,
          amount: settings.welcomeBonus,
        });
      } catch (err) {
        console.error(
          `[referral] payWelcomeBonus failed (non-fatal) for purchase ${purchase.id}:`,
          err
        );
      }
    }

    // (b) Teff activation bonus — one-time 500 ETB on first activation of the
    //     Teff Investment Package. Keyed on (purchaseId, type=ACTIVATION) so
    //     re-approving the same purchase never credits it again.
    if (productName === TEFF_PRODUCT_NAME) {
      try {
        await payActivationBonus({
          userId: purchase.userId,
          purchaseId: purchase.id,
          productId: purchase.productId,
          productName,
          amount: TEFF_ACTIVATION_BONUS,
        });
      } catch (err) {
        console.error(
          `[referral] payActivationBonus failed (non-fatal) for purchase ${purchase.id}:`,
          err
        );
      }
    }

    // (c) Referral reward — only paid if the program is enabled.
    try {
      await payReferralReward({
        referredId: purchase.userId,
        purchaseId: purchase.id,
        purchasePrice: purchase.price,
        settings,
      });
    } catch (err) {
      console.error(
        `[referral] payReferralReward failed (non-fatal) for purchase ${purchase.id}:`,
        err
      );
    }
  } catch (err) {
    // Outer guard: never break activation.
    console.error(
      `[referral] processPurchaseActivationRewards failed (non-fatal) for purchase ${purchase.id}:`,
      err
    );
  }
}
