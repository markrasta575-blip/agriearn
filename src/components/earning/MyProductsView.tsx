"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, CalendarDays, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { purchasesApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB, formatDate } from "@/lib/format";
import { toast } from "sonner";
import type { PurchasePublic } from "@/lib/types";
import {
  StatusBadge,
  purchaseStatusTone,
} from "@/components/earning/StatusBadge";
import { EmptyState } from "@/components/earning/EmptyState";

type Filter = "all" | "active" | "pending";

export function MyProductsView() {
  const { setView } = useStore();
  const [purchases, setPurchases] = useState<PurchasePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await purchasesApi.list(false);
        if (active) setPurchases(res.purchases);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Failed to load purchases");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = purchases.filter((p) => {
    if (filter === "active") return p.status === "ACTIVE";
    if (filter === "pending") return p.status === "PENDING_APPROVAL";
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            My <span className="text-gold-gradient">Products</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all your investment packages and their status.
          </p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No products yet"
          description="Browse available investment packages and make your first purchase to start earning daily."
          action={
            <Button
              onClick={() => setView("product")}
              className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
            >
              View Products
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }}
            >
              <Card className="h-full overflow-hidden p-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {p.productImage ? (
                    <img
                      src={p.productImage}
                      alt={p.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <StatusBadge
                      label={p.status.replace("_", " ")}
                      tone={purchaseStatusTone(p.status)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  <h3 className="line-clamp-1 font-bold text-foreground">
                    {p.productName}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-semibold text-foreground">
                        {formatETB(p.price)}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                      <div className="text-muted-foreground">Daily Income</div>
                      <div className="font-semibold text-gold-deep">
                        {formatETB(p.dailyIncome)}/day
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-3.5" />
                      <span>Ordered: {formatDate(p.createdAt)}</span>
                    </div>
                    {p.activationDate && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="size-3.5 text-emerald-600" />
                        <span className="text-foreground">
                          Active since {formatDate(p.activationDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 opacity-0" />
          Showing {filtered.length} of {purchases.length} purchases
        </div>
      )}
    </div>
  );
}
