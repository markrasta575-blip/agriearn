// Typed fetch client for the Earning Platform.
// All URLs are relative (e.g. "/api/products"). No absolute URLs / ports.
import type {
  AdminReport,
  BankAccountPublic,
  DashboardStats,
  EarningPublic,
  ProductPublic,
  PurchasePublic,
  Role,
  TransactionPublic,
  UserPublic,
  UserStatus,
  WithdrawalPublic,
} from "@/lib/types";

async function request<T>(
  url: string,
  options?: RequestInit & { json?: unknown }
): Promise<T> {
  const init: RequestInit = {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  };
  if (options?.json !== undefined) {
    init.body = JSON.stringify(options.json);
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Network request failed"
    );
  }
  let payload: { ok?: boolean; data?: T; error?: string } | null = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text) as { ok?: boolean; data?: T; error?: string };
    } catch {
      // non-JSON response
    }
  }
  if (!payload || payload.ok !== true) {
    const message =
      (payload && payload.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  // data is guaranteed by ok=true but guard anyway
  return (payload.data ?? ({} as T)) as T;
}

/* ------------------------------------------------------------------ Auth */
export const authApi = {
  register: (body: { phone: string; password: string; name?: string }) =>
    request<{ user: UserPublic }>("/api/auth/register", { json: body }),
  login: (body: { phone: string; password: string }) =>
    request<{ user: UserPublic }>("/api/auth/login", { json: body }),
  logout: () => request<Record<string, never>>("/api/auth/logout", {
    method: "POST",
  }),
  me: () =>
    request<{ user: UserPublic | null }>("/api/auth/me", { method: "GET" }),
};

/* -------------------------------------------------------------- Products */
export interface ProductPayload {
  name: string;
  category: string;
  price: number;
  dailyIncome: number;
  description: string;
  image: string;
  benefits: string[];
  status: "AVAILABLE" | "UNAVAILABLE";
}
export const productsApi = {
  list: (all = false) =>
    request<{ products: ProductPublic[] }>(
      `/api/products${all ? "?all=1" : ""}`,
      { method: "GET" }
    ),
  get: (id: string) =>
    request<{ product: ProductPublic }>(`/api/products?id=${encodeURIComponent(id)}`, {
      method: "GET",
    }),
  create: (payload: ProductPayload) =>
    request<{ product: ProductPublic }>("/api/products", {
      method: "POST",
      json: payload,
    }),
  update: (payload: Partial<ProductPayload> & { id: string }) =>
    request<{ product: ProductPublic }>("/api/products", {
      method: "PUT",
      json: payload,
    }),
  remove: (id: string) =>
    request<Record<string, never>>(`/api/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

/* ------------------------------------------------------------- Purchases */
export const purchasesApi = {
  list: (all = false) =>
    request<{ purchases: PurchasePublic[] }>(
      `/api/purchases${all ? "?all=1" : ""}`,
      { method: "GET" }
    ),
  create: (payload: {
    productId: string;
    paymentMethod: string;
    paymentRef: string;
  }) =>
    request<{ purchase: PurchasePublic }>("/api/purchases", {
      method: "POST",
      json: payload,
    }),
  approve: (id: string) =>
    request<{ purchase: PurchasePublic }>("/api/purchases/approve", {
      method: "POST",
      json: { id },
    }),
  reject: (id: string) =>
    request<{ purchase: PurchasePublic }>("/api/purchases/reject", {
      method: "POST",
      json: { id },
    }),
};

/* ----------------------------------------------- Dashboard/Earnings/Txn */
export interface DashboardResponse {
  stats: DashboardStats;
  recentTransactions: TransactionPublic[];
  activePurchases: PurchasePublic[];
  earnings7d: { date: string; total: number }[];
}
export const dashboardApi = {
  get: () =>
    request<DashboardResponse>("/api/dashboard", { method: "GET" }),
};
export const earningsApi = {
  list: (limit = 50) =>
    request<{ earnings: EarningPublic[] }>(
      `/api/earnings?limit=${limit}`,
      { method: "GET" }
    ),
};
export const transactionsApi = {
  list: (limit = 100) =>
    request<{ transactions: TransactionPublic[] }>(
      `/api/transactions?limit=${limit}`,
      { method: "GET" }
    ),
};

/* ------------------------------------------------------------ Withdrawals */
export const withdrawalsApi = {
  list: (all = false) =>
    request<{ withdrawals: WithdrawalPublic[] }>(
      `/api/withdrawals${all ? "?all=1" : ""}`,
      { method: "GET" }
    ),
  create: (payload: {
    amount: number;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  }) =>
    request<{ withdrawal: WithdrawalPublic }>("/api/withdrawals", {
      method: "POST",
      json: payload,
    }),
  approve: (id: string) =>
    request<{ withdrawal: WithdrawalPublic }>("/api/withdrawals/approve", {
      method: "POST",
      json: { id },
    }),
  reject: (id: string) =>
    request<{ withdrawal: WithdrawalPublic }>("/api/withdrawals/reject", {
      method: "POST",
      json: { id },
    }),
};

/* ----------------------------------------------------------- Bank Accounts */
export const bankAccountsApi = {
  list: () =>
    request<{ accounts: BankAccountPublic[] }>("/api/bank-accounts", {
      method: "GET",
    }),
  create: (payload: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
  }) =>
    request<{ account: BankAccountPublic }>("/api/bank-accounts", {
      method: "POST",
      json: payload,
    }),
  remove: (id: string) =>
    request<Record<string, never>>(
      `/api/bank-accounts?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    ),
};

/* ----------------------------------------------------------------- Admin */
export interface AdminReportResponse {
  report: AdminReport;
  revenue7d: { date: string; total: number }[];
  purchases7d: { date: string; total: number }[];
}
export const adminApi = {
  users: () =>
    request<{ users: UserPublic[] }>("/api/admin/users", { method: "GET" }),
  updateUser: (payload: { id: string; status: UserStatus; role?: Role }) =>
    request<{ user: UserPublic }>("/api/admin/users", {
      method: "POST",
      json: payload,
    }),
  reports: () =>
    request<AdminReportResponse>("/api/admin/reports", { method: "GET" }),
  uploadImage: (imageBase64: string, filename: string) =>
    request<{ url: string }>("/api/admin/upload", {
      method: "POST",
      json: { imageBase64, filename },
    }),
};
