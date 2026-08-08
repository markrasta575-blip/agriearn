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
  Eye,
  CircleDot,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { productsApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB } from "@/lib/format";
import { toast } from "sonner";
import type { ProductPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductView() {
  const { user, startPayment, openAuth, setView } = useStore();
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailProduct, setDetailProduct] = useState<ProductPublic | null>(null);

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
          Buy a verified agriculture investment package, get daily payouts to your
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
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className="bg-green-soft text-green-deep">
                    <Tag className="size-3" /> {featured.category}
                  </Badge>
                  {featured.status === "AVAILABLE" && (
                    <Badge className="bg-green-gradient text-white">
                      <CircleDot className="size-3" /> Available
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
                    <TrendingUp className="size-4 text-green-deep" />
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

                <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    onClick={() => handleBuy(featured)}
                    disabled={featured.status !== "AVAILABLE"}
                    className="w-full bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full font-semibold sm:w-auto sm:px-10"
                  >
                    <ShoppingCart className="size-4" />
                    Buy Now
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setDetailProduct(featured)}
                    className="w-full rounded-full border-green-deep/40 text-green-deep hover:bg-green-soft/60 sm:w-auto"
                  >
                    <Eye className="size-4" />
                    View Details
                  </Button>
                  {!user && (
                    <p className="text-center text-xs text-muted-foreground sm:text-left">
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

      {/* All Products grid (shows every product, including the featured one) */}
      {!loading && products.length > 0 && (
        <div className="mt-12">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="size-5 text-gold-deep" />
            <h3 className="text-xl font-bold text-foreground">
              All Investment Packages
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className="group flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-lg">
                  {/* Large product image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                      <Badge className="bg-green-soft text-green-deep backdrop-blur">
                        <Tag className="size-3" /> {p.category}
                      </Badge>
                      {p.status === "AVAILABLE" ? (
                        <Badge className="bg-green-gradient text-white backdrop-blur">
                          <CircleDot className="size-3" /> Available
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground backdrop-blur">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
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
                      <span className="flex items-center gap-1 rounded-full bg-green-soft px-2.5 py-0.5 text-[11px] font-semibold text-green-deep">
                        <TrendingUp className="size-3" />
                        {formatETB(p.dailyIncome)}/day
                      </span>
                    </div>
                    <div className="mt-auto flex gap-2 pt-1">
                      {/* Yellow Buy Now button */}
                      <Button
                        size="sm"
                        onClick={() => handleBuy(p)}
                        disabled={p.status !== "AVAILABLE"}
                        className="flex-1 bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
                      >
                        <ShoppingCart className="size-3.5" />
                        {p.status === "AVAILABLE" ? "Buy Now" : "Unavailable"}
                      </Button>
                      {/* View Details button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailProduct(p)}
                        className="rounded-full border-green-deep/40 text-green-deep hover:bg-green-soft/60"
                      >
                        <Eye className="size-3.5" />
                        Details
                      </Button>
                    </div>
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

      {/* Product Details dialog */}
      <ProductDetailsDialog
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onBuy={(p) => {
          setDetailProduct(null);
          handleBuy(p);
        }}
      />
    </div>
  );
}

function ProductDetailsDialog({
  product,
  onClose,
  onBuy,
}: {
  product: ProductPublic | null;
  onClose: () => void;
  onBuy: (p: ProductPublic) => void;
}) {
  return (
    <Dialog open={!!product} onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-green-gradient text-white">
              <Eye className="size-4" />
            </span>
            <span className="text-gold-gradient">Product Details</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full details for {product?.name}
          </DialogDescription>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex gap-2">
                <Badge className="bg-green-soft text-green-deep backdrop-blur">
                  <Tag className="size-3" /> {product.category}
                </Badge>
                {product.status === "AVAILABLE" && (
                  <Badge className="bg-green-gradient text-white backdrop-blur">
                    <CircleDot className="size-3" /> Available
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">
                {product.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Price
                </div>
                <div className="text-lg font-extrabold text-gold-gradient">
                  {formatETB(product.price)}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Daily Earnings
                </div>
                <div className="text-lg font-extrabold text-green-deep">
                  {formatETB(product.dailyIncome)}/day
                </div>
              </div>
            </div>
            {product.name === "Teff Investment Package" && (
              <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold-soft/40 p-3 text-sm">
                <Gift className="size-4 text-gold-deep" />
                <span className="text-foreground">
                  First activation bonus:{" "}
                  <span className="font-extrabold text-gold-deep">500 ETB</span>{" "}
                  <span className="text-xs text-muted-foreground">(credited once on first activation)</span>
                </span>
              </div>
            )}
            {product.benefits.length > 0 && (
              <ul className="grid gap-2">
                {product.benefits.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-soft text-green-deep">
                      <Check className="size-3" />
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-green-deep" />
              Payment is reviewed by admin. The package activates once approved.
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onBuy(product)}
                disabled={product.status !== "AVAILABLE"}
                className={cn(
                  "flex-1 bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full font-semibold"
                )}
              >
                <ShoppingCart className="size-4" />
                Buy Now
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
