"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Warehouse as WarehouseIcon, Clock3 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import DataTable from "@/components/ui/DataTable";
import StatusBadge, { badgeLabel } from "@/components/ui/StatusBadge";
import Timeline from "@/components/ui/Timeline";
import {
  Card, CorePage, ErrorBanner, JsonBlock, KV, LastSynced, Notice, RadioGroup, ReasonDialog, SelectField, Tabs, TextField, btnOutline, rowAction,
} from "@/components/core/ui";
import { Deadline, EvidenceThumb, OtpInput, SurchargeBreakdownView } from "@/components/core/domain";
import { coreAdmin, coreShipments, isCoreApiError } from "@/lib/core-api";
import type {
  ActionCode, AdminShipmentDetail, AuditLog, CoreNotification, CustodyEvent, Evidence, Hold, Invoice, LedgerTransaction, PaymentIntent,
  ReceiverOtpIssued, Refund, Role, SurchargeQuote, Transition, Trip, WeightMeasurement, WeightReview,
} from "@/lib/core-types";
import { formatIST, formatKg, formatPaise, formatSignedKg, humanize, isoToISTLocal, istLocalToISO, parseRupeesToPaise, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

type TabKey = "overview" | "weight" | "quotes" | "payments" | "custody" | "timeline" | "audit" | "notifications" | "ledger";
const TABS: { value: TabKey; label: string }[] = [
  { value: "overview", label: "Overview" }, { value: "weight", label: "Weight" }, { value: "quotes", label: "Quotes" },
  { value: "payments", label: "Payments" }, { value: "custody", label: "Custody" }, { value: "timeline", label: "Timeline" },
  { value: "audit", label: "Audit" }, { value: "notifications", label: "Notifications" }, { value: "ledger", label: "Ledger" },
];

type DialogKind =
  | "placeHold" | "identityHold" | "clearHold" | "waive" | "exemption" | "extendCutoff" | "reassign" | "resolveReview" | "divert"
  | "startReturn" | "completeReturn" | "cancel" | "openDispute";
interface DialogState { kind: DialogKind; hold?: Hold }

/** Shipment-level override buttons: action code, label, dialog, roles (CLIENT_CONTRACTS.md §4.1 P4). */
const SHIPMENT_ACTIONS: { code: ActionCode; label: string; dialog: DialogKind; roles: readonly Role[]; danger?: boolean }[] = [
  { code: "PLACE_HOLD", label: "Place hold", dialog: "placeHold", roles: WRITE_ROLES.overrides },
  { code: "PLACE_HOLD", label: "Place IDENTITY hold", dialog: "identityHold", roles: ["support"] },
  { code: "OPEN_DISPUTE", label: "Open dispute on behalf", dialog: "openDispute", roles: WRITE_ROLES.openDispute },
  { code: "EXTEND_CUTOFF", label: "Extend cutoff", dialog: "extendCutoff", roles: WRITE_ROLES.overrides },
  { code: "REASSIGN_TRIP", label: "Reassign trip", dialog: "reassign", roles: WRITE_ROLES.overrides },
  { code: "RESOLVE_WEIGHT_REVIEW", label: "Resolve weight review", dialog: "resolveReview", roles: WRITE_ROLES.overrides },
  { code: "DIRECT_TO_WAREHOUSE", label: "Direct to warehouse", dialog: "divert", roles: WRITE_ROLES.overrides },
  { code: "START_RETURN", label: "Start return", dialog: "startReturn", roles: WRITE_ROLES.overrides },
  { code: "COMPLETE_RETURN", label: "Complete return", dialog: "completeReturn", roles: WRITE_ROLES.overrides },
  { code: "ADMIN_CANCEL", label: "Cancel shipment", dialog: "cancel", roles: WRITE_ROLES.overrides, danger: true },
];

const HOLD_REASONS: Record<string, { value: string; label: string }[]> = {
  IDENTITY: [{ value: "RECEIVER_ID_MISMATCH", label: "Receiver ID mismatch" }, { value: "SENDER_ID_MISMATCH", label: "Sender ID mismatch" }, { value: "OTHER", label: "Other" }],
  SAFETY: [{ value: "SUSPECTED_PROHIBITED", label: "Suspected prohibited item" }, { value: "DAMAGED_LEAKING", label: "Damaged / leaking" }, { value: "OTHER", label: "Other" }],
  OPERATIONAL: [{ value: "CAPACITY", label: "Capacity" }, { value: "OTHER", label: "Other" }],
};
const CLEARABLE = ["IDENTITY", "SAFETY", "OPERATIONAL", "CUTOFF_EXPIRED"];
const DISPUTE_REASONS = [
  { value: "WEIGHT_INCORRECT", label: "Weight is incorrect" }, { value: "SCALE_FAULTY", label: "Scale looked faulty" },
  { value: "ALREADY_PAID", label: "I already paid" }, { value: "AMOUNT_INCORRECT", label: "Amount is incorrect" }, { value: "OTHER", label: "Other" },
];
const WAIVE_REASONS = [
  { value: "GOODWILL", label: "Goodwill" }, { value: "SCALE_ERROR", label: "Scale error" }, { value: "RETURN_WRITE_OFF", label: "Return write-off" }, { value: "OTHER", label: "Other" },
];
const WAREHOUSE_REASON_COPY: Record<string, string> = {
  CUTOFF_EXPIRED: "Extra charge not paid by the deadline.", SERVICE_OPTION: "Customer chose warehouse pickup.", HOLD_ACTIVE: "Parcel is on hold.",
  RECEIVER_NO_SHOW: "Receiver did not collect.", SUPERVISOR_DIRECTED: "Operations instruction.",
};
const RETURN_FOUR_EYES = "A different staff member must complete this return.";

/** P4 — shipment detail (GET /admin/shipments/{id}, 15 s) with tabs and reason-dialog overrides. */
function ShipmentDetailBody({ id }: { id: string }) {
  const { roles, me } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const q = useCoreQuery(() => coreAdmin.shipment(id), [id], { pollMs: 15000 });
  const d = q.data;
  const s = d?.shipment;

  const evidenceById = useMemo(() => {
    const m = new Map<string, Evidence>();
    (d?.evidence || []).forEach((e) => m.set(e.id, e));
    return m;
  }, [d?.evidence]);

  // Four-eyes for T27: the actor who started the return cannot complete it.
  const returnStartedByMe = useMemo(() => {
    const t = [...(d?.transitions || [])].reverse().find((x) => x.toState === "RETURN_IN_PROGRESS");
    return !!(t && me && t.actorId === me.id);
  }, [d?.transitions, me]);

  const actionState = (code: ActionCode) => {
    if (!s) return { visible: false, enabled: false, message: undefined as string | undefined };
    const allowed = s.allowedActions?.includes(code);
    const blocked = s.blockedActions?.find((b) => b.action === code);
    return { visible: !!allowed || !!blocked, enabled: !!allowed, message: blocked?.message };
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
        <Link href="/shipments" className={btnOutline}><ArrowLeft className="w-4 h-4" aria-hidden />All shipments</Link>
        <LastSynced at={s?.serverTime || q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {!d && q.loading && <p className="text-[13px] text-gray-500" role="status">Loading shipment…</p>}
      {d && s && (
        <>
          <div className="rb-card-flat p-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[15px] font-bold text-gray-900">{s.dcn || "(no DCN yet)"}</span>
                <StatusBadge status={s.state} kind="shipmentState" />
                {s.surcharge?.driverLabel && <StatusBadge status={s.surcharge.driverLabel} kind="driverLabel" />}
                {(s.holds || []).filter((h) => h.status === "ACTIVE").map((h) => <StatusBadge key={h.id} status={h.type} kind="hold" />)}
              </div>
              <p className="text-[13px] text-gray-600">Customer label: “{s.stateLabel}” · version {s.version}</p>
            </div>
            <div className="text-[12px] text-gray-600 text-right">
              <p>Cutoff</p>
              <Deadline at={s.cutoffAt} />
            </div>
          </div>
          {s.warehouseRequired && (
            <Notice tone="danger" title={`Warehouse pickup required${s.warehouse?.info?.name ? ` — ${s.warehouse.info.name}` : ""}`}>
              {WAREHOUSE_REASON_COPY[s.warehouseRequiredReason || ""] || humanize(s.warehouseRequiredReason)}
            </Notice>
          )}
          <Tabs label="Shipment sections" tabs={TABS} value={tab} onChange={setTab} />
          <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label}>
            {tab === "overview" && (
              <Overview d={d} roles={roles} actionState={actionState} onAction={setDialog} returnStartedByMe={returnStartedByMe} />
            )}
            {tab === "weight" && <WeightTab measurements={d.measurements || []} reviews={d.weightReviews || []} evidence={evidenceById} />}
            {tab === "quotes" && <QuotesTab quotes={d.quotes || []} />}
            {tab === "payments" && <PaymentsTab invoices={d.invoices || []} payments={d.payments || []} refunds={d.refunds || []} />}
            {tab === "custody" && <CustodyTab events={d.custody || []} evidence={evidenceById} />}
            {tab === "timeline" && <TimelineTab transitions={d.transitions || []} />}
            {tab === "audit" && <AuditTable rows={d.audit || []} />}
            {tab === "notifications" && <NotificationsTab rows={d.notifications || []} />}
            {tab === "ledger" && <LedgerTab rows={d.ledger || []} />}
          </div>
          {dialog && <ActionDialog key={`${dialog.kind}-${dialog.hold?.id || ""}`} state={dialog} detail={d} onClose={() => setDialog(null)} onDone={() => { setDialog(null); q.reload(); }} onConflict={q.reload} />}
        </>
      )}
    </>
  );
}

export default function CoreShipmentDetail({ id }: { id: string }) {
  return (
    <CorePage title="Shipment Detail" description="Weight, quotes, payments, custody, audit and ledger (FR-ADM-002)" roles={PAGE_ROLES.shipments}>
      <ShipmentDetailBody id={id} />
    </CorePage>
  );
}

// ───────────────────────────── Overview ─────────────────────────────
function Overview({ d, roles, actionState, onAction, returnStartedByMe }: {
  d: AdminShipmentDetail; roles: Role[]; returnStartedByMe: boolean;
  actionState: (c: ActionCode) => { visible: boolean; enabled: boolean; message?: string };
  onAction: (s: DialogState) => void;
}) {
  const s = d.shipment;
  const sc = s.surcharge;
  const holds = s.holds || d.holds || [];
  const active = holds.filter((h) => h.status === "ACTIVE");
  const buttons = SHIPMENT_ACTIONS.filter((a) => hasAnyRole(roles, a.roles)).map((a) => ({ ...a, st: actionState(a.code) })).filter((a) => a.st.visible);
  const canOverride = hasAnyRole(roles, WRITE_ROLES.overrides);

  const holdButtons = (h: Hold): ReactNode[] => {
    if (!canOverride || h.status !== "ACTIVE") return [];
    const out: ReactNode[] = [];
    const add = (code: ActionCode, label: string, kind: DialogKind, color: "red" | "green" | "blue" | "amber") => {
      const st = actionState(code);
      if (!st.visible) return;
      out.push(
        <span key={code} className="inline-flex flex-col">
          <button className={rowAction(color)} disabled={!st.enabled} onClick={() => onAction({ kind, hold: h })}>{label}</button>
          {st.message && <span className="text-[11px] text-gray-500 max-w-[220px]">{st.message}</span>}
        </span>,
      );
    };
    if (CLEARABLE.includes(h.type)) add("CLEAR_HOLD", "Clear", "clearHold", "blue");
    if (h.type === "SURCHARGE_UNPAID") add("WAIVE_SURCHARGE", "Waive surcharge", "waive", "green");
    if ((h.type === "SURCHARGE_UNPAID" || h.type === "DISPUTE") && !h.loadGateExempt) add("GRANT_LOAD_EXEMPTION", "Grant load exemption", "exemption", "amber");
    return out;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
      <div className="xl:col-span-2 space-y-4">
        <Card title="Shipment">
          <KV cols={3} items={[
            ["State", <StatusBadge key="s" status={s.state} kind="shipmentState" />],
            ["State changed", formatIST(s.stateChangedAt)],
            ["Created", formatIST(s.createdAt)],
            ["Route", s.route?.routeName],
            ["Operator", s.route?.operatorName],
            ["Trip", <span key="t" className="font-mono text-[12px]">{shortId(s.route?.tripId)} · {humanize(s.route?.tripStatus)}</span>],
            ["Origin", s.route?.origin?.name],
            ["Destination", s.route?.destination?.name],
            ["Vehicle", s.route?.vehicleReg],
            ["Planned departure", formatIST(s.route?.plannedDepartureAt)],
            ["Planned arrival", formatIST(s.route?.plannedArrivalAt)],
            ["Load gate", s.route?.loadGateEnabled === undefined ? "—" : s.route.loadGateEnabled ? "On" : "Off"],
            ["Service option", humanize(s.serviceOption)],
            ["Return location", s.returnLocation ? humanize(s.returnLocation) : "—"],
            ["Base fare", <span key="b">{formatPaise(s.baseFare?.totalPaise)} {s.baseFare?.status && <StatusBadge status={s.baseFare.status} kind="generic" />}</span>],
          ]} />
        </Card>

        <Card title="Parcel & parties">
          <KV cols={3} items={[
            ["Declared weight", <strong key="w">{s.parcel?.declaredWeightDisplay || formatKg(s.parcel?.declaredWeightGrams)}</strong>],
            ["Latest measured", s.weight?.latestMeasurement ? formatKg(s.weight.latestMeasurement.actualWeightGrams) : "Not measured"],
            ["Weighing required", s.weight?.weighingRequired === undefined ? "—" : s.weight.weighingRequired ? "Yes" : "No"],
            ["Category", humanize(s.parcel?.category)],
            ["Item", s.parcel?.itemDescription],
            ["Dimensions", s.parcel?.dimensionsCm ? `${s.parcel.dimensionsCm.length ?? "—"} × ${s.parcel.dimensionsCm.width ?? "—"} × ${s.parcel.dimensionsCm.height ?? "—"} cm` : "—"],
            ["Sender", `${s.parties?.sender?.name || "—"} · ${s.parties?.sender?.phone || ""}`],
            ["Receiver", `${s.parties?.receiver?.name || "—"} · ${s.parties?.receiver?.phone || ""}`],
            ["Open weight review", s.weight?.openWeightReview ? humanize(s.weight.openWeightReview.reasonCode) : "None"],
          ]} />
        </Card>

        <Card title="Holds">
          {holds.length === 0 ? (
            <p className="text-[13px] text-gray-500">No holds.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="rb-table">
                <thead><tr><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Reason</th><th scope="col">Placed</th><th scope="col">Load exemption</th><th scope="col">Actions</th></tr></thead>
                <tbody>
                  {holds.map((h) => (
                    <tr key={h.id}>
                      <td><StatusBadge status={h.type} kind="hold" /></td>
                      <td><StatusBadge status={h.status} kind="generic" /></td>
                      <td className="text-[12px]"><p className="font-medium">{humanize(h.reasonCode)}</p>{h.reasonText && <p className="text-gray-500">{h.reasonText}</p>}{h.clearReason && <p className="text-gray-500">Cleared: {h.clearReason}</p>}</td>
                      <td className="text-[12px]">{formatIST(h.placedAt)}</td>
                      <td className="text-[12px]">{h.loadGateExempt ? "Exempt" : "—"}</td>
                      <td><div className="flex flex-wrap gap-2">{holdButtons(h)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {active.length > 0 && <p className="mt-2 text-[11px] text-gray-500">SURCHARGE_UNPAID clears on verified payment or waiver; DISPUTE clears only on dispute resolution.</p>}
        </Card>

        {s.warehouse && (
          <Card title={<span className="inline-flex items-center gap-2"><WarehouseIcon className="w-4 h-4" aria-hidden />Warehouse</span>}>
            <KV cols={3} items={[
              ["Warehouse", s.warehouse.info?.name],
              ["Address", s.warehouse.info?.address],
              ["Opening hours", s.warehouse.info?.openingHours],
              ["Bin", s.warehouse.inventory?.binCode],
              ["Condition", humanize(s.warehouse.inventory?.condition)],
              ["Received", formatIST(s.warehouse.inventory?.receivedAt)],
              ["Hold reason", humanize(s.warehouse.inventory?.holdReason)],
              ["Amount due", formatPaise(s.warehouse.inventory?.amountDuePaise)],
              ["Status", s.warehouse.inventory?.status ? <StatusBadge key="st" status={s.warehouse.inventory.status} kind="generic" /> : "—"],
            ]} />
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card title="Override actions">
          {buttons.length === 0 ? (
            <p className="text-[13px] text-gray-500">No override actions are available for your role in the current state.</p>
          ) : (
            <ul className="space-y-2">
              {buttons.map((a) => {
                const fourEyes = a.code === "COMPLETE_RETURN" && returnStartedByMe;
                const enabled = a.st.enabled && !fourEyes;
                return (
                  <li key={`${a.code}-${a.dialog}`}>
                    <button
                      onClick={() => onAction({ kind: a.dialog })}
                      disabled={!enabled}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${a.danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                    >
                      {a.label}
                    </button>
                    {(fourEyes || a.st.message) && <p className="mt-1 text-[11px] text-gray-500">{fourEyes ? RETURN_FOUR_EYES : a.st.message}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Surcharge">
          {sc ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={sc.driverLabel} kind="driverLabel" label={sc.driverLabelText || undefined} />
                {sc.customerLabel && sc.customerLabel !== "NONE" && <StatusBadge status={sc.customerLabel} kind="customerLabel" />}
              </div>
              {sc.driverLabelSubtext && <p className="text-[12px] text-gray-600">{sc.driverLabelSubtext}</p>}
              <KV cols={2} items={[
                ["Amount due", sc.amountDueDisplay || formatPaise(sc.amountDuePaise)],
                ["Payment deadline", <Deadline key="dl" at={sc.paymentDeadline} />],
                ["Latest intent", sc.latestIntent ? <StatusBadge key="li" status={sc.latestIntent.status} kind="paymentStatus" /> : "—"],
                ["Invoice", sc.invoice ? `${sc.invoice.invoiceNumber} (${humanize(sc.invoice.status)})` : "—"],
              ]} />
              {sc.currentQuote && <SurchargeBreakdownView breakdown={sc.currentQuote.breakdown} quote={sc.currentQuote} />}
            </div>
          ) : (
            <p className="text-[13px] text-gray-500">No surcharge information.</p>
          )}
        </Card>

        <Card title="Allowed / blocked actions">
          <div className="flex flex-wrap gap-1 mb-2">
            {(s.allowedActions || []).length ? s.allowedActions.map((a) => <span key={a} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-800 ring-1 ring-green-200">✓ {a}</span>) : <span className="text-[12px] text-gray-500">None allowed</span>}
          </div>
          <ul className="space-y-1">
            {(s.blockedActions || []).map((b, i) => (
              <li key={i} className="text-[12px]"><span className="font-mono text-red-800">✗ {b.action}</span> <span className="text-gray-600">— {b.message}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────── tabs ─────────────────────────────
function WeightTab({ measurements, reviews, evidence }: { measurements: WeightMeasurement[]; reviews: WeightReview[]; evidence: Map<string, Evidence> }) {
  return (
    <div className="space-y-4 mt-4">
      <DataTable caption="Weight measurements" rowKey={(m) => m.id} data={measurements} emptyMessage="No measurements yet" columns={[
        { key: "seq", label: "#", render: (m: WeightMeasurement) => <span>{m.sequence}{m.isCurrent && <span className="ml-1 text-[10px] font-bold text-green-700">CURRENT</span>}</span> },
        { key: "actual", label: "Actual (entered)", render: (m: WeightMeasurement) => <span className="tabular-nums">{formatKg(m.actualWeightGrams)} <span className="text-gray-400 text-[11px]">({m.valueInput} {m.unitInput})</span></span> },
        { key: "declared", label: "Declared", render: (m: WeightMeasurement) => formatKg(m.declaredWeightGrams) },
        { key: "diff", label: "Difference", render: (m: WeightMeasurement) => formatSignedKg(m.rawDifferenceGrams) },
        { key: "billable", label: "Billable diff.", render: (m: WeightMeasurement) => formatKg(m.billableDifferenceGrams) },
        { key: "outcome", label: "Outcome", render: (m: WeightMeasurement) => (m.outcome ? <StatusBadge status={m.outcome} kind="generic" /> : "—") },
        { key: "source", label: "Source", render: (m: WeightMeasurement) => humanize(m.source) },
        { key: "by", label: "Measured by", render: (m: WeightMeasurement) => <span className="font-mono text-[11px]">{shortId(m.measuredBy)}</span> },
        { key: "time", label: "Device / server time", render: (m: WeightMeasurement) => <span className="text-[11px]">{formatIST(m.measuredAtDevice)}<br />{formatIST(m.receivedAt)}</span> },
        { key: "ev", label: "Scale photo", render: (m: WeightMeasurement) => <EvidenceThumb key={`${m.evidenceId}-${evidence.get(m.evidenceId || "")?.downloadUrl || ""}`} id={m.evidenceId} known={evidence.get(m.evidenceId || "")} /> },
      ]} />
      <DataTable caption="Weight reviews" rowKey={(r) => r.id} data={reviews} emptyMessage="No weight reviews" columns={[
        { key: "reason", label: "Review reason", render: (r: WeightReview) => humanize(r.reasonCode) },
        { key: "status", label: "Status", render: (r: WeightReview) => (r.status ? <StatusBadge status={r.status} kind="generic" /> : "—") },
        { key: "resolution", label: "Resolution", render: (r: WeightReview) => humanize(r.resolution) },
        { key: "notes", label: "Notes", render: (r: WeightReview) => <span className="text-[12px]">{r.notes || "—"}</span> },
        { key: "raised", label: "Raised", render: (r: WeightReview) => formatIST(r.raisedAt) },
        { key: "resolved", label: "Resolved", render: (r: WeightReview) => formatIST(r.resolvedAt) },
      ]} />
    </div>
  );
}

function QuotesTab({ quotes }: { quotes: SurchargeQuote[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const v = (qid?: string | null) => (qid ? `v${quotes.find((q) => q.id === qid)?.version ?? "?"}` : "—");
  const sorted = [...quotes].sort((a, b) => b.version - a.version);
  return (
    <div className="space-y-4 mt-4">
      <DataTable caption="Surcharge quote versions" rowKey={(q) => q.id} data={sorted} emptyMessage="No surcharge quotes" onRowClick={(q) => setOpen(open === q.id ? null : q.id)} columns={[
        { key: "v", label: "Version", render: (q: SurchargeQuote) => <span className="font-semibold">v{q.version}</span> },
        { key: "status", label: "Status", render: (q: SurchargeQuote) => <StatusBadge status={q.status} kind="generic" /> },
        { key: "origin", label: "Origin", render: (q: SurchargeQuote) => humanize(q.origin) },
        { key: "units", label: "Extra units", render: (q: SurchargeQuote) => q.extraUnits ?? "—" },
        { key: "total", label: "Total", render: (q: SurchargeQuote) => <span className="tabular-nums font-semibold">{formatPaise(q.totalPaise)}</span> },
        { key: "tariff", label: "Tariff", render: (q: SurchargeQuote) => `v${q.tariffVersion ?? "—"}` },
        { key: "supersedes", label: "Supersedes / by", render: (q: SurchargeQuote) => `${v(q.supersedesQuoteId)} / ${v(q.supersededByQuoteId)}` },
        { key: "created", label: "Created", render: (q: SurchargeQuote) => formatIST(q.createdAt) },
        { key: "settled", label: "Settled", render: (q: SurchargeQuote) => formatIST(q.settledAt) },
      ]} />
      {open && (() => {
        const q = quotes.find((x) => x.id === open);
        return q ? <SurchargeBreakdownView breakdown={q.breakdown} quote={q} /> : null;
      })()}
      {quotes.length > 0 && <p className="text-[11px] text-gray-500">Select a row to show its preserved breakdown.</p>}
    </div>
  );
}

function PaymentsTab({ invoices, payments, refunds }: { invoices: Invoice[]; payments: PaymentIntent[]; refunds: Refund[] }) {
  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-[13px] font-bold text-gray-900">Invoices</h3>
      <DataTable caption="Invoices" rowKey={(i) => i.id} data={invoices} emptyMessage="No invoices" columns={[
        { key: "no", label: "Invoice", render: (i: Invoice) => <span className="font-mono text-[12px]">{i.invoiceNumber}</span> },
        { key: "kind", label: "Kind", render: (i: Invoice) => humanize(i.kind) },
        { key: "status", label: "Status", render: (i: Invoice) => <StatusBadge status={i.status} kind="generic" /> },
        { key: "sub", label: "Subtotal", render: (i: Invoice) => formatPaise(i.subtotalPaise) },
        { key: "tax", label: "Tax", render: (i: Invoice) => formatPaise(i.taxPaise) },
        { key: "total", label: "Total", render: (i: Invoice) => <span className="font-semibold">{formatPaise(i.totalPaise)}</span> },
        { key: "paid", label: "Paid / refunded", render: (i: Invoice) => `${formatPaise(i.amountPaidPaise)} / ${formatPaise(i.amountRefundedPaise)}` },
        { key: "due", label: "Due", render: (i: Invoice) => formatIST(i.dueAt) },
        { key: "paidAt", label: "Paid at", render: (i: Invoice) => formatIST(i.paidAt) },
      ]} />
      <h3 className="text-[13px] font-bold text-gray-900">Payment intents</h3>
      <DataTable caption="Payment intents" rowKey={(p) => p.id} data={payments} emptyMessage="No payment intents" columns={[
        { key: "id", label: "Intent", render: (p: PaymentIntent) => <span className="font-mono text-[11px]" title={p.id}>{shortId(p.id)}</span> },
        { key: "kind", label: "For", render: (p: PaymentIntent) => humanize(p.invoiceKind) },
        { key: "status", label: "Status", render: (p: PaymentIntent) => <StatusBadge status={p.status} kind="paymentStatus" /> },
        { key: "amount", label: "Amount", render: (p: PaymentIntent) => formatPaise(p.amountPaise) },
        { key: "refunded", label: "Refunded", render: (p: PaymentIntent) => formatPaise(p.amountRefundedPaise) },
        { key: "order", label: "Provider order", render: (p: PaymentIntent) => <span className="font-mono text-[11px]">{p.providerOrderId || "—"}</span> },
        { key: "created", label: "Created / succeeded", render: (p: PaymentIntent) => <span className="text-[11px]">{formatIST(p.createdAt)}<br />{formatIST(p.succeededAt)}</span> },
        { key: "fail", label: "Failure", render: (p: PaymentIntent) => <span className="text-[11px]">{p.failureMessage || p.failureCode || (p.isOrphan ? "Orphan" : "—")}</span> },
      ]} />
      <h3 className="text-[13px] font-bold text-gray-900">Refunds</h3>
      <DataTable caption="Refunds" rowKey={(r) => r.id} data={refunds} emptyMessage="No refunds" columns={[
        { key: "amount", label: "Amount", render: (r: Refund) => formatPaise(r.amountPaise) },
        { key: "status", label: "Status", render: (r: Refund) => (r.status ? <StatusBadge status={r.status} kind="generic" /> : "—") },
        { key: "origin", label: "Origin", render: (r: Refund) => humanize(r.origin) },
        { key: "reason", label: "Reason", render: (r: Refund) => humanize(r.reasonCode) },
        { key: "intent", label: "Intent", render: (r: Refund) => <span className="font-mono text-[11px]">{shortId(r.paymentIntentId)}</span> },
        { key: "created", label: "Created / processed", render: (r: Refund) => <span className="text-[11px]">{formatIST(r.createdAt)}<br />{formatIST(r.processedAt)}</span> },
      ]} />
    </div>
  );
}

function CustodyTab({ events, evidence }: { events: CustodyEvent[]; evidence: Map<string, Evidence> }) {
  return (
    <div className="mt-4">
      <DataTable caption="Custody events" rowKey={(e) => e.id} data={events} emptyMessage="No custody events" columns={[
        { key: "type", label: "Event", render: (e: CustodyEvent) => <span className="font-medium">{humanize(e.eventType)}</span> },
        { key: "states", label: "From → to", render: (e: CustodyEvent) => <span className="text-[12px]">{e.fromState ? badgeLabel(e.fromState, "shipmentState") : "—"} → {e.toState ? badgeLabel(e.toState, "shipmentState") : "—"}</span> },
        { key: "actor", label: "Actor", render: (e: CustodyEvent) => <span className="text-[12px]">{humanize(e.actorRole)} <span className="font-mono text-gray-400">{shortId(e.actorId)}</span></span> },
        { key: "device", label: "Device time", render: (e: CustodyEvent) => <span className="text-[12px]">{formatIST(e.deviceTime)}</span> },
        { key: "server", label: "Server time", render: (e: CustodyEvent) => <span className="text-[12px]">{formatIST(e.serverTime)}</span> },
        { key: "skew", label: "Clock skew", render: (e: CustodyEvent) => {
          const sk = e.clockSkewSeconds;
          if (sk === null || sk === undefined) return "—";
          return Math.abs(sk) > 300
            ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700"><Clock3 className="w-3 h-3" aria-hidden />Skew {sk} s</span>
            : <span className="text-[12px] text-gray-500">{sk} s</span>;
        } },
        { key: "collector", label: "Collector / OTP", render: (e: CustodyEvent) => <span className="text-[12px]">{e.collectorName || "—"}{e.otpVerified ? " · OTP ✓" : ""}</span> },
        { key: "reason", label: "Reason", render: (e: CustodyEvent) => humanize(e.reasonCode) },
        { key: "ev", label: "Evidence", render: (e: CustodyEvent) => (e.evidenceId ? <EvidenceThumb id={e.evidenceId} size={48} known={evidence.get(e.evidenceId)} /> : "—") },
      ]} />
      <p className="mt-2 text-[11px] text-gray-500">Device times are recorded but never used for decisions; skew above 5 minutes is flagged.</p>
    </div>
  );
}

function TimelineTab({ transitions }: { transitions: Transition[] }) {
  return (
    <Card className="mt-4">
      <Timeline
        emptyMessage="No transitions recorded"
        items={transitions.map((t, i) => ({
          key: `${t.occurredAt}-${i}`,
          title: <span>{t.fromState ? badgeLabel(t.fromState, "shipmentState") : "Created"} → {badgeLabel(t.toState || "", "shipmentState")}</span>,
          subtitle: `${formatIST(t.occurredAt)} · ${humanize(t.command)} · ${humanize(t.actorRole) || "System"}${t.shipmentVersion !== undefined ? ` · v${t.shipmentVersion}` : ""}`,
          detail: t.reason ? `Reason: ${t.reason}` : undefined,
          tone: t.toState === "CANCELLED" || t.toState === "WAREHOUSE_HOLD_UNPAID" ? "warning" : "default",
        }))}
      />
    </Card>
  );
}

export function AuditTable({ rows, page, totalPages, onPageChange, loading }: { rows: AuditLog[]; page?: number; totalPages?: number; onPageChange?: (p: number) => void; loading?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-4 space-y-3">
      <DataTable
        caption="Audit log"
        rowKey={(a) => a.id}
        data={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        emptyMessage="No audit entries"
        onRowClick={(a) => setOpen(open === a.id ? null : a.id)}
        rowClassName={(a) => (a.outcome === "REJECTED" ? "bg-red-50 hover:!bg-red-100" : undefined)}
        columns={[
          { key: "time", label: "Time", render: (a: AuditLog) => <span className="text-[12px] whitespace-nowrap">{formatIST(a.occurredAt)}</span> },
          { key: "actor", label: "Actor", render: (a: AuditLog) => <span className="text-[12px]">{humanize(a.actorRole || a.actorType)} <span className="font-mono text-gray-400">{shortId(a.actorId)}</span></span> },
          { key: "action", label: "Action", render: (a: AuditLog) => <span className="font-mono text-[12px]">{a.action}</span> },
          { key: "entity", label: "Entity", render: (a: AuditLog) => <span className="text-[12px]">{a.entityType} <span className="font-mono text-gray-400">{shortId(a.entityId)}</span></span> },
          { key: "outcome", label: "Outcome", render: (a: AuditLog) => (a.outcome ? <StatusBadge status={a.outcome} kind="generic" /> : "—") },
          { key: "error", label: "Error", render: (a: AuditLog) => <span className="font-mono text-[11px] text-red-700">{a.errorCode || ""}</span> },
          { key: "reason", label: "Reason", render: (a: AuditLog) => <span className="text-[12px]">{a.reason || "—"}</span> },
          { key: "corr", label: "Correlation", render: (a: AuditLog) => <span className="font-mono text-[10px] text-gray-500 select-all">{a.correlationId || "—"}</span> },
        ]}
      />
      {open && (() => {
        const a = rows.find((x) => x.id === open);
        return a ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card title="Before"><JsonBlock value={a.beforeSummary} /></Card>
            <Card title="After"><JsonBlock value={a.afterSummary} /></Card>
          </div>
        ) : null;
      })()}
    </div>
  );
}

function NotificationsTab({ rows }: { rows: CoreNotification[] }) {
  return (
    <div className="mt-4">
      <DataTable caption="Notifications" rowKey={(n) => n.id} data={rows} emptyMessage="No notifications" columns={[
        { key: "time", label: "Created", render: (n: CoreNotification) => <span className="text-[12px]">{formatIST(n.createdAt)}</span> },
        { key: "tpl", label: "Template", render: (n: CoreNotification) => <span className="font-mono text-[12px]">{n.templateCode}</span> },
        { key: "channel", label: "Channel", render: (n: CoreNotification) => n.channel },
        { key: "to", label: "Recipient", render: (n: CoreNotification) => <span className="text-[12px]">{humanize(n.recipientKind)} <span className="font-mono">{n.recipientMasked || ""}</span></span> },
        { key: "title", label: "Title", render: (n: CoreNotification) => <span className="text-[12px]">{n.title}</span> },
        { key: "status", label: "Status", render: (n: CoreNotification) => (n.status ? <StatusBadge status={n.status} kind="generic" /> : "—") },
      ]} />
    </div>
  );
}

export function LedgerTab({ rows }: { rows: LedgerTransaction[] }) {
  return (
    <div className="mt-4 space-y-3">
      {rows.length === 0 && <p className="text-[13px] text-gray-500">No ledger transactions.</p>}
      {rows.map((t) => (
        <Card key={t.id} title={<span>{humanize(t.kind)} <span className="text-[12px] font-normal text-gray-500">· {formatIST(t.occurredAt)}</span></span>}>
          {t.description && <p className="text-[12px] text-gray-600 mb-2">{t.description}</p>}
          <table className="rb-table">
            <thead><tr><th scope="col">Account</th><th scope="col" className="text-right">Debit</th><th scope="col" className="text-right">Credit</th><th scope="col">Reference</th></tr></thead>
            <tbody>
              {(t.entries || []).map((e, i) => (
                <tr key={i}>
                  <td className="font-mono text-[12px]">{e.accountCode}</td>
                  <td className="text-right tabular-nums">{e.debitPaise ? formatPaise(e.debitPaise) : ""}</td>
                  <td className="text-right tabular-nums">{e.creditPaise ? formatPaise(e.creditPaise) : ""}</td>
                  <td className="text-[11px] text-gray-500">{e.reference || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

// ───────────────────────────── override dialogs ─────────────────────────────
function ActionDialog({ state, detail, onClose, onDone, onConflict }: { state: DialogState; detail: AdminShipmentDetail; onClose: () => void; onDone: () => void; onConflict: () => void }) {
  const s = detail.shipment;
  const sid = s.id;
  const v = s.version;
  const dcn = s.dcn || "this shipment";
  const { run, busy } = useAction();
  const toast = useToast();
  const [holdType, setHoldType] = useState<string>(state.kind === "identityHold" ? "IDENTITY" : "SAFETY");
  const [reasonCode, setReasonCode] = useState<string>("");
  const [cutoff, setCutoff] = useState(isoToISTLocal(s.cutoffAt));
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [tripId, setTripId] = useState("");
  const [resolution, setResolution] = useState("");
  const [refund, setRefund] = useState("");
  const [collector, setCollector] = useState("");
  const [otp, setOtp] = useState("");
  const [otpIssued, setOtpIssued] = useState<ReceiverOtpIssued | null>(null);

  useEffect(() => {
    if (state.kind !== "reassign" || !s.route?.routeId) return;
    coreAdmin
      .trips({ routeId: s.route.routeId, limit: 100 })
      .then((r) => setTrips(r.data.filter((t) => t.id !== s.route?.tripId && ["SCHEDULED", "BOARDING"].includes(t.status || ""))))
      .catch(() => setTrips([]));
  }, [state.kind, s.route?.routeId, s.route?.tripId]);

  const submit = async (fn: () => Promise<unknown>, success: string) => {
    const r = await run(fn, {
      success,
      vars: { dcn: s.dcn },
      onError: (e) => {
        if (isCoreApiError(e) && e.code === "SHIPMENT_STATE_CONFLICT") onConflict();
        if (isCoreApiError(e) && e.code === "FORBIDDEN" && e.details?.reason === "FOUR_EYES") {
          toast(RETURN_FOUR_EYES, "error", { detail: e.correlationId ? `Ref: ${e.correlationId}` : undefined }); // exact P4 copy (T27)
          return true;
        }
        return false;
      },
    });
    if (r !== undefined) onDone();
  };

  const h = state.hold;
  const review = s.weight?.openWeightReview;
  const lowerReview = review?.reasonCode === "REMEASURED_LOWER";
  const reviewOptions = lowerReview
    ? [{ value: "ACCEPT_LOWER_MEASUREMENT", label: "Apply lower weight" }, { value: "KEEP_CURRENT_QUOTE", label: "Keep current charge" }, { value: "REJECT_SHIPMENT", label: "Reject shipment" }]
    : [{ value: "ACCEPT_DECLARED", label: "Accept declared" }, { value: "REQUIRE_REMEASURE", label: "Require re-weigh" }, { value: "REJECT_SHIPMENT", label: "Reject shipment" }];

  switch (state.kind) {
    case "placeHold":
    case "identityHold": {
      const reasons = HOLD_REASONS[holdType] || [];
      return (
        <ReasonDialog open title={state.kind === "identityHold" ? "Place IDENTITY hold" : "Place hold"} busy={busy} onClose={onClose} canConfirm={!!reasonCode}
          summary={<>Place a manual hold on <strong>{dcn}</strong>. The parcel is blocked per the hold matrix until an operations manager clears it.</>}
          confirmLabel="Place hold"
          onConfirm={(reason) => submit(() => coreAdmin.placeHold(sid, { type: holdType, reasonCode, reason }), "Hold placed")}>
          {state.kind === "placeHold" ? (
            <SelectField label="Hold type" value={holdType} onChange={(t) => { setHoldType(t); setReasonCode(""); }} options={[{ value: "IDENTITY", label: "Identity" }, { value: "SAFETY", label: "Safety" }, { value: "OPERATIONAL", label: "Operational" }]} />
          ) : (
            <p className="text-[12px] text-gray-600">Type: Identity (support may place IDENTITY holds only).</p>
          )}
          <SelectField label="Reason code" value={reasonCode} onChange={setReasonCode} placeholder="Select…" required options={reasons} />
        </ReasonDialog>
      );
    }
    case "clearHold":
      return (
        <ReasonDialog open title="Clear hold" busy={busy} onClose={onClose} confirmLabel="Clear hold"
          summary={<>Clear the <strong>{badgeLabel(h?.type || "", "hold")}</strong> hold ({humanize(h?.reasonCode)}) on <strong>{dcn}</strong>?</>}
          onConfirm={(reason) => submit(() => coreAdmin.clearHold(sid, h!.id, { reason, expectedVersion: v }), "Hold cleared")} />
      );
    case "waive":
      return (
        <ReasonDialog open title="Waive surcharge" busy={busy} onClose={onClose} confirmLabel="Waive surcharge" canConfirm={!!reasonCode}
          summary={<>Waive the extra weight charge of <strong>{s.surcharge?.amountDueDisplay || formatPaise(s.surcharge?.amountDuePaise)}</strong> on <strong>{dcn}</strong>? The invoice becomes WAIVED. Waivers above your role limit are refused.</>}
          onConfirm={(reason) => submit(() => coreAdmin.waive(sid, h!.id, { reason, reasonCode, expectedVersion: v }), "Surcharge waived")}>
          <SelectField label="Reason code" value={reasonCode} onChange={setReasonCode} placeholder="Select…" required options={WAIVE_REASONS} />
        </ReasonDialog>
      );
    case "exemption":
      return (
        <ReasonDialog open title="Grant load exemption" busy={busy} onClose={onClose} confirmLabel="Grant exemption"
          summary={<>Allow <strong>{dcn}</strong> to be accepted and loaded while the {badgeLabel(h?.type || "", "hold")} hold stays active. The destination cutoff remains the final control.</>}
          onConfirm={(reason) => submit(() => coreAdmin.loadExemption(sid, h!.id, { reason, expectedVersion: v }), "Load exemption granted")} />
      );
    case "extendCutoff": {
      const iso = istLocalToISO(cutoff);
      return (
        <ReasonDialog open title="Extend payment cutoff" busy={busy} onClose={onClose} confirmLabel="Extend cutoff" canConfirm={!!iso && new Date(iso).getTime() > Date.now()}
          summary={<>Current cutoff: <strong>{formatIST(s.cutoffAt)}</strong>. The new cutoff must be later than now and no later than the expected arrival ({formatIST(s.route?.plannedArrivalAt)} + trip delay).</>}
          onConfirm={(reason) => submit(() => coreAdmin.extendCutoff(sid, { newCutoffAt: iso!, reason, expectedVersion: v }), "Cutoff extended")}>
          <TextField label="New cutoff (IST)" type="datetime-local" value={cutoff} onChange={setCutoff} required />
        </ReasonDialog>
      );
    }
    case "reassign":
      return (
        <ReasonDialog open title="Reassign trip" busy={busy} onClose={onClose} confirmLabel="Reassign" canConfirm={!!tripId}
          summary={<>Move <strong>{dcn}</strong> to another trip of {s.route?.routeName || "the same route"}. Planned times and the cutoff are recomputed.</>}
          onConfirm={(reason) => submit(() => coreAdmin.reassignTrip(sid, { tripId, reason }), "Shipment reassigned")}>
          {trips === null ? <p className="text-[12px] text-gray-500">Loading trips…</p> : trips.length === 0 ? <Notice tone="warning">No other scheduled trips on this route.</Notice> : (
            <SelectField label="Target trip" value={tripId} onChange={setTripId} placeholder="Select a trip…" required
              options={trips.map((t) => ({ value: t.id, label: `${formatIST(t.departureAt)} · ${t.vehicleReg || "no vehicle"} · ${humanize(t.status)}` }))} />
          )}
        </ReasonDialog>
      );
    case "resolveReview":
      return (
        <ReasonDialog open title="Resolve weight review" busy={busy} onClose={onClose} confirmLabel="Resolve review" canConfirm={!!resolution} danger={resolution === "REJECT_SHIPMENT"}
          summary={<>Open review: <strong>{humanize(review?.reasonCode)}</strong>{review?.notes ? ` — ${review.notes}` : ""}. Money effects count against your approval limit.</>}
          onConfirm={(reason) => submit(() => coreAdmin.resolveWeightReview(sid, { resolution, reason, expectedVersion: v }), "Weight review resolved")}>
          <RadioGroup legend="Resolution" value={resolution} onChange={setResolution} options={reviewOptions} />
        </ReasonDialog>
      );
    case "divert":
      return (
        <ReasonDialog open title="Direct to warehouse" busy={busy} onClose={onClose} confirmLabel="Direct to warehouse"
          summary={<>Direct <strong>{dcn}</strong> to destination-warehouse pickup (no hold is placed; release needs only the normal warehouse gate).</>}
          onConfirm={(reason) => submit(() => coreAdmin.divertToWarehouse(sid, { reason, expectedVersion: v }), "Parcel directed to the warehouse")} />
      );
    case "startReturn":
      return (
        <ReasonDialog open title="Start return to sender" busy={busy} onClose={onClose} confirmLabel="Start return" danger
          summary={<>Start returning <strong>{dcn}</strong> to the sender? Open surcharge invoices must be paid or waived (Return write-off) before the return can be completed.</>}
          onConfirm={(reason) => submit(() => coreAdmin.startReturn(sid, { reason, expectedVersion: v }), "Return started")} />
      );
    case "completeReturn":
      return (
        <ReasonDialog open title="Complete return to sender" busy={busy} onClose={onClose} confirmLabel="Complete return" reasonLabel="Notes"
          canConfirm={!!collector.trim() && otp.length === (otpIssued?.codeLength || 6)}
          summary={<>Hand <strong>{dcn}</strong> back to the sender. The OTP is sent to the sender&apos;s phone.</>}
          onConfirm={(notes) => submit(() => coreAdmin.completeReturn(sid, { collectorName: collector.trim(), otpCode: otp, notes }), "Return completed")}>
          <div className="space-y-2">
            <button type="button" className={btnOutline} disabled={busy}
              onClick={async () => { const r = await run(() => coreShipments.issueReceiverOtp(sid), { errorContext: "receiverOtp" }); if (r) setOtpIssued(r); }}>
              {otpIssued ? "Resend OTP to sender" : "Send OTP to sender"}
            </button>
            {otpIssued && <p className="text-[12px] text-gray-600">OTP sent to {otpIssued.sentTo || "the sender"}; valid until {formatIST(otpIssued.expiresAt)}.{otpIssued.devCode ? ` (development code ${otpIssued.devCode})` : ""}</p>}
            <OtpInput length={otpIssued?.codeLength || 6} value={otp} onChange={setOtp} label="Sender OTP" />
          </div>
          <TextField label="Collector name" value={collector} onChange={setCollector} required maxLength={120} />
        </ReasonDialog>
      );
    case "cancel": {
      const paise = refund.trim() ? parseRupeesToPaise(refund) : null;
      const refundOk = !refund.trim() || paise !== null;
      return (
        <ReasonDialog open title="Cancel shipment" busy={busy} onClose={onClose} confirmLabel="Cancel shipment" danger canConfirm={refundOk}
          summary={<>Cancel <strong>{dcn}</strong> before origin acceptance? The base-fare refund follows the cancellation policy; paid surcharges are refunded in full.</>}
          onConfirm={(reason) => submit(() => coreAdmin.cancel(sid, { reason, refundOverridePaise: paise, expectedVersion: v }), "Shipment cancelled")}>
          <TextField label="Refund override (optional)" prefix="₹" value={refund} onChange={setRefund} inputMode="decimal" placeholder="Leave empty for the policy refund"
            hint="Replaces the policy refund; cannot exceed the base fare paid. Amounts above your approval limit are refused."
            error={refundOk ? undefined : "Enter an amount in rupees with up to 2 decimals."} />
        </ReasonDialog>
      );
    }
    case "openDispute": {
      const quote = s.surcharge?.currentQuote;
      return (
        <ReasonDialog open title="Open dispute on behalf of the customer" busy={busy} onClose={onClose} confirmLabel="Open dispute" minLength={10} maxLength={2000} reasonLabel="Description"
          canConfirm={!!quote && !!reasonCode}
          summary={quote ? <>Dispute quote v{quote.version} ({formatPaise(quote.totalPaise)}, {humanize(quote.status)}) on <strong>{dcn}</strong>. An OPEN charge is put on a DISPUTE hold.</> : <Notice tone="warning">There is no surcharge quote to dispute.</Notice>}
          onConfirm={(description) => submit(() => coreShipments.openDispute(sid, { quoteId: quote!.id, reasonCode, description }), "Dispute opened")}>
          <RadioGroup legend="Reason" value={reasonCode} onChange={setReasonCode} options={DISPUTE_REASONS} />
        </ReasonDialog>
      );
    }
  }
}
