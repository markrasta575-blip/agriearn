// Zustand store for the Earning Platform SPA.
import { create } from "zustand";
import type { UserPublic } from "@/lib/types";
import { authApi, referralsApi } from "@/lib/api";

export type ViewKey =
  | "product"
  | "dashboard"
  | "myproducts"
  | "withdrawal"
  | "admin"
  | "payment"
  | "referral";

interface AppState {
  user: UserPublic | null;
  loadingUser: boolean;
  view: ViewKey;
  paymentProductId: string | null;
  authOpen: boolean; // opens auth dialog when true
  setUser: (user: UserPublic | null) => void;
  setView: (view: ViewKey) => void;
  startPayment: (productId: string) => void;
  openAuth: () => void;
  closeAuth: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  loadingUser: true,
  view: "product",
  paymentProductId: null,
  authOpen: false,
  setUser: (user) => set({ user }),
  setView: (view) => set({ view }),
  startPayment: (productId) =>
    set({ paymentProductId: productId, view: "payment" }),
  openAuth: () => set({ authOpen: true }),
  closeAuth: () => set({ authOpen: false }),
  refreshUser: async () => {
    try {
      const res = await authApi.me();
      set({ user: res.user ?? null, loadingUser: false });
    } catch {
      set({ user: null, loadingUser: false });
    }
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    set({ user: null, view: "product" });
  },
}));

// Track a referral code from the URL (?ref=CODE) so the server stores it in a
// cookie; it is then attached to the user when they register. Also initialize
// the logged-in user on first load (client-only).
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      // Fire-and-forget — the server sets a `pending_ref` cookie (30 days).
      void referralsApi.track(ref).catch(() => {});
    }
  } catch {
    // ignore
  }
  void useStore.getState().refreshUser();
}
