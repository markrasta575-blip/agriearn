"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Coins,
  BadgeCheck,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  ShieldAlert,
  Image as ImageIcon,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adminApi,
  productsApi,
  purchasesApi,
  withdrawalsApi,
  type ProductPayload,
} from "@/lib/api";
import { formatETB, formatNumber, formatDate, shortDate } from "@/lib/format";
import type {
  AdminReport,
  ProductPublic,
  PurchasePublic,
  Role,
  UserPublic,
  UserStatus,
  WithdrawalPublic,
} from "@/lib/types";
import { StatCard } from "@/components/earning/StatCard";
import {
  StatusBadge,
  purchaseStatusTone,
  withdrawalStatusTone,
} from "@/components/earning/StatusBadge";
import { ImageUpload } from "@/components/earning/ImageUpload";

/* ============================================================ Reports Tab */
function ReportsTab() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [revenue7d, setRevenue7d] = useState<{ date: string; total: number }[]>([]);
  const [purchases7d, setPurchases7d] = useState<{ date: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminApi.reports();
        if (active) {
          setReport(res.report);
          setRevenue7d(res.revenue7d);
          setPurchases7d(res.purchases7d);
        }
      } catch (err) {
        if (active) toast.error(err instanceof Error ? err.message : "Failed to load reports");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!report) return null;

  const revenueData = revenue7d.map((r) => ({ name: shortDate(r.date), total: r.total }));
  const purchasesData = purchases7d.map((r) => ({ name: shortDate(r.date), total: r.total }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={<Users className="size-4" />} label="Users" value={formatNumber(report.totalUsers)} />
        <StatCard icon={<Package className="size-4" />} label="Products" value={formatNumber(report.totalProducts)} />
        <StatCard icon={<ShoppingCart className="size-4" />} label="Purchases" value={formatNumber(report.totalPurchases)} />
        <StatCard icon={<BadgeCheck className="size-4" />} label="Active" value={formatNumber(report.activePurchases)} />
        <StatCard icon={<Coins className="size-4" />} label="Pending Payments" value={formatNumber(report.pendingPayments)} />
        <StatCard icon={<Wallet className="size-4" />} label="Pending Withdrawals" value={formatNumber(report.pendingWithdrawals)} />
        <StatCard icon={<TrendingUp className="size-4" />} label="Revenue" value={formatETB(report.totalRevenue)} />
        <StatCard icon={<Banknote className="size-4" />} label="Withdrawn" value={formatETB(report.totalWithdrawn)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gold-ring p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Revenue (7d)</h3>
            <Badge className="bg-gold-gradient text-primary-foreground">ETB</Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.74 0.14 80)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.74 0.14 80)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 85)" />
                <XAxis dataKey="name" stroke="oklch(0.5 0.02 75)" fontSize={11} />
                <YAxis stroke="oklch(0.5 0.02 75)" fontSize={11} />
                <RTooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="oklch(0.62 0.13 75)"
                  strokeWidth={2}
                  fill="url(#goldFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="gold-ring p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Purchases (7d)</h3>
            <Badge variant="secondary">count</Badge>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchasesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 85)" />
                <XAxis dataKey="name" stroke="oklch(0.5 0.02 75)" fontSize={11} />
                <YAxis stroke="oklch(0.5 0.02 75)" fontSize={11} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="total" fill="oklch(0.74 0.14 80)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================ Products Tab */
interface ProductFormState {
  id?: string;
  name: string;
  category: string;
  price: string;
  dailyIncome: string;
  description: string;
  image: string;
  benefitsText: string;
  status: "AVAILABLE" | "UNAVAILABLE";
}

const EMPTY_FORM: ProductFormState = {
  name: "",
  category: "Agriculture",
  price: "",
  dailyIncome: "",
  description: "",
  image: "/wheat.jpg",
  benefitsText: "",
  status: "AVAILABLE",
};

function ProductDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ProductFormState | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormState>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ?? EMPTY_FORM);
  }, [initial, open]);

  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const benefits = form.benefitsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: ProductPayload = {
        name: form.name.trim(),
        category: form.category.trim() || "Agriculture",
        price: Number(form.price) || 0,
        dailyIncome: Number(form.dailyIncome) || 0,
        description: form.description,
        image: form.image || "/wheat.jpg",
        benefits,
        status: form.status,
      };
      if (form.id) {
        await productsApi.update({ id: form.id, ...payload });
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto scroll-gold sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5 text-gold-deep" />
            {form.id ? "Edit Product" : "Add Product"}
          </DialogTitle>
          <DialogDescription>
            Fill in the package details. Benefits are one per line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-cat">Category</Label>
              <Input
                id="p-cat"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  set("status", v as "AVAILABLE" | "UNAVAILABLE")
                }
              >
                <SelectTrigger id="p-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price (ETB)</Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-daily">Daily income (ETB)</Label>
              <Input
                id="p-daily"
                type="number"
                min={0}
                value={form.dailyIncome}
                onChange={(e) => set("dailyIncome", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-ben">Benefits (one per line)</Label>
            <Textarea
              id="p-ben"
              rows={4}
              value={form.benefitsText}
              onChange={(e) => set("benefitsText", e.target.value)}
              placeholder={"Earn 100 ETB every single day\nBacked by real agriculture assets"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Image</Label>
            <ImageUpload
              value={form.image}
              onChange={(url) => set("image", url)}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" />
              Upload a new image or keep the default wheat image.
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.id ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<ProductPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductFormState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productsApi.list(true);
      setProducts(res.products);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: ProductPublic) => {
    setEditing({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      dailyIncome: String(p.dailyIncome),
      description: p.description,
      image: p.image,
      benefitsText: p.benefits.join("\n"),
      status: p.status,
    });
    setDialogOpen(true);
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await productsApi.remove(id);
      toast.success("Product deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">All Products</h3>
        <Button
          onClick={openAdd}
          className="bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
        >
          <Plus className="size-4" /> Add Product
        </Button>
      </div>
      <Card className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Daily</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{formatETB(p.price)}</TableCell>
                    <TableCell>{formatETB(p.dailyIncome)}/day</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={p.status}
                        tone={p.status === "AVAILABLE" ? "green" : "muted"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete"
                          disabled={deletingId === p.id}
                          onClick={() => remove(p.id)}
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4 text-rose-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}

/* ============================================================ Purchases Tab */
function PurchasesTab() {
  const [items, setItems] = useState<PurchasePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await purchasesApi.list(true);
      setItems(res.purchases);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, kind: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (kind === "approve") await purchasesApi.approve(id);
      else await purchasesApi.reject(id);
      toast.success(kind === "approve" ? "Purchase approved" : "Purchase rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-0">
      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No purchases.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.userId.slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{p.productName}</TableCell>
                  <TableCell>{formatETB(p.price)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.paymentMethod ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={p.status.replace("_", " ")}
                      tone={purchaseStatusTone(p.status)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "PENDING_APPROVAL" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Approve"
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "approve")}
                          className="rounded-full text-emerald-600"
                        >
                          <Check className="size-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Reject"
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, "reject")}
                          className="rounded-full text-rose-600"
                        >
                          <X className="size-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/* ============================================================ Withdrawals Tab */
function WithdrawalsTab() {
  const [items, setItems] = useState<WithdrawalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await withdrawalsApi.list(true);
      setItems(res.withdrawals);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, kind: "approve" | "reject") => {
    setBusyId(id);
    try {
      if (kind === "approve") await withdrawalsApi.approve(id);
      else await withdrawalsApi.reject(id);
      toast.success(kind === "approve" ? "Withdrawal approved" : "Withdrawal rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-0">
      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No withdrawals.
                </TableCell>
              </TableRow>
            ) : (
              items.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs">{w.userId.slice(0, 8)}</TableCell>
                  <TableCell className="font-bold text-gold-deep">{formatETB(w.amount)}</TableCell>
                  <TableCell>{w.bankName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    ••••{w.accountNumber.slice(-4)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={w.status}
                      tone={withdrawalStatusTone(w.status)}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(w.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === "PENDING" ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === w.id}
                          onClick={() => act(w.id, "approve")}
                          className="rounded-full text-emerald-600"
                        >
                          <Check className="size-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === w.id}
                          onClick={() => act(w.id, "reject")}
                          className="rounded-full text-rose-600"
                        >
                          <X className="size-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/* ============================================================ Users Tab */
function UsersTab() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.users();
      setUsers(res.users);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (u: UserPublic, status: UserStatus) => {
    setBusyId(u.id);
    try {
      await adminApi.updateUser({ id: u.id, status });
      toast.success(`User ${status === "ACTIVE" ? "activated" : "suspended"}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const setRole = async (u: UserPublic, role: Role) => {
    setBusyId(u.id);
    try {
      await adminApi.updateUser({ id: u.id, status: u.status, role });
      toast.success(`Role set to ${role}`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-0">
      {loading ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No users.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                  <TableCell className="font-medium">{u.name ?? "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => setRole(u, v as Role)}
                      disabled={busyId === u.id}
                    >
                      <SelectTrigger className="h-8 w-28" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={u.status}
                      tone={u.status === "ACTIVE" ? "green" : "red"}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-gold-deep">
                    {formatETB(u.balance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === u.id}
                      onClick={() =>
                        setStatus(u, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")
                      }
                      className="rounded-full"
                    >
                      {u.status === "ACTIVE" ? (
                        <>
                          <ShieldAlert className="size-3.5 text-rose-600" /> Suspend
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="size-3.5 text-emerald-600" /> Activate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/* ============================================================ Main Admin View */
export function AdminView() {
  const [tab, setTab] = useState("reports");

  const tabs = useMemo(
    () => [
      { value: "reports", label: "Reports", icon: <TrendingUp className="size-4" /> },
      { value: "products", label: "Products", icon: <Package className="size-4" /> },
      { value: "purchases", label: "Purchases", icon: <ShoppingCart className="size-4" /> },
      { value: "withdrawals", label: "Withdrawals", icon: <Wallet className="size-4" /> },
      { value: "users", label: "Users", icon: <Users className="size-4" /> },
    ],
    []
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft/40 px-3 py-1 text-xs font-medium text-gold-deep">
          <ShieldAlert className="size-3.5" /> Admin Console
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Platform <span className="text-gold-gradient">Overview</span>
        </h1>
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto scroll-gold pb-1">
          <TabsList className="flex w-max">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="reports" className="mt-6">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="purchases" className="mt-6">
          <PurchasesTab />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-6">
          <WithdrawalsTab />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
