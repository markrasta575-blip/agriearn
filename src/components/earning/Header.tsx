"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wheat,
  LayoutDashboard,
  Package,
  Wallet,
  ShieldCheck,
  LogIn,
  LogOut,
  Menu,
  Sparkles,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useStore, type ViewKey } from "@/lib/store";
import { formatETB } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ReactNode;
  requiresLogin: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: "product", label: "Product", icon: <Package className="size-4" />, requiresLogin: false },
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" />, requiresLogin: true },
  { key: "myproducts", label: "My Products", icon: <Sparkles className="size-4" />, requiresLogin: true },
  { key: "referral", label: "Referral", icon: <Gift className="size-4" />, requiresLogin: true },
  { key: "withdrawal", label: "Withdrawal", icon: <Wallet className="size-4" />, requiresLogin: true },
  { key: "admin", label: "Admin", icon: <ShieldCheck className="size-4" />, requiresLogin: true, adminOnly: true },
];

function NavButtons({
  onMobile = false,
  isAdmin,
  activeKey,
  onNavigate,
}: {
  onMobile?: boolean;
  isAdmin: boolean;
  activeKey: ViewKey;
  onNavigate: (item: NavItem) => void;
}) {
  return (
    <nav
      className={cn(
        "items-center gap-1",
        onMobile ? "flex w-full flex-col" : "hidden md:flex"
      )}
      aria-label="Main navigation"
    >
      {NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin).map((item) => {
        const active = activeKey === item.key;
        return (
          <Button
            key={item.key}
            variant={active ? "default" : "ghost"}
            size={onMobile ? "default" : "sm"}
            onClick={() => onNavigate(item)}
            className={cn(
              "justify-start gap-2 rounded-full",
              onMobile ? "w-full" : "",
              active
                ? "bg-gold-gradient text-primary-foreground shadow-sm hover:opacity-90"
                : "text-foreground hover:bg-accent"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
}

export function Header() {
  const { user, view, setView, logout, openAuth } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const handleNav = (item: NavItem) => {
    setMobileOpen(false);
    if (item.requiresLogin && !user) {
      openAuth();
      return;
    }
    if (item.adminOnly && !isAdmin) return;
    setView(item.key);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => setView("product")}
          className="flex items-center gap-2 outline-none"
          aria-label="Go to product page"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground shadow-sm">
            <Wheat className="size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-gold-gradient">
              AgriEarn
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Earn Daily
            </span>
          </span>
        </button>

        {/* Desktop Nav */}
        <NavButtons
          isAdmin={isAdmin}
          activeKey={view}
          onNavigate={handleNav}
        />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5 sm:flex"
            >
              <Wallet className="size-3.5 text-gold-deep" />
              <span className="text-xs font-semibold text-foreground">
                {formatETB(user.balance)}
              </span>
            </motion.div>
          )}

          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void logout()}
              className="rounded-full"
              aria-label="Logout"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={openAuth}
              className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
            >
              <LogIn className="size-4" />
              <span>Login</span>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden rounded-full"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground">
                    <Wheat className="size-4" />
                  </span>
                  <span className="text-gold-gradient font-bold">AgriEarn</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {user && (
                  <div className="mb-2 flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2">
                    <span className="text-xs text-muted-foreground">Balance</span>
                    <span className="text-sm font-bold text-gold-gradient">
                      {formatETB(user.balance)}
                    </span>
                  </div>
                )}
                <NavButtons
                  onMobile
                  isAdmin={isAdmin}
                  activeKey={view}
                  onNavigate={handleNav}
                />
                <div className="mt-2 flex flex-col gap-2">
                  {user ? (
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center rounded-full"
                        onClick={() => void logout()}
                      >
                        <LogOut className="size-4" /> Logout
                      </Button>
                    </SheetClose>
                  ) : (
                    <SheetClose asChild>
                      <Button
                        onClick={openAuth}
                        className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
                      >
                        <LogIn className="size-4" /> Login / Register
                      </Button>
                    </SheetClose>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
