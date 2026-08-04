# AgriEarn — Complete XAMPP Installation Guide

This guide explains how to install **XAMPP**, create the MySQL database, import
`database.sql`, and connect the AgriEarn platform to it.

AgriEarn ships as a **Next.js 16 + TypeScript** application. By default it runs on
**Prisma + SQLite** (zero setup). If you want to run the data layer on
**XAMPP / MySQL** instead, follow every step below.

---

## 1. Prerequisites

| Requirement   | Version        |
|---------------|----------------|
| XAMPP         | 8.2+ (PHP 8.2, MariaDB 10.4+ / MySQL 8) |
| Node.js       | 18.18+ (for the Next.js app) |
| Bun (optional)| 1.1+ (faster scripts; `bun run dev`) |
| OS            | Windows / macOS / Linux |

Download XAMPP: <https://www.apachefriends.org/download.html>

---

## 2. Install XAMPP

### Windows
1. Run the XAMPP installer (`xampp-windows-x64-*.exe`).
2. Choose an install folder — the default is `C:\xampp`.
3. In the component selection screen keep at least **Apache** and **MySQL**.
4. Finish the installer.

### macOS
1. Open the `.dmg` and drag **XAMPP** into `/Applications`.
2. The app installs into `/Applications/XAMPP`.

### Linux
```bash
chmod +x xampp-linux-x64-*.run
sudo ./xampp-linux-x64-*.run
```
Default install path: `/opt/lampp`.

---

## 3. Start Apache + MySQL

1. Open the **XAMPP Control Panel**.
   - Windows: start menu → “XAMPP Control Panel”.
   - macOS: launch “manager-osx” from the XAMPP app.
   - Linux: `sudo /opt/lampp/lampp start`.
2. Click **Start** next to **Apache** and **MySQL**.
3. Both should turn green. MySQL runs on **port 3306** by default.

> If port 3306 is already in use, stop the other service or change MySQL’s port
> in `xampp/mysql/bin/my.ini` (Windows) / `my.cnf` (Linux/macOS).

---

## 4. Create the Database

### Option A — phpMyAdmin (recommended, GUI)
1. Open <http://localhost/phpmyadmin> in your browser.
2. Click **Import** in the top menu.
3. Choose file → select `database.sql` (from the project root).
4. Click **Go / Import**.
   - This creates the `agriearn` database and all 8 tables + seed data.
5. Click the `agriearn` database on the left sidebar to verify the tables:
   `users, sessions, products, purchases, earnings, withdrawals, bank_accounts, transactions`.

### Option B — MySQL CLI
```bash
# Windows
C:\xampp\mysql\bin\mysql.exe -u root < database.sql

# macOS / Linux
/Applications/XAMPP/bin/mysql -u root < database.sql     # macOS
sudo /opt/lampp/bin/mysql -u root < database.sql          # Linux
```
(Default XAMPP MySQL `root` user has **no password**.)

---

## 5. Verify the Seed Data

In phpMyAdmin, run:
```sql
USE agriearn;
SELECT id, phone, role, status FROM users;        -- 1 row: 0990000000 / ADMIN
SELECT id, name, price, dailyIncome, status FROM products;  -- 1 row: Wheat Investment Package
```

Admin login for the app:
- **Phone:** `0990000000`
- **Password:** `admin123`

---

## 6. Connect the Next.js App to MySQL (optional)

By default the app uses SQLite. To switch it to the XAMPP MySQL database:

1. Edit `prisma/schema.prisma` — change the datasource:
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```
2. Create / edit the `.env` file in the project root:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/agriearn"
   ```
   (Add your MySQL password after the colon if you set one.)
3. Re-generate the Prisma client and push:
   ```bash
   bun run db:generate
   bun run db:push
   ```
4. Seed (optional — `database.sql` already inserted the admin + wheat product):
   ```bash
   bun run scripts/seed.ts
   ```

> If you keep the default SQLite setup, **no XAMPP is required at all** — the app
> works out of the box with `bun run dev`. The `database.sql` file is provided so
> the same schema can be deployed on MySQL/XAMPP.

---

## 7. Run the Application

From the project root:
```bash
bun install          # install dependencies (first time only)
bun run dev          # start dev server on http://localhost:3000
```
Open the **Preview Panel** on the right (or click “Open in New Tab”).

> Do **not** navigate to `http://localhost:3000` directly in this sandbox — use the
> Preview Panel.

---

## 8. Backup / Export

To export the database back to SQL from XAMPP:
```bash
mysqldump -u root agriearn > backup.sql
```
Or in phpMyAdmin: select the `agriearn` database → **Export** → SQL → Go.

---

## 9. Common XAMPP Issues

| Problem | Fix |
|--------|-----|
| MySQL won’t start (port 3306 in use) | Stop Skype/other MySQL, or change port in `my.ini`/`my.cnf`. |
| `Access denied for user 'root'` | Set a root password in phpMyAdmin → User accounts, and update `DATABASE_URL`. |
| `Unknown column` errors | Re-import `database.sql` (old schema). |
| phpMyAdmin 404 | Ensure Apache is started; visit `http://localhost/phpmyadmin`. |
| Prisma `P1003` database not found | Run `database.sql` first, then `bun run db:push`. |

---

## 10. Database Schema Overview (8 tables)

| Table | Purpose |
|-------|---------|
| `users` | Phone-registered users + admin, balance, status |
| `sessions` | Login session tokens (cookie auth) |
| `products` | Investment packages (wheat, etc.) |
| `purchases` | User buys a product; pending → active → completed |
| `earnings` | Daily earning rows (one per active purchase per UTC day) |
| `withdrawals` | Withdrawal requests (min 300 ETB) → approved/rejected |
| `bank_accounts` | Saved bank details per user |
| `transactions` | Ledger: every EARNING / WITHDRAWAL / PURCHASE movement |

See `database.sql` for full DDL, indexes, foreign keys and seed data.
