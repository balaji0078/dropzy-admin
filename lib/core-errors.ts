// Exact UX copy keyed by error.code (CLIENT_CONTRACTS.md §6; fallback error.message).
import { CoreApiError, SESSION_ENDED_COPY } from "./core-api";
import { formatCountdown, formatIST, formatPaise, humanize } from "./format";

export type ErrorContext = "default" | "login" | "mfa" | "release" | "receipt" | "receiverOtp" | "settlement" | "trip" | "dispute";

export interface ErrorCopy {
  title: string;
  body?: string;
  correlationId?: string;
  code?: string;
}

export interface CopyVars {
  dcn?: string | null;
  thisWarehouse?: string | null;
  stateLabel?: string | null;
  warehouseName?: string | null;
  /** Resolves ids found in details (warehouse ids → names, settlement ids → statement numbers). */
  lookup?: (kind: "warehouse" | "settlement", id: string) => string | undefined;
}

export const HOLD_TYPE_LABEL: Record<string, string> = {
  SURCHARGE_UNPAID: "Unpaid surcharge",
  DISPUTE: "Dispute",
  IDENTITY: "Identity",
  SAFETY: "Safety",
  OPERATIONAL: "Operational",
  CUTOFF_EXPIRED: "Cutoff expired",
};

function fill(s: string, v: Record<string, string | number | undefined | null>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => (v[k] === undefined || v[k] === null || v[k] === "" ? `{${k}}` : String(v[k])));
}

const amountOf = (d: Record<string, any>) => (typeof d.amountDuePaise === "number" ? formatPaise(d.amountDuePaise) : "the amount due");

function holdsOf(d: Record<string, any>): { type?: string; reasonText?: string; reasonCode?: string }[] {
  if (Array.isArray(d.holds)) return d.holds;
  if (Array.isArray(d.holdTypes)) return d.holdTypes.map((t: string) => ({ type: t }));
  return [];
}

/** §6.4 RECEIVER_VERIFICATION_FAILED */
function receiverCopy(d: Record<string, any>): string {
  switch (d.reason) {
    case "EXPIRED":
      return "OTP expired. Send a new OTP.";
    case "LOCKED":
      return "Too many wrong attempts. Send a new OTP.";
    case "NOT_ISSUED":
      return "Send an OTP to the receiver first.";
    default:
      return `Incorrect OTP. ${d.attemptsRemaining ?? "No"} attempts left.`;
  }
}

/** Copy for a gate blocker or an error code (release/receipt contexts use §6.5/§6.6). */
export function copyForCode(code: string, details: Record<string, any> = {}, ctx: ErrorContext = "default", vars: CopyVars = {}, fallback?: string): ErrorCopy {
  const d = details || {};
  const holds = holdsOf(d);
  const warehouseName =
    d.warehouseName || vars.warehouseName || (d.warehouseId && vars.lookup?.("warehouse", d.warehouseId)) || "the destination warehouse";
  switch (code) {
    case "SESSION_REVOKED":
      return { title: SESSION_ENDED_COPY };
    case "OTP_THROTTLED":
      if (ctx === "mfa") return { title: "Too many attempts. Try again later." };
      if (ctx === "receiverOtp" || ctx === "release") {
        if (d.reason === "ISSUE_CAP")
          return { title: `OTP limit reached for this parcel. Try again in ${formatCountdown((Number(d.retryAfterSeconds) || 0) * 1000)}.` };
        if (d.reason === "SHIPMENT_LOCKED") return { title: "Too many wrong OTPs for this parcel. Operations must verify the receiver before it can be released." };
        return { title: `Please wait ${d.retryAfterSeconds ?? 30} s before sending another OTP.` };
      }
      return { title: `Too many attempts. Try again in ${d.retryAfterSeconds ?? 60} s.` };
    case "OTP_INVALID":
      return { title: `Incorrect code. ${d.attemptsRemaining ?? "No"} attempts left.` };
    case "OTP_EXPIRED":
      return { title: "Code expired. Tap Resend." };
    case "SURCHARGE_PAYMENT_REQUIRED":
      if (ctx === "release")
        return {
          title: `Release blocked: extra weight charge of ${amountOf(d)} is unpaid.`,
          body: fill(
            "Ask the customer to pay in the Dropzy app (Parcel {dcn} → Pay now). Cash and screenshots cannot be accepted. This screen updates automatically once the payment is verified.",
            { dcn: vars.dcn || "this parcel" },
          ),
        };
      return { title: `Cannot proceed: extra weight charge of ${amountOf(d)} is unpaid. Ask the customer to pay in the Dropzy app. Do not accept cash or screenshots.` };
    case "PAYMENT_PENDING":
      if (ctx === "release") return { title: "Release blocked: payment is being verified.", body: "Wait until it shows Paid (usually under a minute). Do not accept screenshots." };
      if (d.reason === "PROVIDER_PENDING" || d.reason === "CAPTURED_DURING_CANCEL") return { title: "Payment in progress — wait for verification before re-weighing." };
      return { title: "Cannot proceed yet: the payment is being verified. Wait for 'Paid'." };
    case "WAREHOUSE_HOLD_ACTIVE": {
      if (ctx === "release") {
        const h = holds[0] || {};
        const label = HOLD_TYPE_LABEL[h.type || ""] || humanize(h.type || "Active");
        const reasonText = (h.reasonText || humanize(h.reasonCode || "") || "A hold is active").replace(/\.$/, "");
        return { title: `Release blocked: ${label} hold.`, body: `${reasonText}. Only an operations manager can clear this hold.` };
      }
      const types = holds.map((h) => HOLD_TYPE_LABEL[h.type || ""] || humanize(h.type)).join(", ") || "active hold";
      return { title: `This parcel is on hold (${types}). Do not load or hand over. Contact operations.` };
    }
    case "WAREHOUSE_LOCATION_MISMATCH":
      if (ctx === "receipt") {
        const expected =
          d.expectedWarehouseName || (d.expectedWarehouseId && vars.lookup?.("warehouse", d.expectedWarehouseId)) || d.warehouseName || "another warehouse";
        return { title: `This parcel is destined for ${expected}, not this warehouse.` };
      }
      return {
        title: `This parcel is not recorded at ${vars.thisWarehouse || "this warehouse"}.`,
        body: "Check the DCN. Receive the parcel first if it has just arrived.",
      };
    case "TRIP_ASSIGNMENT_MISMATCH":
      if (ctx === "release" || ctx === "receipt" || ctx === "receiverOtp" || d.scope === "WAREHOUSE") return { title: "You are not assigned to this warehouse." };
      return { title: "This parcel is not on your trip." };
    case "RECEIVER_VERIFICATION_FAILED":
      return { title: receiverCopy(d) };
    case "SHIPMENT_STATE_CONFLICT":
      if (ctx === "receipt" && d.reason === "NORMAL_HANDOVER_AVAILABLE")
        return { title: "This parcel has no hold and can be handed over at the stop. Receive it only if the driver reports the receiver did not come." };
      if (ctx === "release")
        return { title: `This parcel cannot be released in its current state (${vars.stateLabel || humanize(d.currentState) || "unknown"}).` };
      if (ctx === "trip" && d.reason === "TRIP_HAS_ACCEPTED_PARCELS") return { title: "Reassign the accepted parcels first." };
      return { title: "This parcel was updated by someone else. Showing the latest status." };
    case "WAIVER_LIMIT_EXCEEDED":
      return {
        title: `This change of ${typeof d.reductionPaise === "number" ? formatPaise(d.reductionPaise) : "this amount"} exceeds your approval limit of ${
          typeof d.limitPaise === "number" ? formatPaise(d.limitPaise) : "your role"
        }. Ask an admin.`,
      };
    case "REFUND_EXCEEDS_REFUNDABLE":
      return { title: `Only ${typeof d.refundablePaise === "number" ? formatPaise(d.refundablePaise) : "the refundable amount"} can still be refunded on this payment.` };
    case "SETTLEMENT_PERIOD_OVERLAP": {
      const ids: string[] = Array.isArray(d.overlappingSettlementIds) ? d.overlappingSettlementIds : [];
      const num = d.statementNumber || (ids[0] && vars.lookup?.("settlement", ids[0])) || ids[0] || "another statement";
      return { title: `This period overlaps statement ${num}. Void it first or choose another period.` };
    }
    case "WEIGHT_MEASUREMENT_REQUIRED":
      return { title: "Weigh the parcel before accepting it." };
    case "PAYMENT_DEADLINE_EXPIRED":
      return { title: "Payment deadline passed. Do not load. Contact operations." };
    case "WAREHOUSE_TRANSFER_REQUIRED":
      return { title: `Do not hand over. Take this parcel to ${warehouseName}.` };
    case "SURCHARGE_ALREADY_SETTLED":
      return { title: "The charge is already settled. Weight cannot be changed now; ask operations if it is wrong." };
    case "ACTUAL_WEIGHT_INVALID":
      return { title: "Enter the scale reading: whole grams (g) or kilograms with up to 3 decimals (kg), between 1 g and 50 kg." };
    case "EVIDENCE_REQUIRED":
      return { title: "Take a photo of the scale reading to continue." };
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return { title: "Payments are temporarily unavailable. Your parcel stays on hold until payment is confirmed. Try again in a few minutes or contact support." };
    case "DISPUTE_NOT_ALLOWED":
      return { title: "This charge cannot be disputed now." };
    case "CAPACITY_UNAVAILABLE":
      return { title: "This bus is now full. Please choose another trip." };
    case "BOOKING_NOT_CANCELLABLE":
      return { title: "This booking can no longer be cancelled because the parcel has been handed over." };
    case "VALIDATION_ERROR": {
      if (ctx === "receipt" && (d.field === "deliveredByUserId" || (Array.isArray(d.fieldErrors) && d.fieldErrors.some((f: any) => f.field === "deliveredByUserId"))))
        return { title: "Select the driver handing over this parcel." };
      if (typeof d.maxCutoffAt === "string") return { title: `${fallback || "Invalid cutoff."} Latest allowed cutoff: ${formatIST(d.maxCutoffAt)}.` };
      const fe = Array.isArray(d.fieldErrors) ? d.fieldErrors : [];
      if (fe.length) return { title: fallback || "Please correct the highlighted fields.", body: fe.map((f: any) => `${f.field}: ${f.message || f.rule}`).join("; ") };
      return { title: fallback || "Please check the form and try again." };
    }
    default:
      return { title: fallback || humanize(code) };
  }
}

/** Copy for a thrown error (CoreApiError or anything else). */
export function errorCopy(err: unknown, ctx: ErrorContext = "default", vars: CopyVars = {}): ErrorCopy {
  if (err instanceof CoreApiError) {
    const c = copyForCode(err.code, err.details, ctx, vars, err.message);
    return { ...c, correlationId: err.correlationId, code: err.code };
  }
  return { title: err instanceof Error ? err.message : "Something went wrong." };
}

export function errorText(err: unknown, ctx: ErrorContext = "default", vars: CopyVars = {}): string {
  const c = errorCopy(err, ctx, vars);
  return c.body ? `${c.title} ${c.body}` : c.title;
}
