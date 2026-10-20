"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, Notice, SelectField, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { Operator } from "@/lib/core-types";
import { bpsToPercentInput, formatBps, parsePercentToBps } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const STATUSES = [{ value: "PENDING", label: "Pending" }, { value: "ACTIVE", label: "Active" }, { value: "SUSPENDED", label: "Suspended" }];

function OperatorForm({ op, onClose, onSaved }: { op: Operator | null; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [f, setF] = useState({
    code: op?.code || "", legalName: op?.legalName || "", displayName: op?.displayName || "", status: op?.status || "PENDING",
    gstNumber: op?.gstNumber || "", contactPhone: op?.contactPhone?.replace(/^\+91/, "") || "",
    commission: bpsToPercentInput(op?.settlementConfig?.commissionBps ?? 1000), share: bpsToPercentInput(op?.settlementConfig?.surchargeOperatorShareBps ?? 0),
    payoutCycle: op?.settlementConfig?.payoutCycle || "WEEKLY", reason: "",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const commissionBps = parsePercentToBps(f.commission);
  const shareBps = parsePercentToBps(f.share);
  const errors = {
    code: f.code && !/^[A-Z0-9_]{3,32}$/.test(f.code) ? "3–32 characters: A–Z, 0–9, _" : undefined,
    gst: f.gstNumber && !/^[0-9A-Z]{15}$/.test(f.gstNumber) ? "15 characters (0–9, A–Z)" : undefined,
    phone: f.contactPhone && !/^[6-9][0-9]{9}$/.test(f.contactPhone) ? "10-digit Indian mobile" : undefined,
    commission: commissionBps === null || commissionBps > 10000 ? "0–100%" : undefined,
    share: shareBps === null || shareBps > 10000 ? "0–100%" : undefined,
  };
  const valid = !!f.code && !!f.legalName.trim() && !!f.displayName.trim() && !Object.values(errors).some(Boolean);
  const save = async () => {
    const body: Record<string, unknown> = {
      code: f.code, legalName: f.legalName.trim(), displayName: f.displayName.trim(), status: f.status,
      ...(f.gstNumber ? { gstNumber: f.gstNumber } : {}), ...(f.contactPhone ? { contactPhone: f.contactPhone } : {}),
      settlementConfig: { commissionBps, surchargeOperatorShareBps: shareBps, payoutCycle: f.payoutCycle },
      ...(f.reason.trim() ? { reason: f.reason.trim() } : {}),
    };
    const r = await run(() => (op ? coreAdmin.updateOperator(op.id, body) : coreAdmin.createOperator(body)), { success: op ? "Operator updated" : "Operator created" });
    if (r) onSaved();
  };
  return (
    <Modal open onClose={onClose} title={op ? `Edit ${op.displayName || op.code}` : "New operator"} size="lg">
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <TextField label="Code" value={f.code} onChange={(v) => set("code")(v.toUpperCase())} required error={errors.code} />
        <SelectField label="Status" value={f.status} onChange={set("status")} options={STATUSES} />
        <TextField label="Legal name" value={f.legalName} onChange={set("legalName")} required maxLength={200} />
        <TextField label="Display name" value={f.displayName} onChange={set("displayName")} required maxLength={120} />
        <TextField label="GST number" value={f.gstNumber} onChange={(v) => set("gstNumber")(v.toUpperCase())} error={errors.gst} />
        <TextField label="Contact phone" value={f.contactPhone} onChange={set("contactPhone")} inputMode="tel" prefix="+91" error={errors.phone} />
        <TextField label="Commission" value={f.commission} onChange={set("commission")} suffix="%" inputMode="decimal" error={errors.commission} />
        <TextField label="Operator share of surcharges" value={f.share} onChange={set("share")} suffix="%" inputMode="decimal" error={errors.share} />
        <SelectField label="Payout cycle" value={f.payoutCycle} onChange={set("payoutCycle")} options={[{ value: "WEEKLY", label: "Weekly" }, { value: "MONTHLY", label: "Monthly" }]} />
        <TextField label="Reason (audited)" value={f.reason} onChange={set("reason")} maxLength={500} />
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" className={btnOutline} onClick={onClose}>Cancel</button><button type="submit" className={btnPrimary} disabled={!valid || busy}>Save</button></div>
      </form>
    </Modal>
  );
}

function OperatorsBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.catalog);
  const q = useCoreQuery<Operator[]>(() => coreAdmin.operators(), []);
  const [editing, setEditing] = useState<Operator | null | "new">(null);
  return (
    <>
      <div className="flex justify-end -mt-2">{canWrite && <button className={btnPrimary} onClick={() => setEditing("new")}><Plus className="w-4 h-4" aria-hidden />New operator</button>}</div>
      {!canWrite && <Notice tone="info">Read-only: only an admin can change operators.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Operators" rowKey={(o) => o.id} data={q.data || []} loading={q.loading && !q.data} emptyMessage="No operators" columns={[
        { key: "name", label: "Operator", render: (o: Operator) => <div><p className="font-medium text-ink">{o.displayName}</p><p className="text-xs text-ink-soft">{o.legalName} · {o.code}</p></div> },
        { key: "status", label: "Status", render: (o: Operator) => (o.status ? <StatusBadge status={o.status} kind="generic" /> : "—") },
        { key: "gst", label: "GST", render: (o: Operator) => <span className="font-mono text-[12px]">{o.gstNumber || "—"}</span> },
        { key: "phone", label: "Contact", render: (o: Operator) => o.contactPhone || "—" },
        { key: "settlement", label: "Settlement", render: (o: Operator) => <span className="text-[12px]">Commission {formatBps(o.settlementConfig?.commissionBps)} · surcharge share {formatBps(o.settlementConfig?.surchargeOperatorShareBps)} · {o.settlementConfig?.payoutCycle?.toLowerCase() || "—"}</span> },
        { key: "ops", label: "Operations", render: (o: Operator) => (canWrite ? <button className={rowAction("indigo")} onClick={() => setEditing(o)}>Edit</button> : <span className="text-ink-faint">—</span>) },
      ]} />
      {editing && <OperatorForm op={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); q.reload(); }} />}
    </>
  );
}

/** P13 — operators catalog (GET/POST/PATCH /admin/operators; admin writes, ops read). */
export default function CoreOperators() {
  return (
    <CorePage title="Operators" description="Bus operators and settlement terms (FR-MKT, catalog)" roles={PAGE_ROLES.catalog}>
      <OperatorsBody />
    </CorePage>
  );
}
