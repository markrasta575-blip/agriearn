"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Loader2,
  Wheat,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB } from "@/lib/format";
import { toast } from "sonner";
import type { ProductPublic } from "@/lib/types";

export function ProductView() {
  const { user, startPayment, openAuth, setView } = useStore();
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await productsApi.list(false);
        if (active) setProducts(res.products);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Failed to load products");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleBuy = (product: ProductPublic) => {
    if (!user) {
      toast.info("Please log in to buy this package");
      openAuth();
      setView("product");
      return;
    }
    startPayment(product.id);
  };

  const featured = products[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Wheat className="size-3.5 text-gold-deep" />
          Agriculture Investment Platform
        </div>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Invest in <span className="text-gold-gradient">Agriculture</span>.
          <br className="hidden sm:block" /> Earn Every Day.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
          Buy a verified wheat investment package, get daily payouts to your
          wallet, and withdraw anytime. Transparent, asset-backed income.
        </p>
      </motion.div>

      {/* Featured Product */}
      {loading ? (
        <Card className="overflow-hidden gold-ring">
          <div className="grid gap-0 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-4 p-6 sm:p-8">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </Card>
      ) : featured ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden gold-ring">
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-muted sm:aspect-[4/3] lg:aspect-square">
                <img
                  src={featured.image}
                  alt={featured.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <Badge className="bg-background/90 text-foreground backdrop-blur">
                    <Tag className="size-3" /> {featured.category}
                  </Badge>
                  {featured.status === "AVAILABLE" && (
                    <Badge className="bg-gold-gradient text-primary-foreground">
                      Available
                    </Badge>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-gold-gradient sm:text-3xl">
                    {featured.name}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {featured.description}
                  </p>
                </div>

                <div className="flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-gold-gradient sm:text-4xl">
                    {formatETB(featured.price)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5">
                    <TrendingUp className="size-4 text-gold-deep" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Daily Earnings
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        {formatETB(featured.dailyIncome)}/day
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5">
                    <Wallet className="size-4 text-gold-deep" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Min Withdrawal
                      </div>
                      <div className="text-sm font-bold text-foreground">
                        300 ETB
                      </div>
                    </div>
                  </div>
                </div>

                {featured.benefits.length > 0 && (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {featured.benefits.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
                          <Check className="size-3" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-2">
                  <Button
                    size="lg"
                    onClick={() => handleBuy(featured)}
                    disabled={featured.status !== "AVAILABLE"}
                    className="w-full bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full font-semibold sm:w-auto sm:px-10"
                  >
                    <ShoppingCart className="size-4" />
                    Buy Now
                  </Button>
                  {!user && (
                    <p className="mt-2 text-center text-xs text-muted-foreground sm:text-left">
                      You need to log in before purchasing.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card className="gold-ring p-10 text-center text-muted-foreground">
          No products available yet. Please check back later.
        </Card>
      )}

      {/* All Products grid */}
      {!loading && products.length > 1 && (
        <div className="mt-12">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="size-5 text-gold-deep" />
            <h3 className="text-xl font-bold text-foreground">
              All Investment Packages
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(1).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group h-full overflow-hidden p-0">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <Badge className="absolute right-3 top-3 bg-background/90 text-foreground backdrop-blur">
                      {p.category}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-3 p-5">
                    <div>
                      <h4 className="line-clamp-1 font-bold text-foreground">
                        {p.name}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-extrabold text-gold-gradient">
                        {formatETB(p.price)}
                      </span>
                      <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold text-gold-deep">
                        {formatETB(p.dailyIncome)}/day
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBuy(p)}
                      disabled={p.status !== "AVAILABLE"}
                      className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
                    >
                      {p.status === "AVAILABLE" ? "Buy Now" : "Unavailable"}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state for grid */}
      {loading && (
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="mt-12 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
