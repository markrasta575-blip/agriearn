"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Wheat, LogIn, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authApi } from "@/lib/api";
import { useStore } from "@/lib/store";

export function AuthDialog() {
  const { authOpen, closeAuth } = useStore();
  return (
    <Dialog open={authOpen} onOpenChange={(o) => (o ? null : closeAuth())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground">
              <Wheat className="size-4" />
            </span>
            <span className="text-gold-gradient">AgriEarn Account</span>
          </DialogTitle>
          <DialogDescription>
            Sign in or create an account to start earning daily.
          </DialogDescription>
        </DialogHeader>
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
}

export function AuthForm() {
  const { setUser, setView, closeAuth, refreshUser } = useStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await authApi.login({ phone, password });
        await refreshUser();
        setUser(res.user);
        toast.success("Welcome back!");
      } else {
        const res = await authApi.register({ phone, password, name: name || undefined });
        await refreshUser();
        setUser(res.user);
        toast.success("Account created!");
      }
      closeAuth();
      setView("dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login" className="gap-1.5">
            <LogIn className="size-3.5" /> Login
          </TabsTrigger>
          <TabsTrigger value="register" className="gap-1.5">
            <UserPlus className="size-3.5" /> Register
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-phone">Phone number</Label>
              <Input
                id="login-phone"
                placeholder="09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pass">Password</Label>
              <Input
                id="login-pass"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <SubmitButton loading={loading} label="Sign In" />
          </form>
        </TabsContent>
        <TabsContent value="register" className="mt-4">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-name">Full name (optional)</Label>
              <Input
                id="reg-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-phone">Phone number</Label>
              <Input
                id="reg-phone"
                placeholder="09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-pass">Password</Label>
              <Input
                id="reg-pass"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <SubmitButton loading={loading} label="Create Account" />
          </form>
        </TabsContent>
      </Tabs>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold-soft/40 p-3 text-xs text-muted-foreground"
      >
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-deep" />
        <div>
          <p className="font-medium text-foreground">Admin demo</p>
          <p>Phone <span className="font-mono">0990000000</span> / password <span className="font-mono">admin123</span></p>
        </div>
      </motion.div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full bg-gold-gradient text-primary-foreground shadow hover:opacity-90 rounded-full"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
