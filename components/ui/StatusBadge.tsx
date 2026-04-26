"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  delivered: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  in_transit: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  on_route: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  booked: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  accepted: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  arrived_at_office: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  ready_for_pickup: { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-500" },
  available: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  on_duty: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  unavailable: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  failed: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  refunded: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  delayed: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  maintenance: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  idle: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  active: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold capitalize", style.bg, style.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
