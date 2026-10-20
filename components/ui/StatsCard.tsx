"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  gradient?: string;
  /** Key KPI: renders the number in the gold highlight colour. */
  highlight?: boolean;
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-primary-light",
  iconBg = "bg-primary/15",
  gradient,
  highlight,
}: StatsCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className={cn("rb-card p-5 group", highlight && "border-gold/30")}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-ink-soft uppercase tracking-wider">{title}</p>
          <p className={cn("text-[22px] font-bold mt-1 tabular-nums", highlight ? "dz-kpi" : "text-ink")}>{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold",
                  isPositive ? "bg-success/10 text-success border border-success/40" : "bg-danger/10 text-danger border border-danger/40"
                )}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{change}%
              </div>
              <span className="text-[11px] text-ink-faint">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
            !gradient && iconBg
          )}
          style={gradient ? { background: gradient, boxShadow: "0 4px 14px rgba(124,58,237,0.30)" } : undefined}
        >
          <Icon className={cn("w-5 h-5", gradient ? "text-white" : iconColor)} />
        </div>
      </div>
    </div>
  );
}
