// Types for the Dropzy core API (docs/prd-v2/openapi.yaml, revision 2). Only the fields the portal reads are listed;
// every field is optional unless the schema marks it required, so missing data renders as "—" instead of crashing.

export type Role = "customer" | "driver" | "warehouse_staff" | "support" | "ops_manager" | "finance" | "admin";

export const SHIPMENT_STATES = [
  "PAYMENT_PENDING", "PAYMENT_FAILED", "EXPIRED", "BOOKED", "WEIGHT_CHECK_REQUIRED", "WEIGHT_REVIEW",
  "SURCHARGE_PAYMENT_PENDING", "READY_FOR_ORIGIN_HANDOFF", "ACCEPTED_AT_ORIGIN", "LOADED", "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION", "WAREHOUSE_HOLD_UNPAID", "WAREHOUSE_HELD_OTHER", "READY_FOR_PICKUP", "DELIVERED",
  "PICKED_UP", "CANCELLED", "RETURN_IN_PROGRESS", "RETURNED",
] as const;
export type ShipmentState = (typeof SHIPMENT_STATES)[number];

export const HOLD_TYPES = ["SURCHARGE_UNPAID", "DISPUTE", "IDENTITY", "SAFETY", "OPERATIONAL", "CUTOFF_EXPIRED"] as const;
export type HoldType = (typeof HOLD_TYPES)[number];

export const PAYMENT_STATUSES = [
  "CREATED", "REQUIRES_ACTION", "PENDING_PROVIDER", "SUCCEEDED", "FAILED", "CANCELLED", "EXPIRED",
  "REFUND_PENDING", "REFUNDED", "PARTIALLY_REFUNDED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DRIVER_LABELS = [
  "NOT_REQUESTED", "AWAITING_PAYMENT", "PAYMENT_PENDING_VERIFICATION", "PAID", "DISPUTED", "EXPIRED_CUTOFF_PASSED", "WAREHOUSE_HOLD",
] as const;
export type DriverPaymentLabel = (typeof DRIVER_LABELS)[number];

export const CUSTOMER_LABELS = ["NONE", "PAYMENT_DUE", "VERIFYING", "PAYMENT_FAILED", "PAID", "WAIVED", "DISPUTED", "OVERDUE_WAREHOUSE"] as const;
export type CustomerLabel = (typeof CUSTOMER_LABELS)[number];

export const RECON_ITEM_TYPES = [
  "MATCHED", "PROVIDER_ONLY", "INTERNAL_ONLY", "AMOUNT_MISMATCH", "STATUS_MISMATCH", "LEDGER_MISSING", "LEDGER_IMBALANCE", "DUPLICATE_PROVIDER_TXN",
] as const;
export type ReconItemType = (typeof RECON_ITEM_TYPES)[number];

export type ActionCode =
  | "PAY_BASE_FARE" | "PAY_SURCHARGE" | "CANCEL_BOOKING" | "OPEN_DISPUTE" | "ACK_SURCHARGE" | "ORIGIN_CHECK" | "RECORD_WEIGHT"
  | "REPORT_WEIGHT_EXCEPTION" | "ACCEPT" | "REJECT" | "LOAD" | "TRANSIT_HANDOFF" | "ARRIVE" | "DELIVER" | "WAREHOUSE_HANDOFF"
  | "ISSUE_RECEIVER_OTP" | "WAREHOUSE_RECEIVE" | "WAREHOUSE_RELOCATE" | "WAREHOUSE_RELEASE" | "PLACE_HOLD" | "CLEAR_HOLD"
  | "WAIVE_SURCHARGE" | "GRANT_LOAD_EXEMPTION" | "EXTEND_CUTOFF" | "REASSIGN_TRIP" | "RESOLVE_WEIGHT_REVIEW" | "START_RETURN"
  | "COMPLETE_RETURN" | "ADMIN_CANCEL" | "DIRECT_TO_WAREHOUSE" | "CANCEL_TRIP";

export interface PageMeta { page: number; limit: number; total: number; totalPages: number }
export interface FieldError { field: string; rule: string; message?: string }

export interface RoleGrant { id: string; role: Role; operatorId?: string | null; warehouseId?: string | null; grantedAt?: string }
export interface Me {
  id: string; phone: string; name?: string | null; email?: string | null; status?: string; mfaEnabled?: boolean;
  roles: RoleGrant[]; primaryRole?: Role;
}
export interface OtpChallenge {
  challengeId: string; phoneMasked?: string; expiresAt: string; resendAfterSeconds: number; codeLength: number; devCode?: string | null;
}
export interface AuthResult {
  mfaRequired: boolean; mfaToken?: string | null; mfaEnrolmentRequired?: boolean; accessToken?: string; accessTokenExpiresAt?: string;
  refreshToken?: string | null; refreshTokenExpiresAt?: string; isNewUser?: boolean; user?: Me;
}
export interface MfaEnrolment { otpauthUrl: string; secret: string }

export interface StopRef { id?: string; code?: string; name?: string; cityName?: string }
export interface Stop { id: string; code: string; cityCode: string; cityName: string; name: string; address?: string | null; latitude?: string | null; longitude?: string | null; active?: boolean }
export interface RouteStop { stop?: StopRef; sequence?: number; offsetMinutes?: number; allowsOrigin?: boolean; allowsDestination?: boolean }
export interface Route {
  id: string; code?: string; name?: string; operatorId?: string; operatorName?: string; loadGateEnabled?: boolean | null;
  effectiveLoadGateEnabled?: boolean; active?: boolean; stops?: RouteStop[];
}
export interface Warehouse {
  id: string; code?: string; name?: string; cityCode?: string; address?: string; openingHours?: string; phone?: string | null;
  latitude?: string | null; longitude?: string | null; stopId?: string | null; active?: boolean;
}
export interface Operator {
  id: string; code?: string; legalName?: string; displayName?: string; status?: string; gstNumber?: string | null; contactPhone?: string | null;
  settlementConfig?: { commissionBps?: number; surchargeOperatorShareBps?: number; payoutCycle?: string };
}
export interface TripAssignment { id?: string; tripId?: string; userId: string; userName?: string; assignmentRole?: "DRIVER" | "ATTENDANT"; assignedAt?: string }
export interface Trip {
  id: string; routeId?: string; routeName?: string; operatorId?: string; serviceDate?: string; departureAt?: string; arrivalAt?: string;
  bookingClosesAt?: string; status?: string; vehicleReg?: string | null; delayMinutes?: number; capacityGrams?: number; reservedGrams?: number;
  capacityParcels?: number; reservedParcels?: number; version?: number; assignments?: TripAssignment[];
}

export interface PartyView { name?: string; phone?: string; phoneMasked?: boolean }
export interface Hold {
  id: string; type: HoldType; status: "ACTIVE" | "CLEARED" | "WAIVED"; reasonCode: string; reasonText?: string | null; customerMessage?: string;
  sourceType?: string; sourceId?: string | null; loadGateExempt?: boolean; placedBy?: string | null; placedAt: string;
  clearedBy?: string | null; clearedAt?: string | null; clearReason?: string | null;
}
export interface BreakdownLine { code: "BASE_FARE" | "SURCHARGE" | "FEE" | "TAX"; label: string; amountPaise: number }
export interface SurchargeBreakdown {
  declaredWeightGrams?: number; actualWeightGrams?: number; rawDifferenceGrams?: number; toleranceGrams?: number; effectiveActualGrams?: number;
  incrementGrams?: number; billableDeclaredGrams?: number; billableActualGrams?: number; billableDifferenceGrams?: number; extraUnits?: number;
  ratePerIncrementPaise?: number; lines?: BreakdownLine[]; totalPaise?: number; currency?: string; tariffId?: string; tariffVersion?: number;
  display?: { declared?: string; actual?: string; rawDifference?: string; billableDifference?: string; total?: string };
}
export interface MeasurementEvaluation {
  declaredWeightGrams?: number; actualWeightGrams?: number; rawDifferenceGrams?: number; toleranceGrams?: number; effectiveActualGrams?: number;
  incrementGrams?: number; billableDeclaredGrams?: number; billableActualGrams?: number; billableDifferenceGrams?: number; extraUnits?: number;
  outcome?: "WITHIN_TOLERANCE" | "UNDER_DECLARED" | "OVER_WITHIN_BILLABLE" | "CHARGEABLE";
  display?: { declared?: string; actual?: string; rawDifference?: string; billableDifference?: string };
}
export interface FareBreakdown {
  billableWeightGrams?: number; units?: number; exTaxPaise?: number; taxPaise?: number; totalPaise?: number; currency?: string;
  lines?: BreakdownLine[]; totalDisplay?: string;
}
export interface SurchargeQuote {
  id: string; quoteId?: string; shipmentId?: string; version: number; measurementId?: string;
  status: "OPEN" | "PAID" | "SUPERSEDED" | "WAIVED" | "CANCELLED"; origin?: string; extraUnits?: number; surchargePaise?: number;
  feePaise?: number; taxPaise?: number; taxRateBps?: number; totalPaise: number; amountDue?: number; currency?: string; tariffVersion?: number;
  expiresAt?: string; paymentDeadline?: string; breakdown?: SurchargeBreakdown; invoiceId?: string; supersedesQuoteId?: string | null;
  supersededByQuoteId?: string | null; customerAcknowledgedAt?: string | null; createdAt?: string; settledAt?: string | null;
}
export interface PaymentIntent {
  id: string; invoiceId: string; invoiceKind?: "BASE_FARE" | "SURCHARGE"; shipmentId?: string; provider?: string; providerOrderId?: string;
  status: PaymentStatus; amountPaise: number; amountRefundedPaise?: number; currency?: string; checkoutPath?: string | null; expiresAt?: string;
  lastSyncedAt?: string | null; succeededAt?: string | null; failureCode?: string | null; failureMessage?: string | null; isOrphan?: boolean; createdAt?: string;
}
export interface InvoiceLine { lineNo?: number; lineType?: string; description?: string; quantity?: number; unitAmountPaise?: number; amountPaise?: number; taxRateBps?: number | null }
export interface Invoice {
  id: string; invoiceNumber: string; shipmentId?: string; bookingId?: string; kind: "BASE_FARE" | "SURCHARGE"; surchargeQuoteId?: string | null;
  status: "OPEN" | "PAID" | "VOID" | "WAIVED"; subtotalPaise?: number; taxPaise?: number; totalPaise: number; amountPaidPaise?: number;
  amountRefundedPaise?: number; currency?: string; dueAt?: string; paidAt?: string | null; lines?: InvoiceLine[]; activeIntent?: PaymentIntent;
}
export interface SurchargeStatus {
  driverLabel: DriverPaymentLabel; driverLabelText: string; driverLabelSubtext?: string | null; customerLabel?: CustomerLabel;
  currentQuote?: SurchargeQuote | null; invoice?: Invoice | null; latestIntent?: PaymentIntent | null; amountDuePaise?: number;
  amountDueDisplay?: string; currency?: string; paymentDeadline?: string | null; deadlinePassed?: boolean; disputed?: boolean; evaluatedAt?: string;
}
export interface WeightMeasurement {
  id: string; sequence?: number; declaredWeightGrams?: number; actualWeightGrams?: number; unitInput?: string; valueInput?: string;
  rawDifferenceGrams?: number; toleranceGrams?: number; billableDeclaredGrams?: number; billableActualGrams?: number;
  billableDifferenceGrams?: number; outcome?: string; source?: string; tariffVersion?: number; measuredBy?: string;
  measuredAtDevice?: string | null; receivedAt?: string; evidenceId?: string | null; isCurrent?: boolean;
}
export interface WeightReview {
  id: string; reasonCode?: string; measurementId?: string | null; notes?: string | null; status?: "OPEN" | "RESOLVED";
  resolution?: string | null; raisedAt?: string; resolvedAt?: string | null;
}
export interface InventoryItem {
  id?: string; shipmentId: string; dcn?: string; shipmentState?: ShipmentState; warehouseId?: string; binCode?: string; condition?: string;
  conditionNotes?: string | null; holdReason?: string; activeHoldTypes?: HoldType[]; amountDuePaise?: number; receivedAt?: string;
  receivedBy?: string; ageHours?: number; overMaxHold?: boolean; status?: "ACTIVE" | "RELEASED" | "RETURNED"; releasedAt?: string | null;
  collectorName?: string | null; receiver?: PartyView;
}
export interface BlockedAction { action: ActionCode; code: string; message: string; details?: Record<string, unknown> }
export interface ShipmentView {
  id: string; dcn?: string | null; bookingId?: string; state: ShipmentState; stateLabel: string; version: number; stateChangedAt?: string;
  createdAt?: string; route?: {
    routeId?: string; routeName?: string; operatorId?: string; operatorName?: string; tripId?: string; vehicleReg?: string | null;
    tripStatus?: string; origin?: StopRef; destination?: StopRef; plannedDepartureAt?: string; plannedArrivalAt?: string; loadGateEnabled?: boolean;
  };
  serviceOption?: string; parties?: { sender?: PartyView; receiver?: PartyView };
  parcel?: {
    category?: string; itemDescription?: string | null; declaredWeightGrams?: number; declaredWeightDisplay?: string; declaredUnitInput?: string;
    declaredValueInput?: string; billableDeclaredGrams?: number; dimensionsCm?: { length?: number; width?: number; height?: number };
  };
  weight?: { weighingRequired?: boolean; measurementCount?: number; latestMeasurement?: WeightMeasurement | null; openWeightReview?: WeightReview | null };
  baseFare?: { invoiceId?: string; totalPaise?: number; status?: string; paymentExpiresAt?: string };
  surcharge?: SurchargeStatus; cutoffAt?: string; cutoffPassed?: boolean; warehouseRequired?: boolean; warehouseRequiredReason?: string | null;
  returnLocation?: string | null; holds?: Hold[]; warehouse?: { info?: Warehouse; inventory?: InventoryItem | null } | null;
  pickupRequirements?: string[]; allowedActions: ActionCode[]; blockedActions: BlockedAction[]; serverTime: string;
}
export interface CommandResult { result: "APPLIED" | "DUPLICATE_IGNORED" | "NO_CHANGE"; fromState?: ShipmentState; custodyEventId?: string | null; shipment: ShipmentView }
export interface GateResult { allowed?: boolean; blockers?: { code: string; message?: string; details?: Record<string, unknown> }[] }
export interface GateReport { accept?: GateResult; load?: GateResult; handover?: GateResult; warehouseReceipt?: GateResult; release?: GateResult; evaluatedAt?: string }
export interface ReceiverOtpIssued {
  otpId: string; purpose: string; codeLength: number; sentTo?: string; expiresAt: string; resendAfterSeconds?: number; issuesLeft24h?: number; devCode?: string | null;
}
export interface CustodyEvent {
  id: string; eventType?: string; fromState?: string; toState?: string; actorId?: string | null; actorRole?: string | null; tripId?: string | null;
  stopId?: string | null; warehouseId?: string | null; deviceTime?: string | null; serverTime?: string; clockSkewSeconds?: number | null;
  evidenceId?: string | null; collectorName?: string | null; otpVerified?: boolean | null; reasonCode?: string | null;
}
export interface Evidence {
  id: string; kind?: string; shipmentId?: string | null; contentType?: string; sizeBytes?: number; sha256?: string; createdAt?: string;
  downloadUrl?: string; downloadUrlExpiresAt?: string;
}
export interface Dispute {
  id: string; caseNumber?: string; shipmentId?: string; dcn?: string; quoteId?: string; measurementId?: string; supportTicketId?: string | null;
  reasonCode?: string; description?: string; evidenceIds?: string[]; quoteSnapshot?: Record<string, unknown>; status?: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  holdPlaced?: boolean; assignedTo?: string | null; outcome?: string | null; resolutionReason?: string | null;
  beforeValues?: Record<string, unknown> | null; afterValues?: Record<string, unknown> | null; resolvedBy?: string | null; resolvedAt?: string | null; createdAt?: string;
}
export type TicketStatus = "OPEN" | "ASSIGNED" | "INVESTIGATING" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
export type TicketCategory = "WEIGHT_DISPUTE" | "PAYMENT" | "DAMAGE" | "LOSS" | "DELAY" | "PICKUP" | "OTHER";
export interface Ticket {
  id: string; ticketNumber?: string; category?: TicketCategory; priority?: string; status?: TicketStatus; subject?: string; shipmentId?: string | null;
  dcn?: string | null; bookingId?: string | null; invoiceId?: string | null; paymentIntentId?: string | null; customerId?: string | null;
  ownerId?: string | null; slaDueAt?: string; slaBreached?: boolean; resolution?: string | null; createdAt?: string; updatedAt?: string;
}
export interface TicketMessage { id: string; authorRole?: string | null; authorName?: string | null; visibility?: "CUSTOMER" | "INTERNAL"; body?: string; evidenceIds?: string[]; createdAt?: string }
export interface TicketDetail extends Ticket { messages?: TicketMessage[]; disputeId?: string | null }
export interface CoreNotification {
  id: string; templateCode?: string; channel?: string; recipientKind?: string; recipientMasked?: string | null; shipmentId?: string | null;
  title?: string; body?: string; data?: Record<string, unknown>; status?: string; providerRef?: string | null; retryCount?: number;
  readAt?: string | null; createdAt?: string;
}
export interface AuditLog {
  id: string; seq?: number; occurredAt?: string; actorId?: string | null; actorRole?: string | null; actorType?: string; action?: string;
  entityType?: string; entityId?: string | null; shipmentId?: string | null; beforeSummary?: Record<string, unknown> | null;
  afterSummary?: Record<string, unknown> | null; reason?: string | null; outcome?: "SUCCESS" | "REJECTED"; errorCode?: string | null; correlationId?: string | null;
}
export interface LedgerEntry {
  lineNo?: number; accountCode?: string; debitPaise?: number; creditPaise?: number; currency?: string; shipmentId?: string | null;
  invoiceId?: string | null; paymentIntentId?: string | null; operatorId?: string | null; reference?: string | null;
}
export interface LedgerTransaction { id: string; kind?: string; sourceType?: string; sourceId?: string; description?: string; currency?: string; occurredAt?: string; entries?: LedgerEntry[] }
export interface LedgerBalance { accountCode?: string; accountName?: string; accountType?: string; debitPaise?: number; creditPaise?: number; balancePaise?: number }
export interface Refund { id: string; paymentIntentId?: string; amountPaise?: number; status?: string; origin?: string; reasonCode?: string; createdAt?: string; processedAt?: string | null }
export interface Booking {
  id: string; status?: string; tripId?: string; serviceOption?: string; category?: string; itemDescription?: string; declaredWeightGrams?: number;
  declaredWeightDisplay?: string; tariffId?: string; tariffVersion?: number; baseFarePaise?: number; baseTaxPaise?: number; baseTotalPaise?: number;
  paymentExpiresAt?: string; confirmedAt?: string | null; cancelledAt?: string | null; cancelReason?: string | null; refundPaise?: number | null; createdAt?: string;
}
export interface Transition {
  fromState?: string | null; toState?: string; command?: string; actorId?: string | null; actorRole?: string | null; reason?: string | null;
  occurredAt?: string; shipmentVersion?: number;
}
export interface AdminShipmentDetail {
  shipment: ShipmentView; booking?: Booking; measurements?: WeightMeasurement[]; weightReviews?: WeightReview[]; quotes?: SurchargeQuote[];
  invoices?: Invoice[]; payments?: PaymentIntent[]; refunds?: Refund[]; holds?: Hold[]; custody?: CustodyEvent[]; transitions?: Transition[];
  disputes?: Dispute[]; inventory?: InventoryItem[]; audit?: AuditLog[]; notifications?: CoreNotification[]; evidence?: Evidence[]; ledger?: LedgerTransaction[];
}
export interface AdminShipmentRow {
  id: string; dcn?: string | null; bookingId?: string; state?: ShipmentState; customerPhoneMasked?: string; routeName?: string; operatorName?: string;
  tripId?: string; plannedDepartureAt?: string; cutoffAt?: string; declaredWeightGrams?: number; latestActualWeightGrams?: number | null;
  driverLabel?: DriverPaymentLabel; amountDuePaise?: number; activeHoldTypes?: HoldType[]; warehouseRequired?: boolean; createdAt?: string;
}
export interface WeightExceptionRow {
  shipmentId: string; dcn?: string; state?: ShipmentState; routeName?: string; operatorName?: string; tripId?: string; declaredWeightGrams?: number;
  actualWeightGrams?: number; rawDifferenceGrams?: number; quoteId?: string | null; quoteVersion?: number | null; quoteStatus?: string | null;
  amountDuePaise?: number; cutoffAt?: string; minutesToCutoff?: number; driverLabel?: DriverPaymentLabel; disputed?: boolean;
  reviewReasonCode?: string | null; measuredBy?: string; measurementCount?: number;
}
export interface UnpaidHoldRow {
  holdId: string; shipmentId: string; dcn?: string; state?: ShipmentState; location?: "ORIGIN" | "IN_TRANSIT" | "WAREHOUSE"; warehouseId?: string | null;
  amountDuePaise?: number; placedAt?: string; ageHours?: number; cutoffAt?: string; loadGateExempt?: boolean; operatorName?: string; customerPhoneMasked?: string;
}
export interface DashboardSummary {
  serverTime?: string; activeShipmentsByState?: Record<string, number>; unpaidSurchargeBeforeCutoff?: number; unpaidSurchargeCutoffPassed?: number;
  unpaidSurchargeAmountPaise?: number; paymentsPendingVerification?: number; openDisputes?: number; openWeightReviews?: number;
  warehouseHoldsByAgeBucket?: { lt24h?: number; d1to3?: number; d3to7?: number; gt7d?: number };
  todayCollections?: { baseFarePaise?: number; surchargePaise?: number; refundsPaise?: number }; openReconExceptions?: number; outboxDead?: number;
}
export interface TariffConfig {
  schemaVersion: number; currency: string;
  weight: {
    toleranceGrams?: number; billableIncrementGrams?: number; rounding?: string; minDeclaredGrams?: number; maxDeclaredGrams?: number;
    minActualGrams?: number; maxActualGrams?: number; allowedInputUnits?: string[]; maxDimensionCm?: number;
  };
  baseFare: { minChargePaise?: number; includedGrams?: number; perIncrementPaise?: number };
  surcharge: { perIncrementPaise?: number; feePaise?: number };
  tax: { name?: string; rateBps?: number; rounding?: string; applyToBaseFare?: boolean; applyToSurcharge?: boolean };
  policy: Record<string, unknown>;
}
export interface Tariff {
  id: string; code?: string; version?: number; status?: "DRAFT" | "PUBLISHED" | "RETIRED"; operatorId?: string | null; routeId?: string | null;
  effectiveFrom?: string | null; effectiveTo?: string | null; effectiveNow?: boolean; config?: TariffConfig; configHash?: string; notes?: string | null;
  createdBy?: string; createdAt?: string; publishedBy?: string | null; publishedAt?: string | null;
}
export interface TariffPreview { baseFare?: FareBreakdown; evaluation?: MeasurementEvaluation; surcharge?: SurchargeBreakdown | null }
export interface AdminUser {
  id: string; phone?: string; name?: string | null; status?: "ACTIVE" | "SUSPENDED" | "DISABLED"; mfaEnabled?: boolean; roles?: RoleGrant[];
  lastLoginAt?: string | null; createdAt?: string;
}
export interface ReconRun {
  id: string; businessDate?: string; status?: string; startedAt?: string; completedAt?: string | null; providerTxnCount?: number;
  internalTxnCount?: number; matchedCount?: number; exceptionCount?: number; totals?: Record<string, number>; error?: string | null;
}
export interface ReconItem {
  id: string; runId?: string; itemType?: ReconItemType; providerRef?: string | null; paymentIntentId?: string | null; refundId?: string | null;
  invoiceId?: string | null; providerAmountPaise?: number | null; internalAmountPaise?: number | null; ledgerAmountPaise?: number | null;
  status?: "MATCHED" | "OPEN" | "RESOLVED"; resolutionNote?: string | null; resolvedBy?: string | null; resolvedAt?: string | null;
}
export interface Settlement {
  id: string; statementNumber?: string; operatorId?: string; operatorName?: string; periodStart?: string; periodEnd?: string; currency?: string;
  shipmentCount?: number; grossBaseFarePaise?: number; commissionPaise?: number; operatorBaseSharePaise?: number; surchargeOperatorSharePaise?: number;
  refundsOperatorSharePaise?: number; netPayablePaise?: number; ledgerPayablePaise?: number; mismatchCount?: number;
  details?: Record<string, unknown>[]; status?: "GENERATED" | "APPROVED" | "PAID" | "VOID"; generatedBy?: string; approvedBy?: string | null;
  paidAt?: string | null; payoutReference?: string | null;
}
export interface SystemHealth {
  serverTime?: string; outboxPending?: number; outboxOldestPendingAgeSeconds?: number; outboxDead?: number; providerEventsInException?: number;
  providerEventsPendingRetry?: number; oldestPendingProviderIntentAgeSeconds?: number; lastWebhookReceivedAt?: string | null;
  webhookSignatureFailures24h?: number; unpaidHoldsPastCutoff?: number; warehouseItemsOverMaxHold?: number; openReconExceptions?: number;
  workers?: { name?: string; lastRunAt?: string | null; lastError?: string | null }[];
}
export interface OutboxEvent {
  id: string; eventType?: string; aggregateType?: string; aggregateId?: string; aggregateVersion?: number | null; occurredAt?: string;
  status?: "PENDING" | "DISPATCHED" | "DEAD"; attempts?: number; lastError?: string | null; payload?: Record<string, unknown>;
}
