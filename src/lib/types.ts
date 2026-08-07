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
  type: "EARNING" | "WITHDRAWAL" | "PURCHASE" | "BONUS" | "REFERRAL";
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
  // Enhanced dashboard metrics
  totalWithdrawn: number;
  weeklyIncome: number;
  monthlyIncome: number;
  totalInvestment: number;
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

// ---------------------------------------------------------------------------
// Referral system
// ---------------------------------------------------------------------------

export interface ReferralSettingsPublic {
  enabled: boolean;
  referralReward: number;
  welcomeBonus: number;
  qualifyingPrice: number;
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  referralEarnings: number;
}

export interface ReferralHistoryItem {
  id: string;
  event: string;
  amount: number;
  relatedId: string | null;
  createdAt: string;
}

export interface ReferredUserPublic {
  id: string;
  referredName: string | null;
  referredPhone: string;
  status: string;
  createdAt: string;
  rewardedAt: string | null;
}

export interface ReferralResponse {
  code: string;
  referralLink: string;
  stats: ReferralStats;
  history: ReferralHistoryItem[];
  referred: ReferredUserPublic[];
  settings: ReferralSettingsPublic;
}

export interface AdminReferralRewardPublic {
  id: string;
  referrerPhone: string;
  referrerName: string | null;
  referredPhone: string;
  amount: number;
  purchaseId: string;
  createdAt: string;
}

export interface AdminReferralPublic {
  id: string;
  referrerPhone: string;
  referrerName: string | null;
  referredPhone: string;
  referredName: string | null;
  referralCode: string;
  status: string;
  createdAt: string;
  rewardedAt: string | null;
}

export interface AdminReferralReport {
  referrals: AdminReferralPublic[];
  rewards: AdminReferralRewardPublic[];
  settings: ReferralSettingsPublic;
  stats: {
    totalReferrals: number;
    totalRewardsPaid: number;
    totalRewardsAmount: number;
    totalWelcomeBonuses: number;
    totalWelcomeBonusAmount: number;
  };
}
