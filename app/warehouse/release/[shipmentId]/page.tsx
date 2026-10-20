"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ShieldAlert } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Card, CheckboxField, ConfirmDialog, CorePage, ErrorBanner, KV, LastSynced, Notice, ReasonDialog, SelectField, TextField, btnOutline, btnPrimary,
} from "@/components/core/ui";
import { OtpInput, PhotoInput } from "@/components/core/domain";
import { coreAdmin, coreEvidence, coreShipments, isCoreApiError } from "@/lib/core-api";
import type { GateReport, ReceiverOtpIssued, ShipmentView } from "@/lib/core-types";
import { copyForCode, errorCopy } from "@/lib/core-errors";
import { formatIST, formatISTTime, formatKg, formatPaise } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useAction, useCoreQuery } from "@/lib/use-core";

const ID_TYPES = [
  { value: "AADHAAR_LAST4", label: "Aadhaar (last 4 digits)" }, { value: "DRIVING_LICENCE", label: "Driving licence" },
  { value: "VOTER_ID", label: "Voter ID" }, { value: "PASSPORT", label: "Passport" }, { value: "OTHER", label: "Other" },
];
const TERMINAL = ["PICKED_UP", "DELIVERED", "RETURNED", "CANCELLED"];
const STAFF_HOLD_REASONS = {
  IDENTITY: [{ value: "RECEIVER_ID_MISMATCH", label: "Receiver ID mismatch" }, { value: "SENDER_ID_MISMATCH", label: "Sender ID mismatch" }, { value: "OTHER", label: "Other" }],
  SAFETY: [{ value: "SUSPECTED_PROHIBITED", label: "Suspected prohibited item" }, { value: "DAMAGED_LEAKING", label: "Damaged / leaking" }, { value: "OTHER", label: "Other" }],
};

interface Loaded { shipment: ShipmentView; gates: GateReport | null; gateError: unknown }

type Check = "ok" | "fail" | "pending";
function CheckRow({ state, text }: { state: Check; text: string }) {
  const Icon = state === "ok" ? CheckCircle2 : state === "fail" ? XCircle : Clock;
  const cls = state === "ok" ? "text-success" : state === "fail" ? "text-danger" : "text-ink-soft";
  return (
    <li className={`flex items-center gap-2 text-[13px] ${cls}`}>
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden />
      <span className="font-semibold w-4" aria-hidden>{state === "ok" ? "✓" : state === "fail" ? "✗" : "…"}</span>
      <span className="text-ink">{text}</span>
      <span className="sr-only">{state === "ok" ? "passed" : state === "fail" ? "failed" : "pending"}</span>
    </li>
  );
}

function ReleaseBody({ id }: { id: string }) {
  const { run, busy } = useAction();
  const [blocked, setBlocked] = useState(true);
  const q = useCoreQuery<Loaded>(
    async () => {
      const shipment = await coreShipments.get(id);
      let gates: GateReport | null = null;
      let gateError: unknown = null;
      try {
        gates = await coreShipments.eligibility(id);
      } catch (e) {
        if (isCoreApiError(e) && e.network) throw e;
        gateError = e;
      }
      const isBlocked = !TERMINAL.includes(shipment.state) && (gates?.release?.allowed !== true);
      setBlocked(isBlocked);
      return { shipment, gates, gateError };
    },
    [id],
    { pollMs: blocked ? 5000 : null }, // 5 s while the release is blocked (§4.1 P9)
  );
  const [otpInfo, setOtpInfo] = useState<ReceiverOtpIssued | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [collector, setCollector] = useState("");
  const [idType, setIdType] = useState("");
  const [consent, setConsent] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirming, setConfirming] = useState<{ deviceTime: string } | null>(null);
  const [actionError, setActionError] = useState<{ title: string; body?: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [holdDialog, setHoldDialog] = useState(false);
  const [holdType, setHoldType] = useState<"IDENTITY" | "SAFETY">("SAFETY");
  const [holdReason, setHoldReason] = useState("");

  const s = q.data?.shipment;
  const gates = q.data?.gates;
  const isReturn = s?.state === "RETURN_IN_PROGRESS";
  const warehouseName = s?.warehouse?.info?.name || "this warehouse";
  const warehouseId = s?.warehouse?.inventory?.warehouseId || s?.warehouse?.info?.id || "";
  const blockers = gates?.release?.blockers || [];
  const codes = new Set(blockers.map((b) => b.code));
  const gateForbidden = isCoreApiError(q.data?.gateError) && (q.data?.gateError as any).code === "TRIP_ASSIGNMENT_MISMATCH";
  const releaseAllowed = gates?.release?.allowed === true && !gateForbidden;
  const codeLength = otpInfo?.codeLength || 6;
  const vars = { dcn: s?.dcn, thisWarehouse: warehouseName, stateLabel: s?.stateLabel };

  const check = (fail: boolean): Check => (fail ? "fail" : gates ? "ok" : "pending");

  const sendOtp = async () => {
    setOtpError(null);
    const r = await run(() => coreShipments.issueReceiverOtp(id, isReturn ? undefined : "WAREHOUSE_PICKUP"), { errorContext: "receiverOtp", vars });
    if (r) {
      setOtpInfo(r);
      setOtp("");
    }
  };

  const doRelease = async () => {
    if (!s || !confirming) return;
    setActionError(null);
    setOtpError(null);
    const name = collector.trim();
    const r = await run(
      async () => {
        let podEvidenceId: string | undefined;
        if (consent && photo) podEvidenceId = (await coreEvidence.upload(photo, "POD_PHOTO", s.id)).id;
        if (isReturn) {
          return (await coreAdmin.completeReturn(s.id, { collectorName: name, otpCode: otp, ...(podEvidenceId ? { evidenceId: podEvidenceId } : {}) })) as unknown;
        }
        return (await coreShipments.release(s.id, {
          warehouseId,
          otpCode: otp,
          collectorName: name,
          ...(idType ? { collectorIdType: idType } : {}),
          ...(podEvidenceId ? { podEvidenceId } : {}),
          confirm: true,
          deviceTime: confirming.deviceTime,
          expectedVersion: s.version,
        })).data as unknown;
      },
      {
        onError: (e) => {
          const c = errorCopy(e, "release", vars);
          if (isCoreApiError(e) && e.code === "RECEIVER_VERIFICATION_FAILED") setOtpError(c.title);
          else setActionError(c);
          q.reload();
          return false;
        },
      },
    );
    setConfirming(null);
    if (r !== undefined) {
      setDone(isReturn ? `Returned to ${name} at ${formatISTTime(Date.now())}.` : `Released to ${name} at ${formatISTTime(Date.now())}.`);
      q.reload();
    }
  };

  const placeHold = async (reason: string) => {
    if (!s || !holdReason) return;
    const r = await run(() => coreShipments.placeStaffHold(s.id, { type: holdType, reasonCode: holdReason, reason, deviceTime: new Date().toISOString() }), {
      success: `${holdType === "SAFETY" ? "Safety" : "Identity"} hold placed on ${s.dcn}`,
    });
    if (r) {
      setHoldDialog(false);
      q.reload();
    }
  };

  const ready = !!collector.trim() && otp.length === codeLength && !!otpInfo;
  const canSubmit = (isReturn ? true : releaseAllowed) && ready && !done;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-2">
        <Link href="/warehouse/release" className={btnOutline}><ArrowLeft className="w-4 h-4" aria-hidden />Scan another parcel</Link>
        <LastSynced at={s?.serverTime || q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {done && <Notice tone="success" title={done} />}
      {s && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card title={<span className="font-mono">{s.dcn}</span>} actions={<StatusBadge status={s.state} kind="shipmentState" />}>
              <KV cols={2} items={[
                ["Receiver", `${s.parties?.receiver?.name || "—"} ${s.parties?.receiver?.phone || ""}`],
                ["Declared / actual", `${s.parcel?.declaredWeightDisplay || formatKg(s.parcel?.declaredWeightGrams)} / ${s.weight?.latestMeasurement ? formatKg(s.weight.latestMeasurement.actualWeightGrams) : "—"}`],
                ["Amount due", s.surcharge?.amountDueDisplay || formatPaise(s.surcharge?.amountDuePaise ?? 0)],
                ["Payment", s.surcharge ? <StatusBadge key="p" status={s.surcharge.driverLabel} kind="driverLabel" /> : "—"],
                ["Bin", s.warehouse?.inventory?.binCode],
                ["Received", formatIST(s.warehouse?.inventory?.receivedAt)],
              ]} />
              {(s.pickupRequirements || []).length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-[12px] text-ink-soft">{s.pickupRequirements!.map((p, i) => <li key={i}>{p}</li>)}</ul>
              )}
              {!TERMINAL.includes(s.state) && (
                <button className={`${btnOutline} mt-4`} onClick={() => { setHoldDialog(true); setHoldReason(""); }}>
                  <ShieldAlert className="w-4 h-4" aria-hidden />Report safety issue / identity mismatch
                </button>
              )}
            </Card>

            {!isReturn && (
              <Card title="Release eligibility">
                <ul className="space-y-1.5">
                  <CheckRow state={check(codes.has("SURCHARGE_PAYMENT_REQUIRED") || codes.has("PAYMENT_PENDING"))} text="Surcharge settled" />
                  <CheckRow state={check(codes.has("WAREHOUSE_HOLD_ACTIVE"))} text="No other holds" />
                  <CheckRow state={check(codes.has("WAREHOUSE_LOCATION_MISMATCH"))} text="Parcel recorded at this warehouse" />
                  <CheckRow state="pending" text="Receiver OTP verified" />
                  <CheckRow state={gateForbidden || codes.has("TRIP_ASSIGNMENT_MISMATCH") ? "fail" : check(false)} text="You are authorised for this warehouse" />
                </ul>
                <p className="mt-2 text-[11px] text-ink-soft">
                  Receiver OTP is checked when you release. Evaluated by the server at {formatISTTime(gates?.evaluatedAt)}{blocked ? " · refreshing every 5 s" : ""}.
                </p>
                <div className="mt-3 space-y-2">
                  {gateForbidden && <Notice tone="danger" title="You are not assigned to this warehouse." />}
                  {blockers.map((b, i) => {
                    const c = copyForCode(b.code, b.details || {}, "release", vars, b.message);
                    return <Notice key={i} tone="danger" title={c.title}>{c.body}</Notice>;
                  })}
                </div>
              </Card>
            )}
            {isReturn && (
              <Notice tone="info" title="Return to sender">
                This parcel is being returned. Complete the return with the OTP sent to the sender. All surcharges must be paid or waived and no hold may be active.
              </Notice>
            )}
          </div>

          <Card title={isReturn ? "Complete return to sender" : "Release to receiver"}>
            {actionError && <div className="mb-3"><Notice tone="danger" title={actionError.title}>{actionError.body}</Notice></div>}
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (canSubmit) setConfirming({ deviceTime: new Date().toISOString() }); }}>
              <div className="space-y-2">
                <button type="button" className={btnOutline} onClick={sendOtp} disabled={busy || !!done}>
                  {otpInfo ? "Resend OTP" : isReturn ? "Send OTP to sender" : "Send OTP to receiver"}
                </button>
                {otpInfo && (
                  <p className="text-[12px] text-ink-soft">
                    OTP sent to {otpInfo.sentTo || (isReturn ? "the sender" : "the receiver")}, valid until {formatISTTime(otpInfo.expiresAt)}
                    {otpInfo.issuesLeft24h !== undefined ? ` · ${otpInfo.issuesLeft24h} more today` : ""}
                    {otpInfo.devCode ? ` · development code ${otpInfo.devCode}` : ""}
                  </p>
                )}
                <OtpInput length={codeLength} value={otp} onChange={(v) => { setOtp(v); setOtpError(null); }} disabled={!otpInfo || !!done} label={isReturn ? "Sender OTP" : "Receiver OTP"} />
                {otpError && <p className="text-[12px] text-danger" role="alert">{otpError}</p>}
              </div>
              <TextField label="Collector name" value={collector} onChange={setCollector} required maxLength={120} disabled={!!done} />
              {!isReturn && <SelectField label="Photo ID type" value={idType} onChange={setIdType} placeholder="Select…" options={ID_TYPES} disabled={!!done} />}
              <CheckboxField label="The collector consents to a photo for proof of handover" checked={consent} onChange={(v) => { setConsent(v); if (!v) setPhoto(null); }} disabled={!!done} />
              {consent && <PhotoInput label="Handover photo" file={photo} onChange={setPhoto} disabled={!!done} />}
              <div className="flex justify-end">
                <button type="submit" className={btnPrimary} disabled={!canSubmit || busy}>{isReturn ? "Complete return" : "Release parcel"}</button>
              </div>
              {!isReturn && !releaseAllowed && !done && <p className="text-[11px] text-ink-soft text-right">Release is disabled until the server reports the parcel as eligible.</p>}
            </form>
          </Card>
        </div>
      )}
      <ConfirmDialog
        open={!!confirming}
        title={isReturn ? "Confirm return" : "Confirm release"}
        busy={busy}
        confirmLabel={isReturn ? "Complete return" : "Release"}
        onClose={() => setConfirming(null)}
        onConfirm={doRelease}
        message={isReturn
          ? `Return parcel ${s?.dcn} to ${collector.trim()}? This cannot be undone.`
          : `Release parcel ${s?.dcn} to ${collector.trim()}? Payment and holds were verified by the server at ${formatISTTime(gates?.evaluatedAt)}.`}
      />
      <ReasonDialog open={holdDialog} title="Report safety issue / identity mismatch" busy={busy} onClose={() => setHoldDialog(false)} confirmLabel="Place hold" canConfirm={!!holdReason}
        summary={<>Place a hold on <strong>{s?.dcn}</strong>. Only an operations manager can clear it.</>} onConfirm={placeHold}>
        <SelectField label="Type" value={holdType} onChange={(v) => { setHoldType(v as "IDENTITY" | "SAFETY"); setHoldReason(""); }} options={[{ value: "SAFETY", label: "Safety" }, { value: "IDENTITY", label: "Identity" }]} />
        <SelectField label="Reason code" value={holdReason} onChange={setHoldReason} placeholder="Select…" required options={STAFF_HOLD_REASONS[holdType]} />
      </ReasonDialog>
    </>
  );
}

/** P9 — warehouse release with server eligibility checklist, receiver OTP and confirmation (warehouse_staff). */
export default function WarehouseReleasePage({ params }: { params: { shipmentId: string } }) {
  return (
    <CorePage title="Warehouse Release" description="Release only when the server reports the parcel eligible; the receiver OTP is verified last (G4)" roles={PAGE_ROLES.warehouseRelease}>
      <ReleaseBody id={decodeURIComponent(params.shipmentId)} />
    </CorePage>
  );
}
