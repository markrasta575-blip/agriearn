"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet,
  ArrowDownToLine,
  Landmark,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  bankAccountsApi,
  dashboardApi,
  withdrawalsApi,
} from "@/lib/api";
import { useStore } from "@/lib/store";
import {
  formatETB,
  formatDate,
  maskAccountNumber,
} from "@/lib/format";
import type {
  BankAccountPublic,
  DashboardResponse,
  WithdrawalPublic,
} from "@/lib/types";
import {
  StatusBadge,
  withdrawalStatusTone,
} from "@/components/earning/StatusBadge";
import { EmptyState } from "@/components/earning/EmptyState";

const MIN_WITHDRAWAL = 300;

export function WithdrawalView() {
  const { user, refreshUser, setView } = useStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [accounts, setAccounts] = useState<BankAccountPublic[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"saved" | "new">("new");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saveAccount, setSaveAccount] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [dash, acc, w] = await Promise.all([
        dashboardApi.get(),
        bankAccountsApi.list(),
        withdrawalsApi.list(false),
      ]);
      setDashboard(dash);
      setAccounts(acc.accounts);
      setWithdrawals(w.withdrawals);
      if (acc.accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(acc.accounts[0].id);
        setMode("saved");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const balance = dashboard?.stats.currentBalance ?? user?.balance ?? 0;
  const amountNum = Number(amount) || 0;
  const tooLow = amountNum < MIN_WITHDRAWAL;
  const tooHigh = amountNum > balance;
  const canSubmit =
    !submitting &&
    amountNum > 0 &&
    !tooLow &&
    !tooHigh &&
    (mode === "saved"
      ? !!selectedAccountId
      : bankName.trim() && accountHolder.trim() && accountNumber.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      let bank = bankName.trim();
      let holder = accountHolder.trim();
      let number = accountNumber.trim();
      if (mode === "saved") {
        const acc = accounts.find((a) => a.id === selectedAccountId);
        if (!acc) throw new Error("Select a bank account");
        bank = acc.bankName;
        holder = acc.accountHolder;
        number = acc.accountNumber;
      }
      await withdrawalsApi.create({
        amount: amountNum,
        bankName: bank,
        accountHolder: holder,
        accountNumber: number,
      });
      if (mode === "new" && saveAccount) {
        try {
          await bankAccountsApi.create({
            bankName: bank,
            accountHolder: holder,
            accountNumber: number,
          });
        } catch {
          // ignore save failures
        }
      }
      toast.success("Withdrawal request submitted");
      setAmount("");
      setBankName("");
      setAccountHolder("");
      setAccountNumber("");
      setSaveAccount(false);
      await load();
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAccount = async (id: string) => {
    try {
      await bankAccountsApi.remove(id);
      toast.success("Bank account removed");
      const remaining = accounts.filter((a) => a.id !== id);
      setAccounts(remaining);
      if (selectedAccountId === id) {
        setSelectedAccountId(remaining[0]?.id ?? "");
        if (remaining.length === 0) setMode("new");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-1"
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Withdrawals
        </h1>
        <p className="text-sm text-muted-foreground">
          Withdraw your earnings to your bank account.
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Form + balance */}
          <div className="space-y-4">
            <Card className="gold-ring gap-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Available Balance
                  </div>
                  <div className="text-3xl font-extrabold text-gold-gradient">
                    {formatETB(balance)}
                  </div>
                </div>
                <span className="flex size-11 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
                  <Wallet className="size-5" />
                </span>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold-soft/40 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-gold-deep" />
                <span>
                  Minimum withdrawal is{" "}
                  <span className="font-semibold text-foreground">
                    {formatETB(MIN_WITHDRAWAL)}
                  </span>
                  . Withdrawals are reviewed by an admin before payout.
                </span>
              </div>
            </Card>

            <Card className="gap-4 p-5">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="size-4 text-gold-deep" />
                <h3 className="text-sm font-bold text-foreground">
                  Request Withdrawal
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (ETB)</Label>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    placeholder="e.g. 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  {amount && tooLow && (
                    <p className="text-xs text-rose-600">
                      Minimum is {formatETB(MIN_WITHDRAWAL)}.
                    </p>
                  )}
                  {amount && tooHigh && (
                    <p className="text-xs text-rose-600">
                      Amount exceeds your balance.
                    </p>
                  )}
                </div>

                {accounts.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Bank Account</Label>
                    <Select
                      value={mode}
                      onValueChange={(v) => setMode(v as "saved" | "new")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value="saved">
                            {a.bankName} • {maskAccountNumber(a.accountNumber)}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Enter new account</SelectItem>
                      </SelectContent>
                    </Select>
                    {mode === "saved" && selectedAccountId && (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {accounts.find((a) => a.id === selectedAccountId)
                            ?.accountHolder}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-rose-600"
                          onClick={() => removeAccount(selectedAccountId)}
                          aria-label="Remove account"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {mode === "new" && (
                  <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bankName">Bank name</Label>
                      <Input
                        id="bankName"
                        placeholder="Commercial Bank of Ethiopia"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="holder">Account holder</Label>
                      <Input
                        id="holder"
                        placeholder="Account holder name"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="accNum">Account number</Label>
                      <Input
                        id="accNum"
                        placeholder="Account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={saveAccount}
                        onCheckedChange={(v) => setSaveAccount(v === true)}
                      />
                      Save this account for later
                    </label>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="size-4" />
                  )}
                  Withdraw {amountNum > 0 ? formatETB(amountNum) : ""}
                </Button>
              </form>
            </Card>

            {accounts.length === 0 && (
              <EmptyState
                icon={<Landmark className="size-6" />}
                title="No saved bank accounts"
                description="Enter your bank details above to withdraw. You can save them for next time."
              />
            )}
          </div>

          {/* History */}
          <Card className="gap-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Withdrawal History
              </h3>
              <span className="text-xs text-muted-foreground">
                {withdrawals.length} record{withdrawals.length === 1 ? "" : "s"}
              </span>
            </div>
            {withdrawals.length === 0 ? (
              <EmptyState
                icon={<Plus className="size-6" />}
                title="No withdrawals yet"
                description="Your withdrawal requests will appear here."
                action={
                  !user ? undefined : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setView("dashboard")}
                    >
                      Go to Dashboard
                    </Button>
                  )
                }
              />
            ) : (
              <div className="max-h-[28rem] overflow-y-auto scroll-gold rounded-xl border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-semibold text-foreground">
                          {formatETB(w.amount)}
                        </TableCell>
                        <TableCell className="text-xs">{w.bankName}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {maskAccountNumber(w.accountNumber)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={w.status}
                            tone={withdrawalStatusTone(w.status)}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(w.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
