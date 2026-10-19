"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AuditTable } from "@/components/core/pages/ShipmentDetail";
import { CorePage, ErrorBanner, SelectField, TextField, btnOutline, btnPrimary } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import { istDayBoundaryISO } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

const empty = { entityType: "", entityId: "", shipmentId: "", actorId: "", action: "", outcome: "", from: "", to: "" };

function AuditBody() {
  const [draft, setDraft] = useState(empty);
  const [filters, setFilters] = useState(empty);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("shipmentId");
    if (s) { setDraft((d) => ({ ...d, shipmentId: s })); setFilters((f) => ({ ...f, shipmentId: s })); }
  }, []);
  const q = useCoreQuery(
    () => coreAdmin.auditLogs({
      entityType: filters.entityType || undefined, entityId: filters.entityId || undefined, shipmentId: filters.shipmentId || undefined,
      actorId: filters.actorId || undefined, action: filters.action || undefined, outcome: filters.outcome || undefined,
      from: filters.from ? istDayBoundaryISO(filters.from) : undefined, to: filters.to ? istDayBoundaryISO(filters.to, true) : undefined, page, limit: 50,
    }),
    [filters, page],
  );
  const set = (k: keyof typeof empty) => (v: string) => setDraft((d) => ({ ...d, [k]: v.trim() }));
  return (
    <>
      <form className="rb-card-flat p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end" onSubmit={(e) => { e.preventDefault(); setFilters(draft); setPage(1); }} aria-label="Audit filters">
        <TextField label="Action" value={draft.action} onChange={set("action")} placeholder="e.g. WAREHOUSE_RELEASE" />
        <SelectField label="Outcome" value={draft.outcome} onChange={set("outcome")} placeholder="Any" options={[{ value: "SUCCESS", label: "Success" }, { value: "REJECTED", label: "Rejected" }]} />
        <TextField label="Entity type" value={draft.entityType} onChange={set("entityType")} />
        <TextField label="Entity ID" value={draft.entityId} onChange={set("entityId")} />
        <TextField label="Shipment ID" value={draft.shipmentId} onChange={set("shipmentId")} />
        <TextField label="Actor ID" value={draft.actorId} onChange={set("actorId")} />
        <TextField label="From (IST)" type="date" value={draft.from} onChange={set("from")} />
        <TextField label="To (IST)" type="date" value={draft.to} onChange={set("to")} />
        <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
          <button type="button" className={btnOutline} onClick={() => { setDraft(empty); setFilters(empty); setPage(1); }}>Clear</button>
          <button type="submit" className={btnPrimary}><Search className="w-4 h-4" aria-hidden />Apply filters</button>
        </div>
      </form>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <p className="text-[12px] text-gray-500 -mb-2">Rejected attempts are highlighted. Select a row to see the before/after summaries.</p>
      <AuditTable rows={q.data?.data || []} loading={q.loading && !q.data} page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage} />
    </>
  );
}

/** P17 — append-only audit log with filters; REJECTED rows highlighted. */
export default function AuditPage() {
  return (
    <CorePage title="Audit Log" description="Every handoff, override, payment status change, export and rejected attempt (PRD §17)" roles={PAGE_ROLES.audit}>
      <AuditBody />
    </CorePage>
  );
}
