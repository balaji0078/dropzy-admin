"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CorePage, Notice, SelectField, TextField, btnPrimary } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import { downloadBlob } from "@/lib/csv";
import type { Operator } from "@/lib/core-types";
import { istDate } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useAction, useCoreQuery } from "@/lib/use-core";

const REPORTS = [
  { value: "shipments", label: "Shipments" },
  { value: "weight-exceptions", label: "Weight exceptions" },
  { value: "surcharge-collections", label: "Surcharge collections" },
  { value: "warehouse-holds", label: "Warehouse holds" },
  { value: "ledger", label: "Ledger (finance)" },
  { value: "settlements", label: "Settlements (finance)" },
  { value: "reconciliation", label: "Reconciliation (finance)" },
];

function ReportsBody() {
  const { run, busy } = useAction();
  const [type, setType] = useState("shipments");
  const [from, setFrom] = useState(istDate(-7));
  const [to, setTo] = useState(istDate());
  const [operatorId, setOperatorId] = useState("");
  const ops = useCoreQuery<Operator[]>(() => coreAdmin.operators(), [], { silent: true });
  const valid = !!type && !!from && !!to && from <= to;
  const download = async () => {
    const r = await run(() => coreAdmin.report(type, { from, to, operatorId: operatorId || undefined }), { success: "Report downloaded" });
    if (r) downloadBlob(r.blob, r.filename);
  };
  return (
    <Card>
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end" onSubmit={(e) => { e.preventDefault(); if (valid) download(); }}>
        <SelectField label="Report" value={type} onChange={setType} options={REPORTS} required />
        <TextField label="From (IST date)" type="date" value={from} onChange={setFrom} required />
        <TextField label="To (IST date)" type="date" value={to} onChange={setTo} required error={from > to ? "Must be on or after the start date." : undefined} />
        <SelectField label="Operator (optional)" value={operatorId} onChange={setOperatorId} placeholder="All operators" options={(ops.data || []).map((o) => ({ value: o.id, label: o.displayName || o.code || o.id }))} />
        <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between gap-3">
          <Notice tone="info">Exports are logged.</Notice>
          <button type="submit" className={btnPrimary} disabled={!valid || busy}><Download className="w-4 h-4" aria-hidden />{busy ? "Preparing…" : "Download CSV"}</button>
        </div>
      </form>
    </Card>
  );
}

/** P16 — CSV report export (GET /admin/reports/{type}?from&to&format=csv; every export is audited). */
export default function ReportsPage() {
  return (
    <CorePage title="Reports" description="CSV exports for operations and finance (FR-ADM-006)" roles={PAGE_ROLES.reports}>
      <ReportsBody />
    </CorePage>
  );
}
