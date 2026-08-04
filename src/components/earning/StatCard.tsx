"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({ icon, label, value, sublabel, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className={cn("gap-2 p-5 gold-ring overflow-hidden", className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-gold-soft text-gold-deep">
            {icon}
          </span>
        </div>
        <div className="text-2xl font-bold text-gold-gradient">{value}</div>
        {sublabel && (
          <div className="text-xs text-muted-foreground">{sublabel}</div>
        )}
      </Card>
    </motion.div>
  );
}
