-- =====================================================================
--  AgriEarn — Daily Earning Investment Platform
--  database.sql  (MySQL 8 / MariaDB 10.4+ compatible — for XAMPP)
-- ---------------------------------------------------------------------
--  This file creates the complete MySQL schema for the platform:
--    users, sessions, products, purchases, earnings, withdrawals,
--    bank_accounts, transactions
--
--  NOTE on the live application:
--  The shipped Next.js 16 application runs on Prisma + SQLite by default
--  (see prisma/schema.prisma). This database.sql is the MySQL equivalent
--  so you can run the data layer on XAMPP / MySQL if you prefer.
--  To point the Next.js app at MySQL instead of SQLite, change the
--  `datasource` block in prisma/schema.prisma to:
--      datasource db {
--        provider = "mysql"
--        url      = env("DATABASE_URL")
--      }
--  and set DATABASE_URL=mysql://root@localhost:3306/agriearn  in  .env
-- =====================================================================

CREATE DATABASE IF NOT EXISTS agriearn
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE agriearn;

-- ---------------------------------------------------------------------
--  Drop in reverse dependency order (safe re-run)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS earnings;
DROP TABLE IF EXISTS withdrawals;
DROP TABLE IF EXISTS bank_accounts;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
--  users
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id         VARCHAR(40)  NOT NULL,
  phone      VARCHAR(20)  NOT NULL,
  password   VARCHAR(255) NOT NULL,                 -- scrypt$salt$hash  (app)  OR  bcrypt  (PHP)
  name       VARCHAR(120) NULL,
  role       ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  balance    DECIMAL(14,2) NOT NULL DEFAULT 0.00,    -- withdrawable balance (ETB)
  status     ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  sessions  (login sessions / "remember me" tokens)
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
  id         VARCHAR(40) NOT NULL,
  token      VARCHAR(128) NOT NULL,
  userId     VARCHAR(40) NOT NULL,
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expiresAt  DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token),
  KEY idx_sessions_user (userId),
  CONSTRAINT fk_sessions_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  products
-- ---------------------------------------------------------------------
CREATE TABLE products (
  id          VARCHAR(40) NOT NULL,
  name        VARCHAR(160) NOT NULL,
  category    VARCHAR(80) NOT NULL,
  price       DECIMAL(14,2) NOT NULL,
  dailyIncome DECIMAL(14,2) NOT NULL,
  description TEXT NOT NULL,
  image       VARCHAR(500) NOT NULL,                -- /wheat.jpg  or /uploads/<file>
  benefits    JSON NOT NULL,                         -- ["benefit 1","benefit 2", ...]
  status      ENUM('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  createdAt   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  purchases
-- ---------------------------------------------------------------------
CREATE TABLE purchases (
  id             VARCHAR(40) NOT NULL,
  userId         VARCHAR(40) NOT NULL,
  productId      VARCHAR(40) NOT NULL,
  price          DECIMAL(14,2) NOT NULL,
  dailyIncome    DECIMAL(14,2) NOT NULL,
  status         ENUM('PENDING_APPROVAL','ACTIVE','REJECTED','COMPLETED')
                  NOT NULL DEFAULT 'PENDING_APPROVAL',
  paymentMethod  VARCHAR(60) NULL,
  paymentRef     VARCHAR(160) NULL,
  activationDate DATETIME(3) NULL,
  createdAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_purchases_user (userId),
  KEY idx_purchases_product (productId),
  KEY idx_purchases_status (status),
  CONSTRAINT fk_purchases_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_purchases_product FOREIGN KEY (productId)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  earnings
-- ---------------------------------------------------------------------
CREATE TABLE earnings (
  id         VARCHAR(40) NOT NULL,
  userId     VARCHAR(40) NOT NULL,
  purchaseId VARCHAR(40) NOT NULL,
  amount     DECIMAL(14,2) NOT NULL,
  date       DATETIME(3) NOT NULL,                  -- UTC day the earning belongs to
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_earnings_purchase_day (purchaseId, date),  -- idempotent per day per purchase
  KEY idx_earnings_user (userId),
  CONSTRAINT fk_earnings_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_earnings_purchase FOREIGN KEY (purchaseId)
    REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  withdrawals
-- ---------------------------------------------------------------------
CREATE TABLE withdrawals (
  id            VARCHAR(40) NOT NULL,
  userId        VARCHAR(40) NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  bankName      VARCHAR(120) NOT NULL,
  accountHolder VARCHAR(120) NOT NULL,
  accountNumber VARCHAR(40) NOT NULL,
  status        ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  processedAt   DATETIME(3) NULL,
  createdAt     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_withdrawals_user (userId),
  KEY idx_withdrawals_status (status),
  CONSTRAINT fk_withdrawals_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  bank_accounts
-- ---------------------------------------------------------------------
CREATE TABLE bank_accounts (
  id            VARCHAR(40) NOT NULL,
  userId        VARCHAR(40) NOT NULL,
  bankName      VARCHAR(120) NOT NULL,
  accountHolder VARCHAR(120) NOT NULL,
  accountNumber VARCHAR(40) NOT NULL,
  createdAt     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_bank_user (userId),
  CONSTRAINT fk_bank_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
--  transactions  (ledger of every money movement)
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
  id          VARCHAR(40) NOT NULL,
  userId      VARCHAR(40) NOT NULL,
  type        ENUM('EARNING','WITHDRAWAL','PURCHASE') NOT NULL,
  amount      DECIMAL(14,2) NOT NULL,
  status      ENUM('PENDING','COMPLETED','FAILED','REJECTED') NOT NULL DEFAULT 'COMPLETED',
  description VARCHAR(255) NULL,
  referenceId VARCHAR(40) NULL,                    -- related purchase / withdrawal id
  createdAt   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_txn_user (userId),
  KEY idx_txn_type (type),
  CONSTRAINT fk_txn_user FOREIGN KEY (userId)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  SEED DATA
-- =====================================================================

-- Admin user. Password = admin123
-- The hash below uses the app's scrypt format:  scrypt$<salt>$<hash>
-- (For a PHP/XAMPP backend you would instead store password_hash('admin123', PASSWORD_BCRYPT)
--  and verify with password_verify().)
INSERT INTO users (id, phone, password, name, role, balance, status)
VALUES (
  'admin-seed-0001',
  '0990000000',
  'scrypt$f435358115aca3920f725a261bee9c49$00f46479d78e7d900112ee1d00446b9e47ca3a4813cb9a35ca5879a0ff3b844cce06b499c1001bfc471649ae6c2855262c1e3106fcd5a0bbe1f75969521bf2ed',
  'Platform Admin',
  'ADMIN',
  0.00,
  'ACTIVE'
);

-- Wheat Investment Package product
INSERT INTO products (id, name, category, price, dailyIncome, description, image, benefits, status)
VALUES (
  'product-wheat-0001',
  'Wheat Investment Package',
  'Agriculture',
  2000.00,
  100.00,
  'Purchase this agriculture package for 2,000 ETB. After payment confirmation, the package becomes active and daily earnings are calculated according to the platform''s business rules.',
  '/wheat.jpg',
  JSON_ARRAY(
    'Earn 100 ETB every single day',
    'Affordable entry — only 2,000 ETB',
    'Backed by real agriculture assets',
    'Daily payouts to your wallet',
    'Transparent income tracking',
    'Withdraw anytime (min 300 ETB)'
  ),
  'AVAILABLE'
);

-- =====================================================================
--  REFERRAL SYSTEM TABLES
-- =====================================================================

-- Add referral_code to users (one unique code per user).
ALTER TABLE users
  ADD COLUMN referralCode VARCHAR(16) NULL;
CREATE UNIQUE INDEX uq_users_referralCode ON users(referralCode);

-- referrals: one row per referred user (referredId is unique -> a user can
-- only be referred once).
CREATE TABLE referrals (
  id           VARCHAR(40) NOT NULL,
  referrerId   VARCHAR(40) NOT NULL,
  referredId   VARCHAR(40) NOT NULL,
  referralCode VARCHAR(16) NOT NULL,
  status       ENUM('PENDING','REWARDED') NOT NULL DEFAULT 'PENDING',
  createdAt    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  rewardedAt   DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_referrals_referred (referredId),
  KEY idx_referrals_referrer (referrerId),
  CONSTRAINT fk_referrals_referrer FOREIGN KEY (referrerId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referrals_referred FOREIGN KEY (referredId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- referral_rewards: one reward per referredId (prevents duplicate rewards).
CREATE TABLE referral_rewards (
  id            VARCHAR(40) NOT NULL,
  referrerId    VARCHAR(40) NOT NULL,
  referredId    VARCHAR(40) NOT NULL,
  referralId    VARCHAR(40) NOT NULL,
  purchaseId    VARCHAR(40) NOT NULL,
  amount        DECIMAL(14,2) NOT NULL,
  status        ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
  createdAt     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_referral_rewards_referred (referredId),
  KEY idx_rr_referrer (referrerId),
  CONSTRAINT fk_rr_referrer FOREIGN KEY (referrerId) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rr_referral FOREIGN KEY (referralId) REFERENCES referrals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- bonus_history: one WELCOME bonus per (userId, type) (prevents duplicates).
CREATE TABLE bonus_history (
  id         VARCHAR(40) NOT NULL,
  userId     VARCHAR(40) NOT NULL,
  type       ENUM('WELCOME','REFERRAL') NOT NULL,
  amount     DECIMAL(14,2) NOT NULL,
  purchaseId VARCHAR(40) NULL,
  status     ENUM('COMPLETED') NOT NULL DEFAULT 'COMPLETED',
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_bonus_user_type (userId, type),
  KEY idx_bonus_user (userId),
  CONSTRAINT fk_bonus_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- referral_history: log of referral-program events for display.
CREATE TABLE referral_history (
  id         VARCHAR(40) NOT NULL,
  userId     VARCHAR(40) NOT NULL,
  event      VARCHAR(60) NOT NULL,
  amount     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  relatedId  VARCHAR(40) NULL,
  createdAt  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rh_user (userId),
  CONSTRAINT fk_rh_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- referral_setting: single row holding program config.
CREATE TABLE referral_setting (
  id              VARCHAR(40) NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  referralReward  DECIMAL(14,2) NOT NULL DEFAULT 200.00,
  welcomeBonus    DECIMAL(14,2) NOT NULL DEFAULT 100.00,
  qualifyingPrice DECIMAL(14,2) NOT NULL DEFAULT 2000.00,
  updatedAt       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extend the transactions.type meaning (column stays VARCHAR):
--   EARNING | WITHDRAWAL | PURCHASE | BONUS (welcome) | REFERRAL (referral reward)

-- Seed: referral settings + admin referral code.
INSERT INTO referral_setting (id, enabled, referralReward, welcomeBonus, qualifyingPrice)
VALUES ('settings-single', TRUE, 200.00, 100.00, 2000.00)
ON DUPLICATE KEY UPDATE
  referralReward = VALUES(referralReward),
  welcomeBonus = VALUES(welcomeBonus),
  qualifyingPrice = VALUES(qualifyingPrice);

-- Backfill a referral code for the admin (deterministic demo value).
UPDATE users SET referralCode = 'SE64ZE2H' WHERE phone = '0990000000' AND referralCode IS NULL;

-- =====================================================================
--  END OF database.sql
-- =====================================================================
