"use client";

import { Wheat, ShieldCheck, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/70">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gold-gradient text-primary-foreground">
              <Wheat className="size-4" />
            </span>
            <span className="text-base font-extrabold text-gold-gradient">
              AgriEarn
            </span>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Invest in agriculture, earn daily. A modern earning platform built
            for transparent, growth-focused investors.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Notes
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-gold-deep" />
              Min withdrawal: 300 ETB
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-gold-deep" />
              Daily earnings credited automatically
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-gold-deep" />
              Admin approves all purchases &amp; payouts
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Support
          </p>
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li className="flex items-center gap-2">
              <Mail className="size-3.5 text-gold-deep" />
              support@agriearn.app
            </li>
            <li className="text-muted-foreground">Addis Ababa, Ethiopia</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} AgriEarn. All rights reserved.
          </span>
          <span className="flex items-center gap-3">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Security</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
