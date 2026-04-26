"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  delivered: "bg-green-50 text-green-600 ring-green-500/10",
  completed: "bg-green-50 text-green-600 ring-green-500/10",
  in_transit: "bg-blue-50 text-blue-600 ring-blue-500/10",
  on_route: "bg-blue-50 text-blue-600 ring-blue-500/10",
  in_progress: "bg-blue-50 text-blue-600 ring-blue-500/10",
  booked: "bg-indigo-50 text-indigo-600 ring-indigo-500/10",
  accepted: "bg-cyan-50 text-cyan-600 ring-cyan-500/10",
  pending: "bg-amber-50 text-amber-600 ring-amber-500/10",
  arrived_at_office: "bg-orange-50 text-orange-600 ring-orange-500/10",
  ready_for_pickup: "bg-pink-50 text-pink-600 ring-pink-500/10",
  available: "bg-green-50 text-green-600 ring-green-500/10",
  on_duty: "bg-blue-50 text-blue-600 ring-blue-500/10",
  unavailable: "bg-gray-50 text-gray-500 ring-gray-500/10",
  failed: "bg-red-50 text-red-600 ring-red-500/10",
  cancelled: "bg-red-50 text-red-500 ring-red-500/10",
  refunded: "bg-purple-50 text-purple-600 ring-purple-500/10",
  delayed: "bg-red-50 text-red-500 ring-red-500/10",
  maintenance: "bg-orange-50 text-orange-600 ring-orange-500/10",
  idle: "bg-gray-50 text-gray-500 ring-gray-500/10",
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-50 text-gray-500 ring-gray-500/10";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ring-1 ring-inset",
        style,
        className
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: "currentColor", opacity: 0.6 }}
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}
