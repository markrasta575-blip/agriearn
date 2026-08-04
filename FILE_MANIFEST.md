# AgriEarn — File Manifest

Every file that makes up the AgriEarn earning platform. The project is a
Next.js 16 (App Router) + TypeScript + Prisma + Tailwind/shadcn application.

---

## Configuration & theme
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | 8 Prisma models (SQLite datasource; MySQL-ready) |
| `src/app/globals.css` | White & gold theme, gold-gradient helpers, custom scrollbar |
| `src/app/layout.tsx` | Root layout, fonts, metadata, Toaster |
| `src/app/page.tsx` | Single-page app shell + view router (the only user route `/`) |
| `tailwind.config.ts` | Tailwind config |
| `next.config.ts` | Next.js config |
| `Caddyfile` | Gateway (port 81) |

## Database & seed
| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Prisma client singleton |
| `prisma/schema.prisma` | Schema (User, Session, Product, Purchase, Earning, Withdrawal, BankAccount, Transaction) |
| `scripts/seed.ts` | Seeds admin user + Wheat Investment Package |
| `database.sql` | MySQL/XAMPP equivalent of the schema + seed data |
| `db/custom.db` | SQLite database file (auto-created) |

## Auth & shared libraries
| File | Purpose |
|------|---------|
| `src/lib/crypto.ts` | scrypt password hashing, session token generation |
| `src/lib/session.ts` | Cookie session create/destroy/getCurrentUser/requireUser/requireAdmin |
| `src/lib/validators.ts` | Phone / amount validation, error mapping |
| `src/lib/http.ts` | `{ ok, data?, error? }` response helpers + `withHandler` |
| `src/lib/earnings.ts` | Lazy idempotent daily accrual engine |
| `src/lib/reports.ts` | Admin KPI + 7-day revenue/purchase buckets |
| `src/lib/types.ts` | Shared API contract (frontend ↔ backend) |
| `src/lib/format.ts` | ETB / date formatting |
| `src/lib/utils.ts` | `cn` class merge helper |
| `src/lib/api.ts` | Typed fetch client for the frontend |
| `src/lib/store.ts` | Zustand store (user, view, auth dialog, payment context) |

## API routes (`src/app/api/**`)
| File | Purpose |
|------|---------|
| `auth/register/route.ts` | Register by phone + password |
| `auth/login/route.ts` | Login by phone + password |
| `auth/logout/route.ts` | Destroy session |
| `auth/me/route.ts` | Current user |
| `products/route.ts` | GET / POST / PUT / DELETE products (admin) |
| `admin/upload/route.ts` | Upload product image (base64 → /public/uploads) |
| `purchases/route.ts` | List purchases + create (Buy Now) |
| `purchases/approve/route.ts` | Admin approves payment → ACTIVE |
| `purchases/reject/route.ts` | Admin rejects payment |
| `earnings/route.ts` | List earnings (runs accrual) |
| `transactions/route.ts` | List transactions |
| `dashboard/route.ts` | Stats + 7-day chart + active products (runs accrual) |
| `withdrawals/route.ts` | List + create (min 300 ETB, reserves balance) |
| `withdrawals/approve/route.ts` | Admin approves withdrawal |
| `withdrawals/reject/route.ts` | Admin rejects (refunds balance) |
| `bank-accounts/route.ts` | GET / POST / DELETE bank accounts |
| `admin/users/route.ts` | List users + suspend/activate/set role |
| `admin/reports/route.ts` | Admin report KPIs + charts |

## Frontend components (`src/components/earning/**`)
| File | Purpose |
|------|---------|
| `Header.tsx` | Sticky top nav (logo, nav, balance, login/logout, mobile sheet) |
| `Footer.tsx` | Sticky bottom footer (`mt-auto`) |
| `AuthView.tsx` | Auth dialog (login / register by phone) |
| `ProductView.tsx` | Product page: wheat image, price, daily earnings, benefits, Buy Now |
| `PaymentView.tsx` | Payment page: method, reference, image upload, confirm |
| `DashboardView.tsx` | Stats cards + earnings chart + active products + transactions |
| `MyProductsView.tsx` | User purchases with status + activation date |
| `WithdrawalView.tsx` | Withdrawal form (min 300 ETB) + bank details + history |
| `AdminView.tsx` | Admin: Reports / Products / Purchases / Withdrawals / Users |
| `StatCard.tsx` | KPI card |
| `StatusBadge.tsx` | Colored status pill |
| `ImageUpload.tsx` | Admin product image uploader |
| `EmptyState.tsx` | Empty-list placeholder |

## Assets
| File | Purpose |
|------|---------|
| `public/wheat.jpg` | Wheat Investment Package product image (1024×1024, AI-generated) |
| `public/logo.svg` | Logo |
| `public/uploads/` | Admin-uploaded product images |

## Documentation & deliverables
| File | Purpose |
|------|---------|
| `database.sql` | Full MySQL schema + seed (for XAMPP) |
| `XAMPP_INSTALL.md` | Complete XAMPP installation & import guide |
| `FILE_MANIFEST.md` | This file |
| `worklog.md` | Build worklog |

## Run
```bash
bun install
bun run db:push      # create SQLite tables
bun run scripts/seed.ts   # seed admin + wheat product
bun run dev          # http://localhost:3000  (preview via the right-hand panel)
```

Admin login: phone `0990000000` / password `admin123`
