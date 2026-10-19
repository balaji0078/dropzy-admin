"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Clock, AlertCircle, Ban, CheckCircle2, Scale, Search, AlertTriangle, Handshake, Bus, Route, MapPin, Lock, Store, CheckCheck, XCircle,
  Undo2, MinusCircle, Hourglass, RefreshCw, Gavel, TimerOff, Warehouse, ShieldAlert, Contact, Wrench, CircleDollarSign, Copy, Equal,
  BadgeCheck, CircleDashed, HelpCircle, Ghost, FileWarning, Split, CircleSlash, Loader2, Send, Inbox, Pause,
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  /** Enum family, for codes shared by several enums (e.g. DISPUTED as driver vs customer label). */
  kind?: BadgeKind;
  /** Override the visible text (the icon and colour still come from the key). */
  label?: string;
  className?: string;
}

export type BadgeKind = "shipmentState" | "hold" | "driverLabel" | "customerLabel" | "paymentStatus" | "reconItem" | "generic";

// ─── legacy (lowercase) keys: unchanged ───
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
  // marketplace (PRD) statuses
  approved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  resolved: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  kyc_review: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  reserved: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  investigating: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  warehouse_hold: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  booking_confirmed: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  generated: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  allocated: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  assigned: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  open: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  blocked: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  suspended: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  high: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  low: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

// ─── core (PRD v2.0, uppercase) keys: text + icon, never colour only (CLIENT_CONTRACTS.md §1.10) ───
type Tone = "green" | "blue" | "indigo" | "amber" | "orange" | "red" | "purple" | "gray" | "teal";
const TONES: Record<Tone, string> = {
  green: "bg-green-50 text-green-800 ring-green-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
  indigo: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  red: "bg-red-50 text-red-800 ring-red-200",
  purple: "bg-purple-50 text-purple-800 ring-purple-200",
  gray: "bg-gray-100 text-gray-700 ring-gray-200",
  teal: "bg-teal-50 text-teal-800 ring-teal-200",
};
type Entry = [label: string, tone: Tone, icon: LucideIcon];

const CORE: Record<BadgeKind, Record<string, Entry>> = {
  shipmentState: {
    PAYMENT_PENDING: ["Awaiting payment", "amber", Clock],
    PAYMENT_FAILED: ["Payment failed", "red", AlertCircle],
    EXPIRED: ["Booking expired", "gray", Ban],
    BOOKED: ["Booked", "indigo", CheckCircle2],
    WEIGHT_CHECK_REQUIRED: ["Weight check required", "blue", Scale],
    WEIGHT_REVIEW: ["Weight under review", "purple", Search],
    SURCHARGE_PAYMENT_PENDING: ["Surcharge payment pending", "amber", AlertTriangle],
    READY_FOR_ORIGIN_HANDOFF: ["Ready for handover", "teal", CheckCircle2],
    ACCEPTED_AT_ORIGIN: ["Accepted at origin", "blue", Handshake],
    LOADED: ["Loaded on bus", "blue", Bus],
    IN_TRANSIT: ["In transit", "blue", Route],
    ARRIVED_AT_DESTINATION: ["Arrived at destination", "indigo", MapPin],
    WAREHOUSE_HOLD_UNPAID: ["Warehouse hold — unpaid", "red", Lock],
    WAREHOUSE_HELD_OTHER: ["Warehouse hold — other", "orange", Lock],
    READY_FOR_PICKUP: ["Ready for pickup", "green", Store],
    DELIVERED: ["Delivered", "green", CheckCheck],
    PICKED_UP: ["Picked up", "green", CheckCheck],
    CANCELLED: ["Cancelled", "gray", XCircle],
    RETURN_IN_PROGRESS: ["Return in progress", "orange", Undo2],
    RETURNED: ["Returned to sender", "gray", Undo2],
  },
  hold: {
    SURCHARGE_UNPAID: ["Unpaid surcharge", "red", CircleDollarSign],
    DISPUTE: ["Dispute", "purple", Gavel],
    IDENTITY: ["Identity", "orange", Contact],
    SAFETY: ["Safety", "red", ShieldAlert],
    OPERATIONAL: ["Operational", "amber", Wrench],
    CUTOFF_EXPIRED: ["Cutoff expired", "red", TimerOff],
  },
  driverLabel: {
    NOT_REQUESTED: ["Not requested", "gray", MinusCircle],
    AWAITING_PAYMENT: ["Awaiting payment", "amber", Hourglass],
    PAYMENT_PENDING_VERIFICATION: ["Payment pending verification", "amber", RefreshCw],
    PAID: ["Paid", "green", CheckCircle2],
    DISPUTED: ["Disputed", "purple", Gavel],
    EXPIRED_CUTOFF_PASSED: ["Expired — cutoff passed", "red", TimerOff],
    WAREHOUSE_HOLD: ["Warehouse hold", "red", Warehouse],
  },
  customerLabel: {
    NONE: ["No charge", "gray", MinusCircle],
    PAYMENT_DUE: ["Payment due", "amber", Hourglass],
    VERIFYING: ["Verifying payment", "amber", RefreshCw],
    PAYMENT_FAILED: ["Payment failed — try again", "red", AlertCircle],
    PAID: ["Paid", "green", CheckCircle2],
    WAIVED: ["Waived", "green", BadgeCheck],
    DISPUTED: ["Under dispute", "purple", Gavel],
    OVERDUE_WAREHOUSE: ["Overdue — warehouse pickup", "red", Warehouse],
  },
  paymentStatus: {
    CREATED: ["Created", "gray", CircleDashed],
    REQUIRES_ACTION: ["Requires action", "amber", Hourglass],
    PENDING_PROVIDER: ["Pending provider", "amber", RefreshCw],
    SUCCEEDED: ["Succeeded", "green", CheckCircle2],
    FAILED: ["Failed", "red", XCircle],
    CANCELLED: ["Cancelled", "gray", Ban],
    EXPIRED: ["Expired", "gray", TimerOff],
    REFUND_PENDING: ["Refund pending", "purple", Loader2],
    REFUNDED: ["Refunded", "purple", Undo2],
    PARTIALLY_REFUNDED: ["Partially refunded", "purple", Undo2],
  },
  reconItem: {
    MATCHED: ["Matched", "green", CheckCircle2],
    PROVIDER_ONLY: ["Provider only", "orange", Ghost],
    INTERNAL_ONLY: ["Internal only", "orange", Ghost],
    AMOUNT_MISMATCH: ["Amount mismatch", "red", Equal],
    STATUS_MISMATCH: ["Status mismatch", "red", Split],
    LEDGER_MISSING: ["Ledger missing", "red", FileWarning],
    LEDGER_IMBALANCE: ["Ledger imbalance", "red", Scale],
    DUPLICATE_PROVIDER_TXN: ["Duplicate provider txn", "amber", Copy],
  },
  generic: {
    OPEN: ["Open", "blue", CircleDashed],
    PAID: ["Paid", "green", CheckCircle2],
    VOID: ["Void", "gray", CircleSlash],
    WAIVED: ["Waived", "green", BadgeCheck],
    SUPERSEDED: ["Superseded", "gray", Undo2],
    CANCELLED: ["Cancelled", "gray", XCircle],
    ACTIVE: ["Active", "green", CheckCircle2],
    CLEARED: ["Cleared", "gray", CheckCheck],
    SUSPENDED: ["Suspended", "red", Pause],
    DISABLED: ["Disabled", "gray", Ban],
    PENDING: ["Pending", "amber", Hourglass],
    PROCESSED: ["Processed", "green", CheckCircle2],
    FAILED: ["Failed", "red", XCircle],
    UNDER_REVIEW: ["Under review", "purple", Search],
    RESOLVED: ["Resolved", "green", CheckCircle2],
    ASSIGNED: ["Assigned", "indigo", Contact],
    INVESTIGATING: ["Investigating", "amber", Search],
    WAITING_CUSTOMER: ["Waiting for customer", "amber", Hourglass],
    CLOSED: ["Closed", "gray", CheckCheck],
    DRAFT: ["Draft", "amber", CircleDashed],
    PUBLISHED: ["Published", "green", BadgeCheck],
    RETIRED: ["Retired", "gray", Ban],
    GENERATED: ["Generated", "blue", FileWarning],
    APPROVED: ["Approved", "indigo", BadgeCheck],
    RUNNING: ["Running", "blue", Loader2],
    COMPLETED: ["Completed", "green", CheckCircle2],
    SUCCESS: ["Success", "green", CheckCircle2],
    REJECTED: ["Rejected", "red", Ban],
    QUEUED: ["Queued", "gray", Inbox],
    SENT: ["Sent", "blue", Send],
    DELIVERED: ["Delivered", "green", CheckCheck],
    SKIPPED: ["Skipped", "gray", MinusCircle],
    DISPATCHED: ["Dispatched", "green", Send],
    DEAD: ["Dead", "red", XCircle],
    SCHEDULED: ["Scheduled", "blue", Clock],
    BOARDING: ["Boarding", "indigo", Bus],
    DEPARTED: ["Departed", "blue", Route],
    ARRIVED: ["Arrived", "green", MapPin],
    RELEASED: ["Released", "green", CheckCheck],
    RETURNED: ["Returned", "gray", Undo2],
    P1: ["P1 — urgent", "red", AlertTriangle],
    P2: ["P2 — high", "orange", AlertCircle],
    P3: ["P3 — normal", "blue", CircleDashed],
    P4: ["P4 — low", "gray", MinusCircle],
    WITHIN_TOLERANCE: ["Within tolerance", "green", CheckCircle2],
    UNDER_DECLARED: ["Lighter than declared", "green", CheckCircle2],
    OVER_WITHIN_BILLABLE: ["Within paid weight", "green", CheckCircle2],
    CHARGEABLE: ["Chargeable", "amber", CircleDollarSign],
  },
};
const SEARCH_ORDER: BadgeKind[] = ["shipmentState", "hold", "driverLabel", "paymentStatus", "reconItem", "generic", "customerLabel"];

function lookup(status: string, kind?: BadgeKind): Entry | undefined {
  if (kind) return CORE[kind][status] || CORE.generic[status];
  for (const k of SEARCH_ORDER) if (CORE[k][status]) return CORE[k][status];
  return undefined;
}

/** Label text for a core code (used in selects and copy). */
export function badgeLabel(status: string, kind?: BadgeKind): string {
  return lookup(status, kind)?.[0] || status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default function StatusBadge({ status, kind, label, className }: StatusBadgeProps) {
  const s = status || "";
  const isCore = !!kind || /^[A-Z0-9_]+$/.test(s);
  if (isCore) {
    const entry = lookup(s, kind);
    const [text, tone, Icon] = entry || [badgeLabel(s, kind), "gray" as Tone, HelpCircle];
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ring-1 ring-inset whitespace-nowrap", TONES[tone], className)}>
        <Icon className="w-3 h-3 flex-shrink-0" aria-hidden />
        {label || text}
      </span>
    );
  }
  const style = statusStyles[s] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold capitalize", style.bg, style.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      {label || s.replace(/_/g, " ")}
    </span>
  );
}
