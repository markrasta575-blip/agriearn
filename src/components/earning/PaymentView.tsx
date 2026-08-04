"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Landmark,
  Banknote,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { productsApi, purchasesApi } from "@/lib/api";
import { useStore } from "@/lib/store";
import { formatETB } from "@/lib/format";
import { toast } from "sonner";
import type { ProductPublic } from "@/lib/types";
import { cn } from "@/lib/utils";

type Method = "Bank Transfer" | "Telebirr" | "Cash";

interface MethodDef {
  value: Method;
  label: string;
  icon: React.ReactNode;
  hint: string;
  // Account the customer should send money to. null = no account shown.
  account?: {
    number: string;
    label: string;
  } | null;
}

const METHODS: MethodDef[] = [
  {
    value: "Bank Transfer",
    label: "Bank Transfer",
    icon: <Landmark className="size-4" />,
    hint: "Transfer to our bank account and paste the receipt number.",
    account: {
      number: "1000597190208",
      label: "Bank Account Number",
    },
  },
  {
    value: "Telebirr",
    label: "Telebirr",
    icon: <CreditCard className="size-4" />,
    hint: "Send via Telebirr and enter the transaction reference.",
    account: {
      number: "0960565171",
      label: "Telebirr Number",
    },
  },
  {
    value: "Cash",
    label: "Cash",
    icon: <Banknote className="size-4" />,
    hint: "Pay cash at an agent. Enter the agent receipt code.",
    account: null,
  },
];

export function PaymentView() {
  const { paymentProductId, setView } = useStore();
  const [product, setProduct] = useState<ProductPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [method, setMethod] = useState<Method>("Bank Transfer");
  const [ref, setRef] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!paymentProductId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await productsApi.get(paymentProductId);
        if (active) setProduct(res.product);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Failed to load product");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [paymentProductId]);

  const handleReceiptFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Receipt image must be under 1.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceipt(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!product) return;
    if (!ref.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }
    setSubmitting(true);
    try {
      await purchasesApi.create({
        productId: product.id,
        paymentMethod: method,
        paymentRef: ref.trim(),
      });
      setDone(true);
      toast.success("Payment submitted — awaiting admin approval.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Card className="gold-ring p-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Card className="gold-ring p-10 text-center">
          <p className="text-muted-foreground">No product selected for payment.</p>
          <Button
            className="mt-4 rounded-full bg-gold-gradient text-primary-foreground hover:opacity-90"
            onClick={() => setView("product")}
          >
            Back to Products
          </Button>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="gold-ring p-8 text-center sm:p-12">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-gold-soft text-gold-deep"
            >
              <CheckCircle2 className="size-12" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-extrabold text-foreground">
              Request Submitted
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Your payment for{" "}
              <span className="font-semibold text-foreground">{product.name}</span>{" "}
              has been received. An admin will review and activate your package
              shortly. You can track the status under My Products.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
                onClick={() => setView("dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setView("myproducts")}
              >
                View My Products
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 rounded-full"
        onClick={() => setView("product")}
      >
        <ArrowLeft className="size-4" /> Back to product
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Complete your <span className="text-gold-gradient">payment</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit a payment request. Your package will activate once an admin
          approves it.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden p-0 gold-ring">
            <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-3 p-5">
              <Badge className="bg-gold-soft text-gold-deep">{product.category}</Badge>
              <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
              <p className="line-clamp-3 text-xs text-muted-foreground">
                {product.description}
              </p>
              <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-foreground">
                    {formatETB(product.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily income</span>
                  <span className="font-semibold text-gold-deep">
                    {formatETB(product.dailyIncome)}/day
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-border/60 pt-2">
                  <span className="text-muted-foreground">Total due</span>
                  <span className="text-lg font-extrabold text-gold-gradient">
                    {formatETB(product.price)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment form */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          <Card className="p-6 gold-ring">
            <div className="mb-5">
              <h3 className="text-base font-bold text-foreground">Payment method</h3>
              <p className="text-xs text-muted-foreground">
                Choose how you want to pay.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS.map((m) => {
                const active = method === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethod(m.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-gold-deep bg-gold-soft/60 gold-ring"
                        : "border-border hover:bg-accent"
                    )}
                    aria-pressed={active}
                  >
                    <span className="flex size-8 items-center justify-center rounded-full bg-card text-gold-deep">
                      {m.icon}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              {METHODS.find((m) => m.value === method)?.hint}
            </p>

            <PaymentAccountPanel method={method} />

            <div className="mt-5 space-y-2">
              <Label htmlFor="payment-ref">Payment reference</Label>
              <Input
                id="payment-ref"
                placeholder="e.g. TX-123456789"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>

            <div className="mt-5 space-y-2">
              <Label>Receipt (optional)</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleReceiptFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="size-4" /> Upload image
                </Button>
                {receipt && (
                  <div className="relative">
                    <img
                      src={receipt}
                      alt="Receipt preview"
                      className="size-16 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                      aria-label="Remove receipt"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-card p-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-gold-deep" />
              Your request is reviewed manually. Activation typically takes a few
              minutes during business hours.
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Amount to pay
                </div>
                <div className="text-2xl font-extrabold text-gold-gradient">
                  {formatETB(product.price)}
                </div>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !ref.trim()}
                className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full px-8 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>Confirm Payment</>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Shows the destination account number for the selected payment method.
 * - Bank Transfer  -> 1000597190208  (Bank Account Number)
 * - Telebirr       -> 0960565171     (Telebirr Number)
 * - Cash           -> no account shown
 * Includes a copy-to-clipboard button.
 */
function PaymentAccountPanel({ method }: { method: Method }) {
  const def = METHODS.find((m) => m.value === method);
  const account = def?.account ?? null;

  if (!account) return null;

  return (
    <motion.div
      key={method}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mt-4 rounded-xl border border-gold/40 bg-gold-soft/40 p-4"
    >
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {account.label}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-lg font-extrabold tracking-wide text-foreground">
              {account.number}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Send{" "}
            <span className="font-semibold text-foreground">exactly</span> the
            amount shown, then paste the reference below.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(account.number);
              toast.success("Account number copied");
            } catch {
              toast.error("Could not copy — please select and copy manually");
            }
          }}
        >
          <Copy className="size-4" /> Copy
        </Button>
      </div>
    </motion.div>
  );
}
