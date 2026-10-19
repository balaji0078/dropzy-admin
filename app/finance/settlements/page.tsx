"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { ConfirmDialog, CorePage, ErrorBanner, JsonBlock, KV, LastSynced, Notice, ReasonDialog, SelectField, TextField, btnOutline, btnPrimary, rowAction } from "@/components/core/ui";
import { coreAdmin, isCoreApiError } from "@/lib/core-api";
import type { Operator, Settlement } from "@/lib/core-types";
import { downloadCsv } from "@/lib/csv";
import { formatIST, formatISTDate, formatPaise, istDate, paiseToRupeesInput } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";
import { useToast } from "@/components/ui/Toast";

const FOUR_EYES = "A different finance user must approve.";
const TABS = [{ label: "All", value: "" }, { label: "Generated", value: "GENERATED" }, { label: "Approved", value: "APPROVED" }, { label: "Paid", value: "PAID" }, { label: "Void", value: "VOID" }];
const rupees = (p?: number) => paiseToRupeesInput(p);

function SettlementsBody() {
  const { me, roles } = useAuth();
  const canWrite = hasAnyRole(roles, WRITE_ROLES.finance);
  const toast = useToast();
  const { run, busy } = useAction();
  const [status, setStatus] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [gen, setGen] = useState({ operatorId: "", periodStart: istDate(-7), periodEnd: istDate(-1) });
  const [approving, setApproving] = useState<Settlement | null>(null);
  const [paying, setPaying] = useState<Settlement | null>(null);
  const [payoutRef, setPayoutRef] = useState("");
  const [voiding, setVoiding] = useState<Settlement | null>(null);
  const [detail, setDetail] = useState<Settlement | null>(null);
  const ops = useCoreQuery<Operator[]>(() => coreAdmin.operators(), [], { silent: true });
  const q = useCoreQuery(() => coreAdmin.settlements({ status: status || undefined, operatorId: operatorId || undefined, page, limit: 50 }), [status, operatorId, page]);
  const rows = q.data?.data || [];
  const lookup = (kind: "warehouse" | "settlement", id: string) => (kind === "settlement" ? rows.find((s) => s.id === id)?.statementNumber : undefined);

  // CSV export reuses the settlements export helper (lib/csv.ts); amounts are the server's paise values.
  const exportCsv = () => {
    downloadCsv("settlements.csv",
      ["Statement", "Operator", "Period start", "Period end", "Shipments", "Gross base fare", "Commission", "Operator base share", "Surcharge share", "Refunds share", "Net payable", "Ledger payable", "Mismatches", "Status", "Payout reference"],
      rows.map((s) => [s.statementNumber, s.operatorName, s.periodStart, s.periodEnd, s.shipmentCount, rupees(s.grossBaseFarePaise), rupees(s.commissionPaise), rupees(s.operatorBaseSharePaise), rupees(s.surchargeOperatorSharePaise), rupees(s.refundsOperatorSharePaise), rupees(s.netPayablePaise), rupees(s.ledgerPayablePaise), s.mismatchCount, s.status, s.payoutReference || ""]));
    toast("Settlements exported");
  };

  const generate = async () => {
    const r = await run(() => coreAdmin.generateSettlement(gen), { success: (s) => `Statement ${s.statementNumber || ""} generated`, errorContext: "settlement", vars: { lookup } });
    if (r) { setGenerating(false); q.reload(); }
  };
  const approve = async () => {
    if (!approving) return;
    const r = await run(() => coreAdmin.approveSettlement(approving.id), {
      success: "Settlement approved",
      onError: (e) => { if (isCoreApiError(e) && e.code === "FORBIDDEN") { toast(FOUR_EYES, "error", { detail: e.correlationId ? `Ref: ${e.correlationId}` : undefined }); return true; } return false; },
    });
    setApproving(null);
    if (r) q.reload();
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-end gap-4">
          <FilterTabs ariaLabel="Settlement status" tabs={TABS} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          <div className="w-56"><SelectField label="Operator" value={operatorId} onChange={(v) => { setOperatorId(v); setPage(1); }} placeholder="All operators" options={(ops.data || []).map((o) => ({ value: o.id, label: o.displayName || o.code || o.id }))} /></div>
        </div>
        <div className="flex items-center gap-2">
          <LastSynced at={q.syncedAt} onRefresh={q.reload} />
          <button className={btnOutline} onClick={exportCsv} disabled={!rows.length}><Download className="w-4 h-4" aria-hidden />Export CSV</button>
          {canWrite && <button className={btnPrimary} onClick={() => setGenerating(true)}><Plus className="w-4 h-4" aria-hidden />Generate statement</button>}
        </div>
      </div>
      {!canWrite && <Notice tone="info">Read-only access.</Notice>}
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Operator settlements" rowKey={(s) => s.id} data={rows} loading={q.loading && !q.data} emptyMessage="No settlements" onRowClick={setDetail}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "no", label: "Statement", render: (s: Settlement) => <div><p className="font-mono text-[12px]">{s.statementNumber}</p><p className="text-xs text-gray-500">{s.operatorName}</p></div> },
          { key: "period", label: "Period", render: (s: Settlement) => <span className="text-[12px]">{formatISTDate(s.periodStart)} – {formatISTDate(s.periodEnd)}</span> },
          { key: "count", label: "Shipments", render: (s: Settlement) => s.shipmentCount ?? "—" },
          { key: "gross", label: "Gross base fare", render: (s: Settlement) => <span className="tabular-nums">{formatPaise(s.grossBaseFarePaise)}</span> },
          { key: "commission", label: "Commission", render: (s: Settlement) => <span className="tabular-nums">{formatPaise(s.commissionPaise)}</span> },
          { key: "net", label: "Net payable", render: (s: Settlement) => <span className="tabular-nums font-semibold">{formatPaise(s.netPayablePaise)}</span> },
          { key: "mismatch", label: "Ledger check", render: (s: Settlement) => (s.mismatchCount ? <span className="text-[12px] font-semibold text-red-700">{s.mismatchCount} mismatch(es)</span> : <span className="text-[12px] text-green-700">Matches ledger</span>) },
          { key: "status", label: "Status", render: (s: Settlement) => (s.status ? <StatusBadge status={s.status} kind="generic" /> : "—") },
          { key: "ops", label: "Operations", render: (s: Settlement) => {
            if (!canWrite) return <span className="text-gray-400">—</span>;
            const ownStatement = !!me && s.generatedBy === me.id;
            return (
              <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {s.status === "GENERATED" && (
                  <span className="inline-flex flex-col">
                    <button className={rowAction("green")} disabled={ownStatement} onClick={() => setApproving(s)}>Approve</button>
                    {ownStatement && <span className="text-[11px] text-gray-500">{FOUR_EYES}</span>}
                  </span>
                )}
                {s.status === "APPROVED" && <button className={rowAction("blue")} onClick={() => { setPayoutRef(""); setPaying(s); }}>Mark paid</button>}
                {(s.status === "GENERATED" || s.status === "APPROVED") && <button className={rowAction("red")} onClick={() => setVoiding(s)}>Void</button>}
                {s.status === "PAID" && <span className="text-[12px] text-gray-600">Ref {s.payoutReference} · {formatIST(s.paidAt)}</span>}
              </div>
            );
          } },
        ]} />

      {generating && (
        <Modal open onClose={() => setGenerating(false)} title="Generate settlement statement">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); generate(); }}>
            <SelectField label="Operator" value={gen.operatorId} onChange={(v) => setGen((g) => ({ ...g, operatorId: v }))} placeholder="Select…" required options={(ops.data || []).map((o) => ({ value: o.id, label: o.displayName || o.code || o.id }))} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Period start (IST)" type="date" value={gen.periodStart} onChange={(v) => setGen((g) => ({ ...g, periodStart: v }))} required />
              <TextField label="Period end (IST)" type="date" value={gen.periodEnd} onChange={(v) => setGen((g) => ({ ...g, periodEnd: v }))} required error={gen.periodEnd < gen.periodStart ? "Must be on or after the start." : undefined} />
            </div>
            <div className="flex justify-end gap-2"><button type="button" className={btnOutline} onClick={() => setGenerating(false)}>Cancel</button>
              <button type="submit" className={btnPrimary} disabled={!gen.operatorId || !gen.periodStart || !gen.periodEnd || gen.periodEnd < gen.periodStart || busy}>Generate</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!approving} title="Approve settlement" busy={busy} confirmLabel="Approve" onClose={() => setApproving(null)} onConfirm={approve}
        message={`Approve ${approving?.statementNumber} for ${approving?.operatorName}: net payable ${formatPaise(approving?.netPayablePaise)}? ${FOUR_EYES}`} />
      <ReasonDialog open={!!paying} title="Mark settlement paid" busy={busy} requireReason={false} onClose={() => setPaying(null)} confirmLabel="Mark paid" canConfirm={payoutRef.trim().length >= 3}
        summary={`Record the manual payout of ${formatPaise(paying?.netPayablePaise)} to ${paying?.operatorName}. This posts a SETTLEMENT_PAYOUT ledger transaction.`}
        onConfirm={async () => { if (!paying) return; const r = await run(() => coreAdmin.markSettlementPaid(paying.id, payoutRef.trim()), { success: "Settlement marked paid" }); if (r) { setPaying(null); q.reload(); } }}>
        <TextField label="Payout reference (UTR / bank ref)" value={payoutRef} onChange={setPayoutRef} required maxLength={120} />
      </ReasonDialog>
      <ReasonDialog open={!!voiding} title="Void settlement" busy={busy} danger onClose={() => setVoiding(null)} confirmLabel="Void statement"
        summary={`Void ${voiding?.statementNumber}? A voided period can be generated again.`}
        onConfirm={async (reason) => { if (!voiding) return; const r = await run(() => coreAdmin.voidSettlement(voiding.id, reason), { success: "Settlement voided" }); if (r) { setVoiding(null); q.reload(); } }} />
      {detail && (
        <Modal open onClose={() => setDetail(null)} title={`${detail.statementNumber} — ${detail.operatorName}`} size="xl">
          <div className="space-y-3">
            <KV cols={3} items={[
              ["Period", `${formatISTDate(detail.periodStart)} – ${formatISTDate(detail.periodEnd)}`], ["Shipments", detail.shipmentCount], ["Status", detail.status],
              ["Gross base fare", formatPaise(detail.grossBaseFarePaise)], ["Commission", formatPaise(detail.commissionPaise)], ["Operator base share", formatPaise(detail.operatorBaseSharePaise)],
              ["Surcharge share", formatPaise(detail.surchargeOperatorSharePaise)], ["Refunds share", formatPaise(detail.refundsOperatorSharePaise)], ["Net payable", formatPaise(detail.netPayablePaise)],
              ["Ledger payable", formatPaise(detail.ledgerPayablePaise)], ["Mismatches", detail.mismatchCount], ["Payout reference", detail.payoutReference || "—"],
            ]} />
            <DetailRows id={detail.id} />
          </div>
        </Modal>
      )}
    </>
  );
}

function DetailRows({ id }: { id: string }) {
  const q = useCoreQuery(() => coreAdmin.settlement(id), [id]);
  if (q.loading && !q.data) return <p className="text-[13px] text-gray-500">Loading per-shipment details…</p>;
  return <div><p className="text-[12px] font-semibold text-gray-600 mb-1">Per-shipment details</p><JsonBlock value={q.data?.details || []} /></div>;
}

/** P15 — operator settlements: generate, approve (four-eyes), mark paid, void, CSV export (finance, admin). */
export default function FinanceSettlementsPage() {
  return (
    <CorePage title="Settlements" description="Operator settlement statements with four-eyes approval (FR-FIN-003)" roles={PAGE_ROLES.finance}>
      <SettlementsBody />
    </CorePage>
  );
}
