"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { Card, CorePage, ErrorBanner, LastSynced, SelectField, TextField } from "@/components/core/ui";
import { LedgerTab } from "@/components/core/pages/ShipmentDetail";
import { coreAdmin } from "@/lib/core-api";
import type { LedgerBalance } from "@/lib/core-types";
import { formatIST, formatPaise, istDayBoundaryISO, istLocalToISO } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

const KINDS = ["BASE_FARE_COLLECTION", "SURCHARGE_COLLECTION", "GATEWAY_FEE", "REFUND", "ORPHAN_COLLECTION", "SETTLEMENT_PAYOUT"];

function LedgerBody() {
  const [asOf, setAsOf] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState("");
  const [account, setAccount] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [page, setPage] = useState(1);
  const bal = useCoreQuery(() => coreAdmin.ledgerBalances({ asOf: asOf ? istLocalToISO(asOf) || undefined : undefined }), [asOf]);
  const tx = useCoreQuery(
    () => coreAdmin.ledgerTransactions({ from: from ? istDayBoundaryISO(from) : undefined, to: to ? istDayBoundaryISO(to, true) : undefined, kind: kind || undefined, accountCode: account.trim() || undefined, shipmentId: shipmentId.trim() || undefined, page, limit: 25 }),
    [from, to, kind, account, shipmentId, page],
  );
  const balanced = bal.data?.balanced;
  return (
    <>
      <ErrorBanner error={bal.error || tx.error} onRetry={() => { bal.reload(); tx.reload(); }} />
      <Card title="Balances" actions={<>
        <div className="w-56"><TextField label="As of (IST, optional)" type="datetime-local" value={asOf} onChange={setAsOf} /></div>
        <LastSynced at={bal.syncedAt} onRefresh={bal.reload} />
      </>}>
        {balanced !== undefined && (
          <p className={`mb-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${balanced ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`} role="status">
            {balanced ? <CheckCircle2 className="w-4 h-4" aria-hidden /> : <AlertTriangle className="w-4 h-4" aria-hidden />}
            {balanced ? "Ledger balanced (debits = credits)" : "Ledger NOT balanced — investigate immediately"}
            <span className="font-normal text-gray-600">as of {formatIST(bal.data?.asOf)}</span>
          </p>
        )}
        <DataTable caption="Account balances" rowKey={(a) => a.accountCode || ""} data={bal.data?.accounts || []} loading={bal.loading && !bal.data} emptyMessage="No accounts" columns={[
          { key: "code", label: "Account", render: (a: LedgerBalance) => <div><p className="font-mono text-[12px]">{a.accountCode}</p><p className="text-xs text-gray-500">{a.accountName}</p></div> },
          { key: "type", label: "Type", render: (a: LedgerBalance) => a.accountType || "—" },
          { key: "debit", label: "Debits", render: (a: LedgerBalance) => <span className="tabular-nums">{formatPaise(a.debitPaise)}</span> },
          { key: "credit", label: "Credits", render: (a: LedgerBalance) => <span className="tabular-nums">{formatPaise(a.creditPaise)}</span> },
          { key: "balance", label: "Balance", render: (a: LedgerBalance) => <span className="tabular-nums font-semibold">{formatPaise(a.balancePaise)}</span> },
        ]} />
      </Card>
      <Card title="Transactions (append-only)">
        <div className="flex flex-wrap items-end gap-3 mb-3">
          <div className="w-40"><TextField label="From (IST)" type="date" value={from} onChange={(v) => { setFrom(v); setPage(1); }} /></div>
          <div className="w-40"><TextField label="To (IST)" type="date" value={to} onChange={(v) => { setTo(v); setPage(1); }} /></div>
          <div className="w-56"><SelectField label="Kind" value={kind} onChange={(v) => { setKind(v); setPage(1); }} placeholder="Any" options={KINDS.map((k) => ({ value: k, label: k.replace(/_/g, " ").toLowerCase() }))} /></div>
          <div className="w-40"><TextField label="Account code" value={account} onChange={(v) => { setAccount(v); setPage(1); }} /></div>
          <div className="w-64"><TextField label="Shipment ID" value={shipmentId} onChange={(v) => { setShipmentId(v); setPage(1); }} /></div>
        </div>
        {tx.loading && !tx.data ? <p className="text-[13px] text-gray-500">Loading…</p> : <LedgerTab rows={tx.data?.data || []} />}
        {(tx.data?.meta?.totalPages || 1) > 1 && (
          <div className="flex items-center justify-end gap-2 mt-3 text-[12px]">
            <button className="px-2 py-1 rounded border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {tx.data?.meta?.totalPages}</span>
            <button className="px-2 py-1 rounded border disabled:opacity-40" disabled={page >= (tx.data?.meta?.totalPages || 1)} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </Card>
    </>
  );
}

/** P15 — double-entry ledger with the server's balanced indicator (finance, admin). */
export default function FinanceLedgerPage() {
  return (
    <CorePage title="Ledger" description="Account balances with trial-balance check and append-only transactions (FR-FIN-002)" roles={PAGE_ROLES.finance}>
      <LedgerBody />
    </CorePage>
  );
}
