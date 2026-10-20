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

// ─── tones: dark-tinted chips (colour at ~12% fill, ~40% border, full-strength text) — customer app style ───
type Tone = "green" | "blue" | "indigo" | "amber" | "orange" | "red" | "purple" | "gray" | "teal" | "cyan" | "pink" | "gold";
const TONES: Record<Tone, string> = {
  green: "bg-success/[0.12] text-success ring-success/40",
  blue: "bg-sky-400/[0.12] text-sky-300 ring-sky-400/40",
  indigo: "bg-info/[0.14] text-info ring-info/40",
  amber: "bg-warning/[0.12] text-warning ring-warning/40",
  orange: "bg-orange-400/[0.12] text-orange-400 ring-orange-400/40",
  red: "bg-danger/[0.14] text-danger ring-danger/40",
  purple: "bg-primary/[0.16] text-primary-light ring-primary/45",
  gray: "bg-ink-soft/[0.10] text-ink-soft ring-ink-soft/35",
  teal: "bg-teal-400/[0.12] text-teal-300 ring-teal-400/40",
  cyan: "bg-cyan-400/[0.12] text-cyan-300 ring-cyan-400/40",
  pink: "bg-pink-400/[0.12] text-pink-300 ring-pink-400/40",
  gold: "bg-gold/[0.12] text-gold ring-gold/45",
};

// ─── legacy (lowercase) keys: same tones, dot + text ───
const statusStyles: Record<string, Tone> = {
  delivered: "green",
  completed: "green",
  in_transit: "blue",
  on_route: "blue",
  in_progress: "blue",
  booked: "indigo",
  accepted: "cyan",
  pending: "amber",
  arrived_at_office: "orange",
  ready_for_pickup: "pink",
  available: "green",
  on_duty: "blue",
  unavailable: "gray",
  failed: "red",
  cancelled: "red",
  refunded: "purple",
  delayed: "red",
  maintenance: "orange",
  idle: "gray",
  active: "green",
  // marketplace (PRD) statuses
  approved: "green",
  paid: "green",
  resolved: "green",
  kyc_review: "amber",
  reserved: "amber",
  investigating: "amber",
  warehouse_hold: "orange",
  booking_confirmed: "gray",
  generated: "blue",
  allocated: "blue",
  assigned: "indigo",
  open: "blue",
  blocked: "red",
  suspended: "red",
  high: "red",
  medium: "amber",
  low: "gray",
};
const DOT: Record<Tone, string> = {
  green: "bg-success", blue: "bg-sky-400", indigo: "bg-info", amber: "bg-warning", orange: "bg-orange-400", red: "bg-danger",
  purple: "bg-primary-light", gray: "bg-ink-faint", teal: "bg-teal-400", cyan: "bg-cyan-400", pink: "bg-pink-400", gold: "bg-gold",
};

// ─── core (PRD v2.0, uppercase) keys: text + icon, never colour only (CLIENT_CONTRACTS.md §1.10) ───
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
  const tone = statusStyles[s] || "gray";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold capitalize ring-1 ring-inset whitespace-nowrap", TONES[tone], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", DOT[tone])} aria-hidden />
      {label || s.replace(/_/g, " ")}
    </span>
  );
}
