// Lazy earnings accrual for active purchases.
//
// For each ACTIVE purchase of the user, we back-fill one Earning row per
// missing UTC day between activationDate (or lastEarning+1) and today (UTC
// day), capped at 90 iterations per purchase to avoid runaway loops.
//
// Each Earning also bumps the user's balance and writes a Transaction row
// (type=EARNING, status=COMPLETED). Idempotent: if an Earning already exists
// for (purchaseId, day) we skip it.

import { db } from "@/lib/db";

const DAY_MS = 86_400_000;
const MAX_DAYS_PER_PURCHASE = 90;

/** Truncate a Date to the start of its UTC day (00:00:00 UTC). */
export function utcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/** Add n days to a UTC-day Date, returning a new Date. */
export function addDays(day: Date, n: number): Date {
  return new Date(day.getTime() + DAY_MS * n);
}

export async function accrueForUser(userId: string): Promise<void> {
  const purchases = await db.purchase.findMany({
    where: {
      userId,
      status: "ACTIVE",
      activationDate: { not: null },
    },
    include: { product: { select: { name: true } } },
  });

  const today = utcDay(new Date());

  for (const purchase of purchases) {
    if (!purchase.activationDate) continue;
    const activationDay = utcDay(purchase.activationDate);

    // Find the last earning day we have already recorded for this purchase.
    const lastEarning = await db.earning.findFirst({
      where: { purchaseId: purchase.id },
      orderBy: { date: "desc" },
    });

    let startDay: Date;
    if (lastEarning) {
      // Continue the day AFTER the last recorded earning day.
      startDay = addDays(utcDay(lastEarning.date), 1);
    } else {
      startDay = activationDay;
    }

    if (startDay.getTime() > today.getTime()) continue;

    // Cap to MAX_DAYS_PER_PURCHASE to avoid runaway loops in pathological cases.
    let cursor = startDay;
    let iter = 0;
    const daysToProcess: Date[] = [];
    while (cursor.getTime() <= today.getTime() && iter < MAX_DAYS_PER_PURCHASE) {
      daysToProcess.push(cursor);
      cursor = addDays(cursor, 1);
      iter += 1;
    }

    if (daysToProcess.length === 0) continue;

    const productName = purchase.product?.name ?? "Product";

    // Process each missing day. We check idempotency individually so a partial
    // crash earlier still leaves us in a consistent state on the next run.
    for (const day of daysToProcess) {
      const exists = await db.earning.findFirst({
        where: {
          purchaseId: purchase.id,
          date: day,
        },
        select: { id: true },
      });
      if (exists) continue;

      await db.$transaction([
        db.earning.create({
          data: {
            userId,
            purchaseId: purchase.id,
            amount: purchase.dailyIncome,
            date: day,
          },
        }),
        db.user.update({
          where: { id: userId },
          data: { balance: { increment: purchase.dailyIncome } },
        }),
        db.transaction.create({
          data: {
            userId,
            type: "EARNING",
            amount: purchase.dailyIncome,
            status: "COMPLETED",
            referenceId: purchase.id,
            description: `Daily earning — ${productName}`,
          },
        }),
      ]);
    }
  }
}
