"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { Header } from "@/components/earning/Header";
import { Footer } from "@/components/earning/Footer";
import { AuthDialog } from "@/components/earning/AuthView";
import { ProductView } from "@/components/earning/ProductView";
import { PaymentView } from "@/components/earning/PaymentView";
import { DashboardView } from "@/components/earning/DashboardView";
import { MyProductsView } from "@/components/earning/MyProductsView";
import { WithdrawalView } from "@/components/earning/WithdrawalView";
import { ReferralView } from "@/components/earning/ReferralView";
import { AdminView } from "@/components/earning/AdminView";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { view, user, loadingUser, refreshUser } = useStore();

  // Ensure user is loaded on mount.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const isAdmin = user?.role === "ADMIN";

  const renderView = () => {
    switch (view) {
      case "product":
        return <ProductView />;
      case "payment":
        return <PaymentView />;
      case "dashboard":
        return user ? <DashboardView /> : <ProductView />;
      case "myproducts":
        return user ? <MyProductsView /> : <ProductView />;
      case "referral":
        return user ? <ReferralView /> : <ProductView />;
      case "withdrawal":
        return user ? <WithdrawalView /> : <ProductView />;
      case "admin":
        return isAdmin ? <AdminView /> : <ProductView />;
      default:
        return <ProductView />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col gold-mesh">
      <Header />
      <main className="flex-1">
        {loadingUser ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-gold-deep" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <Footer className="mt-auto" />
      <AuthDialog />
    </div>
  );
}
