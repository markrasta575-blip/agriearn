// Seed script — creates the admin user and the Wheat Investment Package.
// Run with: bun run scripts/seed.ts
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/crypto";
import {
  ensureReferralCode,
  SETTINGS_SINGLE_ID,
} from "../src/lib/referral";

async function main() {
  // Admin user
  const adminPhone = "0990000000";
  const adminPass = "admin123";
  let admin = await db.user.findUnique({ where: { phone: adminPhone } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        phone: adminPhone,
        password: await hashPassword(adminPass),
        name: "Platform Admin",
        role: "ADMIN",
        balance: 0,
        status: "ACTIVE",
      },
    });
    console.log("✓ Created admin user:", adminPhone, "(password:", adminPass, ")");
  } else {
    admin = await db.user.update({
      where: { id: admin.id },
      data: {
        role: "ADMIN",
        status: "ACTIVE",
        password: await hashPassword(adminPass),
      },
    });
    console.log("✓ Ensured admin user:", adminPhone, "(password:", adminPass, ")");
  }

  // Wheat product
  const wheatName = "Wheat Investment Package";
  const existing = await db.product.findFirst({ where: { name: wheatName } });
  const benefits = JSON.stringify([
    "Earn 100 ETB every single day",
    "Affordable entry — only 2,000 ETB",
    "Backed by real agriculture assets",
    "Daily payouts to your wallet",
    "Transparent income tracking",
    "Withdraw anytime (min 300 ETB)",
  ]);
  if (!existing) {
    const product = await db.product.create({
      data: {
        name: wheatName,
        category: "Agriculture",
        price: 2000,
        dailyIncome: 100,
        description:
          "Purchase this agriculture package for 2,000 ETB. After payment confirmation, the package becomes active and daily earnings are calculated according to the platform's business rules.",
        image: "/wheat.jpg",
        benefits,
        status: "AVAILABLE",
      },
    });
    console.log("✓ Created product:", product.name, "(", product.id, ")");
  } else {
    const product = await db.product.update({
      where: { id: existing.id },
      data: {
        category: "Agriculture",
        price: 2000,
        dailyIncome: 100,
        image: "/wheat.jpg",
        benefits,
        status: "AVAILABLE",
      },
    });
    console.log("✓ Ensured product:", product.name);
  }

  // Corn product
  const cornName = "Corn Investment Package";
  const existingCorn = await db.product.findFirst({ where: { name: cornName } });
  const cornBenefits = JSON.stringify([
    "Earn 350 ETB every single day",
    "Premium package — 3,500 ETB",
    "Backed by real agriculture assets",
    "Daily payouts to your wallet",
    "Transparent income tracking",
    "Withdraw anytime (min 300 ETB)",
  ]);
  if (!existingCorn) {
    const corn = await db.product.create({
      data: {
        name: cornName,
        category: "Agriculture",
        price: 3500,
        dailyIncome: 350,
        description:
          "Purchase the Corn Investment Package for 3,500 ETB. After the payment is confirmed, the package becomes active and the user starts earning 350 ETB per day according to the platform's business rules.",
        image: "/corn.jpg",
        benefits: cornBenefits,
        status: "AVAILABLE",
      },
    });
    console.log("✓ Created product:", corn.name, "(", corn.id, ")");
  } else {
    const corn = await db.product.update({
      where: { id: existingCorn.id },
      data: {
        category: "Agriculture",
        price: 3500,
        dailyIncome: 350,
        image: "/corn.jpg",
        benefits: cornBenefits,
        status: "AVAILABLE",
      },
    });
    console.log("✓ Ensured product:", corn.name);
  }

  console.log("\nSeeding complete.");
  console.log("Admin login  -> phone: 0990000000  password: admin123");

  // Referral settings (single row, id "settings-single").
  const settings = await db.referralSetting.upsert({
    where: { id: SETTINGS_SINGLE_ID },
    update: {},
    create: {
      id: SETTINGS_SINGLE_ID,
      enabled: true,
      referralReward: 200,
      welcomeBonus: 100,
      qualifyingPrice: 2000,
    },
  });
  console.log(
    "✓ Referral settings: enabled=",
    settings.enabled,
    " referralReward=",
    settings.referralReward,
    " welcomeBonus=",
    settings.welcomeBonus,
    " qualifyingPrice=",
    settings.qualifyingPrice
  );

  // Backfill referral codes for any existing users (idempotent — skips users
  // that already have one).
  const users = await db.user.findMany({
    where: { referralCode: null },
    select: { id: true, phone: true },
  });
  for (const u of users) {
    const code = await ensureReferralCode(u.id);
    console.log("✓ Referral code for", u.phone, "->", code);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });