// Shared API contract types for the Earning Platform.
// Used by both backend (/api/**) and frontend (SPA at /).

export type Role = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface UserPublic {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  balance: number;
  status: UserStatus;
  createdAt: string;
}

export interface ProductPublic {
  id: string;
  name: string;
  category: string;
  price: number;
  dailyIncome: number;
  description: string;
  image: string;
  benefits: string[];
  status: "AVAILABLE" | "UNAVAILABLE";
  createdAt: string;
}

export type PurchaseStatus =
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "REJECTED"
  | "COMPLETED";

export interface PurchasePublic {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  dailyIncome: number;
  status: PurchaseStatus;
  paymentMethod: string | null;
  paymentRef: string | null;
  activationDate: string | null;
  createdAt: string;
}

export interface EarningPublic {
  id: string;
  userId: string;
  purchaseId: string;
  productName: string;
  amount: number;
  date: string;
  createdAt: string;
}

export type WithdrawalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WithdrawalPublic {
  id: string;
  userId: string;
  amount: number;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  status: WithdrawalStatus;
  processedAt: string | null;
  createdAt: string;
}

export interface BankAccountPublic {
  id: string;
  userId: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  createdAt: string;
}

export interface TransactionPublic {
  id: string;
  userId: string;
  type: "EARNING" | "WITHDRAWAL" | "PURCHASE";
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REJECTED";
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  currentBalance: number;
  dailyEarnings: number;
  totalEarnings: number;
  activeProducts: number;
  withdrawalBalance: number;
  pendingWithdrawals: number;
}

export interface AdminReport {
  totalUsers: number;
  totalProducts: number;
  totalPurchases: number;
  activePurchases: number;
  pendingPayments: number;
  pendingWithdrawals: number;
  totalRevenue: number;
  totalEarningsPaid: number;
  totalWithdrawn: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
