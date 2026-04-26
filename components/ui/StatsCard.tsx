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
}

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  gradient,
}: StatsCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className="glass-card p-5 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-[22px] font-bold text-gray-900 mt-1 tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <div
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold",
                  isPositive
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-500"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? "+" : ""}
                {change}%
              </div>
              <span className="text-[11px] text-gray-400">vs last week</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            iconBg
          )}
          style={gradient ? {
            background: gradient,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          } : undefined}
        >
          <Icon className={cn("w-5 h-5", gradient ? "text-white" : iconColor)} />
        </div>
      </div>
    </div>
  );
}
