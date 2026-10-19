"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatusBadge, { badgeLabel } from "@/components/ui/StatusBadge";
import { Card, ConfirmDialog, CorePage, ErrorBanner, LastSynced, Notice, ReasonDialog, SelectField, TextField, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import { RECON_ITEM_TYPES, type ReconItem, type ReconRun } from "@/lib/core-types";
import { formatIST, formatISTDate, formatPaise, humanize, istDate, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

function ReconBody() {
  const { roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.finance);
  const { run, busy } = useAction();
  const [date, setDate] = useState(istDate(-1));
  const [confirmRun, setConfirmRun] = useState(false);
  const [status, setStatus] = useState("OPEN");
  const [itemType, setItemType] = useState("");
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<ReconItem | null>(null);
  const runs = useCoreQuery(() => coreAdmin.reconRuns({ limit: 10 }), [], { pollMs: 60000 });
  const items = useCoreQuery(() => coreAdmin.reconItems({ status, itemType: itemType || undefined, page, limit: 50 }), [status, itemType, page], { pollMs: 60000 });

  const startRun = async () => {
    const r = await run(() => coreAdmin.runRecon(date), { success: (x) => `Reconciliation for ${formatISTDate(x.businessDate || date)}: ${x.exceptionCount ?? 0} exception(s)` });
    setConfirmRun(false);
    if (r) { runs.reload(); items.reload(); }
  };

  return (
    <>
      <div className="flex justify-end -mt-2"><LastSynced at={items.syncedAt} onRefresh={() => { runs.reload(); items.reload(); }} /></div>
      <ErrorBanner error={runs.error || items.error} onRetry={() => { runs.reload(); items.reload(); }} />
      <Card title="Run reconciliation">
        {canWrite ? (
          <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (date) setConfirmRun(true); }}>
            <div className="w-48"><TextField label="Business date (IST)" type="date" value={date} onChange={setDate} max={istDate()} required /></div>
            <button type="submit" className={btnPrimary} disabled={!date || busy}><Play className="w-4 h-4" aria-hidden />Run for date</button>
          </form>
        ) : <Notice tone="info">Only finance or admin can run reconciliation.</Notice>}
        <div className="mt-4">
          <DataTable caption="Recent reconciliation runs" rowKey={(r) => r.id} data={runs.data?.data || []} loading={runs.loading && !runs.data} emptyMessage="No runs yet" columns={[
            { key: "date", label: "Business date", render: (r: ReconRun) => formatISTDate(r.businessDate) },
            { key: "status", label: "Status", render: (r: ReconRun) => (r.status ? <StatusBadge status={r.status} kind="generic" /> : "—") },
            { key: "counts", label: "Provider / internal / matched", render: (r: ReconRun) => <span className="tabular-nums">{r.providerTxnCount ?? "—"} / {r.internalTxnCount ?? "—"} / {r.matchedCount ?? "—"}</span> },
            { key: "exceptions", label: "Exceptions", render: (r: ReconRun) => <span className={`tabular-nums font-semibold ${(r.exceptionCount || 0) > 0 ? "text-red-700" : ""}`}>{r.exceptionCount ?? "—"}</span> },
            { key: "time", label: "Completed", render: (r: ReconRun) => <span className="text-[12px]">{formatIST(r.completedAt || r.startedAt)}</span> },
            { key: "error", label: "Error", render: (r: ReconRun) => <span className="text-[12px] text-red-700">{r.error || ""}</span> },
          ]} />
        </div>
      </Card>
      <Card title="Exception queue">
        <div className="flex flex-wrap items-end gap-4 mb-3">
          <FilterTabs ariaLabel="Item status" tabs={[{ label: "Open", value: "OPEN" }, { label: "Resolved", value: "RESOLVED" }, { label: "Matched", value: "MATCHED" }]} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          <div className="w-56"><SelectField label="Type" value={itemType} onChange={(v) => { setItemType(v); setPage(1); }} placeholder="Any type" options={RECON_ITEM_TYPES.map((t) => ({ value: t, label: badgeLabel(t, "reconItem") }))} /></div>
        </div>
        <DataTable caption="Reconciliation items" rowKey={(i) => i.id} data={items.data?.data || []} loading={items.loading && !items.data} emptyMessage="No items"
          page={items.data?.meta?.page || page} totalPages={items.data?.meta?.totalPages || 1} onPageChange={setPage}
          columns={[
            { key: "type", label: "Type", render: (i: ReconItem) => (i.itemType ? <StatusBadge status={i.itemType} kind="reconItem" /> : "—") },
            { key: "ref", label: "Provider ref", render: (i: ReconItem) => <span className="font-mono text-[11px]">{i.providerRef || "—"}</span> },
            { key: "intent", label: "Intent / refund", render: (i: ReconItem) => <span className="font-mono text-[11px]">{shortId(i.paymentIntentId)} {i.refundId ? `/ ${shortId(i.refundId)}` : ""}</span> },
            { key: "amounts", label: "Provider / internal / ledger", render: (i: ReconItem) => <span className="tabular-nums text-[12px]">{formatPaise(i.providerAmountPaise)} / {formatPaise(i.internalAmountPaise)} / {formatPaise(i.ledgerAmountPaise)}</span> },
            { key: "status", label: "Status", render: (i: ReconItem) => (i.status ? <StatusBadge status={i.status} kind="generic" /> : "—") },
            { key: "note", label: "Resolution", render: (i: ReconItem) => <span className="text-[12px]">{i.resolutionNote ? `${i.resolutionNote} · ${formatIST(i.resolvedAt)}` : "—"}</span> },
            { key: "ops", label: "Operations", render: (i: ReconItem) => (canWrite && i.status === "OPEN" ? <button className={rowAction("green")} onClick={() => setResolving(i)}>Resolve</button> : <span className="text-gray-400">—</span>) },
          ]} />
      </Card>
      <ConfirmDialog open={confirmRun} title="Run reconciliation" busy={busy} confirmLabel="Run" onClose={() => setConfirmRun(false)} onConfirm={startRun}
        message={`Reconcile provider transactions, payments and ledger postings for ${formatISTDate(date)} (IST)?`} />
      <ReasonDialog open={!!resolving} title={`Resolve ${resolving ? humanize(resolving.itemType) : ""}`} busy={busy} onClose={() => setResolving(null)} confirmLabel="Resolve item" reasonLabel="Note" maxLength={1000}
        summary="Record how this exception was investigated and settled. The note is audited."
        onConfirm={async (note) => { if (!resolving) return; const r = await run(() => coreAdmin.resolveReconItem(resolving.id, note), { success: "Item resolved" }); if (r) { setResolving(null); items.reload(); } }} />
    </>
  );
}

/** P15 — reconciliation runs and exception queue (60 s polling; finance, admin). */
export default function FinanceReconciliationPage() {
  return (
    <CorePage title="Reconciliation" description="Daily provider ↔ payments ↔ ledger reconciliation with an exception queue (FR-FIN-001)" roles={PAGE_ROLES.finance}>
      <ReconBody />
    </CorePage>
  );
}
