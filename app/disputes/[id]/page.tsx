"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Card, CheckboxField, ConfirmDialog, CorePage, ErrorBanner, JsonBlock, KV, LastSynced, Notice, RadioGroup, SelectField, TextAreaField, TextField, btnOutline, btnPrimary,
} from "@/components/core/ui";
import { EvidenceThumb, PhotoInput, SurchargeBreakdownView } from "@/components/core/domain";
import { coreAdmin, coreEvidence } from "@/lib/core-api";
import type { AdminShipmentDetail, AdminUser, Dispute, SurchargeBreakdown, TariffPreview } from "@/lib/core-types";
import { formatIST, formatKg, formatPaise, humanize, paiseToRupeesInput, parseRupeesToPaise, parseWeightToGrams, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

type Outcome = "UPHELD" | "REWEIGH_ADJUSTED" | "WAIVED" | "REFUNDED";
const OUTCOMES: { value: Outcome; label: string; hint: string }[] = [
  { value: "UPHELD", label: "Uphold the charge", hint: "The charge stands." },
  { value: "REWEIGH_ADJUSTED", label: "Re-weigh adjusted", hint: "Correct the measured weight; the charge is re-priced (delta quote or refund)." },
  { value: "WAIVED", label: "Waive the charge", hint: "The extra charge is waived." },
  { value: "REFUNDED", label: "Refund", hint: "Refund (part of) a paid surcharge to the original payment method." },
];

function asBreakdown(snap: Record<string, unknown> | undefined): SurchargeBreakdown | null {
  if (!snap) return null;
  const b = (snap.breakdown as SurchargeBreakdown | undefined) || (Array.isArray((snap as SurchargeBreakdown).lines) ? (snap as SurchargeBreakdown) : null);
  return b || null;
}

function DisputeBody({ id }: { id: string }) {
  const { me, roles } = useAuth();
  const { run, busy } = useAction();
  const q = useCoreQuery<Dispute>(() => coreAdmin.dispute(id), [id], { pollMs: 30000 });
  const d = q.data;
  const [detail, setDetail] = useState<AdminShipmentDetail | null>(null);
  const [assignees, setAssignees] = useState<AdminUser[] | null>(null);
  const [assignee, setAssignee] = useState("");
  const canAssign = hasAnyRole(roles, WRITE_ROLES.assignDispute);
  const canResolve = hasAnyRole(roles, WRITE_ROLES.resolveDispute);
  const canPickAssignee = hasAnyRole(roles, ["ops_manager", "admin"]);

  // Resolve form
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"g" | "kg">("kg");
  const [chosenEvidence, setChosenEvidence] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [refund, setRefund] = useState("");
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<TariffPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!d?.shipmentId) return;
    coreAdmin.shipment(d.shipmentId).then(setDetail).catch(() => setDetail(null));
  }, [d?.shipmentId, d?.status]);
  useEffect(() => {
    if (!canPickAssignee) return;
    coreAdmin.users({ limit: 100, status: "ACTIVE" })
      .then((r) => setAssignees(r.data.filter((u) => u.roles?.some((g) => ["support", "ops_manager", "admin"].includes(g.role)))))
      .catch(() => setAssignees(null));
  }, [canPickAssignee]);

  const snap = d?.quoteSnapshot;
  const breakdown = asBreakdown(snap);
  const quote = detail?.quotes?.find((x) => x.id === d?.quoteId);
  const currentQuote = detail?.shipment.surcharge?.currentQuote || null;
  const declaredGrams = breakdown?.declaredWeightGrams ?? (snap?.declaredWeightGrams as number | undefined) ?? detail?.shipment.parcel?.declaredWeightGrams;
  const tariffId = breakdown?.tariffId || (snap?.tariffId as string | undefined);
  const beforeTotal = currentQuote?.totalPaise ?? quote?.totalPaise ?? breakdown?.totalPaise;

  // Refundable amount of the surcharge payment, from the server's intent/refund records (cap and default for REFUNDED).
  const refundable = useMemo(() => {
    if (!detail || !d) return null;
    const inv = detail.invoices?.find((i) => i.surchargeQuoteId === d.quoteId);
    const intent = detail.payments?.find((p) => p.invoiceId === inv?.id && ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUND_PENDING"].includes(p.status));
    if (!intent) return null;
    const pending = (detail.refunds || []).filter((r) => r.paymentIntentId === intent.id && r.status === "PENDING").reduce((a, r) => a + (r.amountPaise || 0), 0);
    return Math.max(0, intent.amountPaise - (intent.amountRefundedPaise || 0) - pending);
  }, [detail, d]);

  useEffect(() => {
    if (outcome === "REFUNDED" && refundable !== null && !refund) setRefund(paiseToRupeesInput(refundable));
  }, [outcome, refundable, refund]);

  const corrected = weight ? parseWeightToGrams(weight, unit) : null;
  // before → after preview through POST /admin/tariffs/{id}/preview (server calculation only).
  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    if (outcome !== "REWEIGH_ADJUSTED" || !corrected || !declaredGrams || !tariffId) return;
    const t = setTimeout(() => {
      coreAdmin.previewTariff(tariffId, { declaredWeightGrams: declaredGrams, actualWeightGrams: corrected })
        .then(setPreview)
        .catch(() => setPreviewError("Preview unavailable for this tariff."));
    }, 400);
    return () => clearTimeout(t);
  }, [outcome, corrected, declaredGrams, tariffId]);

  const refundPaise = refund ? parseRupeesToPaise(refund) : null;
  const evidenceCount = chosenEvidence.length + (photo ? 1 : 0);
  const errors = {
    weight: outcome === "REWEIGH_ADJUSTED" && weight && !corrected ? "Enter whole grams (g) or kilograms with up to 3 decimals (kg)." : undefined,
    refund: outcome === "REFUNDED" && refund && (refundPaise === null || refundPaise < 1) ? "Enter an amount in rupees with up to 2 decimals." :
      outcome === "REFUNDED" && refundPaise !== null && refundable !== null && refundPaise > refundable ? `Only ${formatPaise(refundable)} can still be refunded on this payment.` : undefined,
  };
  const valid =
    !!outcome && reason.trim().length >= 10 &&
    (outcome !== "REWEIGH_ADJUSTED" || (!!corrected && evidenceCount >= 1)) &&
    (outcome !== "REFUNDED" || (!errors.refund && (refundPaise === null || refundPaise >= 1)));

  const afterText = (() => {
    switch (outcome) {
      case "UPHELD": return `${formatPaise(beforeTotal)} (unchanged)`;
      case "WAIVED": return `${formatPaise(0)} (waived)`;
      case "REFUNDED": return `Refund ${refundPaise ? formatPaise(refundPaise) : refundable !== null ? formatPaise(refundable) : "the full refundable amount"}`;
      case "REWEIGH_ADJUSTED":
        if (!corrected) return "Enter the corrected weight";
        if (previewError) return previewError;
        if (!preview) return "Calculating…";
        return `${formatPaise(preview.surcharge?.totalPaise ?? 0)} for ${formatKg(corrected)} (${humanize(preview.evaluation?.outcome)})`;
      default: return "—";
    }
  })();

  const resolve = async () => {
    if (!d || !outcome) return;
    const r = await run(async () => {
      const ids = [...chosenEvidence];
      if (photo) ids.push((await coreEvidence.upload(photo, "WEIGHT_SCALE_PHOTO", d.shipmentId)).id);
      return coreAdmin.resolveDispute(d.id, {
        outcome,
        reason: reason.trim(),
        ...(outcome === "REWEIGH_ADJUSTED" ? { correctedActualWeightGrams: corrected } : {}),
        ...(outcome === "REFUNDED" && refundPaise ? { refundAmountPaise: refundPaise } : {}),
        ...(ids.length ? { evidenceIds: ids } : {}),
      });
    }, { success: (x) => `${x.caseNumber || "Dispute"} resolved` });
    setConfirm(false);
    if (r) q.setData(() => r);
  };

  const assign = async (userId: string) => {
    if (!d) return;
    const r = await run(() => coreAdmin.assignDispute(d.id, userId), { success: "Dispute assigned" });
    if (r) q.setData(() => r);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
        <Link href="/disputes" className={btnOutline}><ArrowLeft className="w-4 h-4" aria-hidden />All disputes</Link>
        <LastSynced at={q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {d && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card title={<span className="font-mono">{d.caseNumber}</span>} actions={d.status && <StatusBadge status={d.status} kind="generic" />}>
              <KV cols={3} items={[
                ["Shipment", d.shipmentId ? <Link key="s" className="font-mono text-blue-700 hover:underline" href={`/shipments/${d.shipmentId}`}>{d.dcn}</Link> : d.dcn],
                ["Reason", humanize(d.reasonCode)],
                ["Opened", formatIST(d.createdAt)],
                ["Hold placed", d.holdPlaced ? "Yes — DISPUTE hold" : "No (paid quote: refund-only review)"],
                ["Assigned to", d.assignedTo ? (d.assignedTo === me?.id ? "Me" : shortId(d.assignedTo)) : "Unassigned"],
                ["Linked ticket", d.supportTicketId ? <Link key="t" className="text-blue-700 hover:underline" href={`/support?ticket=${d.supportTicketId}`}>Open ticket</Link> : "—"],
              ]} />
              <p className="mt-3 text-[13px] text-gray-800 whitespace-pre-wrap">{d.description}</p>
              {d.status === "RESOLVED" && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-[13px]">
                  <p><strong>Outcome:</strong> {humanize(d.outcome)} · {formatIST(d.resolvedAt)}</p>
                  {d.resolutionReason && <p className="text-gray-700 mt-1">{d.resolutionReason}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"><div><p className="text-[11px] text-gray-500">Before</p><JsonBlock value={d.beforeValues} /></div><div><p className="text-[11px] text-gray-500">After</p><JsonBlock value={d.afterValues} /></div></div>
                </div>
              )}
            </Card>
            <Card title="Preserved snapshot">
              {breakdown ? <SurchargeBreakdownView breakdown={breakdown} quote={quote ? { version: quote.version, status: quote.status, taxRateBps: quote.taxRateBps } : null} title="Disputed charge (as quoted)" /> : <JsonBlock value={snap} />}
              {quote && <p className="mt-2 text-[12px] text-gray-600">Quote v{quote.version} is now <StatusBadge status={quote.status} kind="generic" />{currentQuote && currentQuote.id !== quote.id ? ` · current quote v${currentQuote.version} (${formatPaise(currentQuote.totalPaise)})` : ""}</p>}
            </Card>
            <Card title="Evidence">
              {(d.evidenceIds || []).length === 0 ? <p className="text-[13px] text-gray-500">No evidence attached.</p> : (
                <div className="flex flex-wrap gap-3">{d.evidenceIds!.map((e) => <EvidenceThumb key={e} id={e} size={96} />)}</div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            {canAssign && d.status !== "RESOLVED" && (
              <Card title="Assignment">
                <div className="space-y-2">
                  {me && d.assignedTo !== me.id && <button className={btnOutline} disabled={busy} onClick={() => assign(me.id)}>Assign to me</button>}
                  {assignees && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1"><SelectField label="Assign to" value={assignee} onChange={setAssignee} placeholder="Select a colleague…" options={assignees.map((u) => ({ value: u.id, label: u.name || u.phone || u.id }))} /></div>
                      <button className={btnOutline} disabled={!assignee || busy} onClick={() => assign(assignee)}>Assign</button>
                    </div>
                  )}
                </div>
              </Card>
            )}
            {canResolve && d.status !== "RESOLVED" && (
              <Card title="Resolve dispute">
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (valid) setConfirm(true); }}>
                  <RadioGroup legend="Outcome" value={outcome} onChange={(v) => { setOutcome(v); setRefund(""); }} options={OUTCOMES.map((o) => ({ ...o, disabled: o.value === "REFUNDED" && refundable === 0 }))} />
                  {outcome === "REWEIGH_ADJUSTED" && (
                    <>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1"><TextField label="Corrected weight" value={weight} onChange={setWeight} inputMode="decimal" required error={errors.weight} /></div>
                        <div className="w-24"><SelectField label="Unit" value={unit} onChange={(v) => setUnit(v as "g" | "kg")} options={[{ value: "kg", label: "kg" }, { value: "g", label: "g" }]} /></div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-semibold text-gray-600">Evidence (at least one) *</p>
                        {(d.evidenceIds || []).map((e) => (
                          <CheckboxField key={e} label={<span className="font-mono text-[12px]">Attach {shortId(e)}</span>} checked={chosenEvidence.includes(e)} onChange={(v) => setChosenEvidence((x) => (v ? [...x, e] : x.filter((y) => y !== e)))} />
                        ))}
                        <PhotoInput label="Upload a scale photo" file={photo} onChange={setPhoto} />
                      </div>
                    </>
                  )}
                  {outcome === "REFUNDED" && (
                    <TextField label="Refund amount" prefix="₹" value={refund} onChange={setRefund} inputMode="decimal" error={errors.refund}
                      hint={refundable !== null ? `Refundable on this payment: ${formatPaise(refundable)} (default)` : "No refundable surcharge payment found; the server applies the full refundable amount."} />
                  )}
                  <TextAreaField label="Reason (min 10 characters)" value={reason} onChange={setReason} required maxLength={1000} hint={`${reason.trim().length}/1000`}
                    error={reason && reason.trim().length < 10 ? "Enter at least 10 characters." : undefined} />
                  {outcome && (
                    <div className="rounded-lg border border-gray-200 p-3 text-[13px]" aria-live="polite">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Before → after</p>
                      <p className="flex flex-wrap items-center gap-2"><span>{formatPaise(beforeTotal)}</span><ArrowRight className="w-3.5 h-3.5" aria-hidden /><span className="font-semibold">{afterText}</span></p>
                      {outcome === "REWEIGH_ADJUSTED" && <p className="text-[11px] text-gray-500 mt-1">Server preview with tariff v{breakdown?.tariffVersion ?? "—"}. For a paid quote only the difference is billed or refunded.</p>}
                    </div>
                  )}
                  <div className="flex justify-end"><button type="submit" className={btnPrimary} disabled={!valid || busy}>Resolve dispute</button></div>
                </form>
              </Card>
            )}
            {!canResolve && d.status !== "RESOLVED" && <Notice tone="info">Only an operations manager or admin can resolve disputes.</Notice>}
          </div>
        </div>
      )}
      <ConfirmDialog open={confirm} title="Confirm dispute resolution" busy={busy} confirmLabel="Resolve" onClose={() => setConfirm(false)} onConfirm={resolve}
        message={<>Resolve <strong>{d?.caseNumber}</strong> as <strong>{OUTCOMES.find((o) => o.value === outcome)?.label}</strong>? {formatPaise(beforeTotal)} → {afterText}. This is recorded with your reason and cannot be undone.</>} />
    </>
  );
}

/** P10 — dispute detail: snapshot, evidence, linked ticket, assign, resolve (ops/admin). */
export default function DisputeDetailPage({ params }: { params: { id: string } }) {
  return (
    <CorePage title="Dispute" description="Preserved quote snapshot, evidence and resolution (T12, FR-ADM-005)" roles={PAGE_ROLES.disputes}>
      <DisputeBody id={decodeURIComponent(params.id)} />
    </CorePage>
  );
}
