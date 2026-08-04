# Task ID: 4-b — Frontend SPA for Earning Platform

## Status: IN PROGRESS

## Files created so far
- `src/lib/format.ts` — formatETB, formatDate, formatDateTime, maskAccountNumber, shortDate, formatNumber
- `src/lib/api.ts` — typed fetch client (authApi, productsApi, purchasesApi, dashboardApi, earningsApi, transactionsApi, withdrawalsApi, bankAccountsApi, adminApi)
- `src/lib/store.ts` — Zustand store (user, loadingUser, view, paymentProductId, authOpen, actions: setUser, setView, startPayment, openAuth, closeAuth, refreshUser, logout)
- `src/components/earning/EmptyState.tsx` — empty state placeholder
- `src/components/earning/StatusBadge.tsx` — reusable status badge with tone helpers (purchaseStatusTone, withdrawalStatusTone, transactionStatusTone)
- `src/components/earning/StatCard.tsx` — reusable stat card with framer-motion hover lift
- `src/components/earning/Header.tsx` — sticky header with logo, desktop nav, mobile Sheet nav, balance pill, login/logout
- `src/components/earning/Footer.tsx` — footer with brand, links, min withdrawal note (mt-auto)
- `src/components/earning/AuthView.tsx` — auth dialog with Tabs (Login/Register), admin hint

## API contract verified
Confirmed backend route files exist for all endpoints listed in worklog. Purchases response shape: `{ ok, data: { purchase } }`. Withdrawals: `{ ok, data: { withdrawal } }`. Bank accounts: `{ ok, data: { account } }`. Dashboard returns `{ stats, recentTransactions, activePurchases, earnings7d }`. Admin reports returns `{ report, revenue7d, purchases7d }`. Upload returns `{ url }`.

## Remaining work
- ProductView.tsx (product page with wheat package hero + all products grid)
- PaymentView.tsx (order summary + payment method + confirm)
- DashboardView.tsx (stat cards + recharts area chart + active products + recent transactions table)
- MyProductsView.tsx (purchases table with filter tabs)
- WithdrawalView.tsx (balance + form + history table)
- AdminView.tsx (reports + products + purchases + withdrawals + users tabs)
- ImageUpload.tsx (file -> base64 -> uploadImage -> url)
- src/app/page.tsx (root SPA: header + main with AnimatePresence view switching + footer + Toaster + AuthView dialog)
