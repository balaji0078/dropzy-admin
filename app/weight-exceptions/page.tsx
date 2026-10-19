"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, LastSynced } from "@/components/core/ui";
import { Deadline } from "@/components/core/domain";
import { coreAdmin } from "@/lib/core-api";
import type { WeightExceptionRow } from "@/lib/core-types";
import { formatKg, formatPaise, formatSignedKg, humanize, shortId } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

// Tabs per CLIENT_CONTRACTS.md §4.1 P5 (server status filter; rows ordered by cutoffAt ascending).
const TABS = [
  { label: "Unpaid before cutoff", value: "UNPAID_BEFORE_CUTOFF" },
  { label: "Cutoff passed", value: "CUTOFF_PASSED_UNPAID" },
  { label: "Verifying", value: "PAYMENT_PENDING_VERIFICATION" },
  { label: "Disputed", value: "DISPUTED" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Re-measured down", value: "REMEASURED_DOWN" },
  { label: "All", value: "ALL" },
];

/** P5 — weight exceptions queue (OPS-01), 30 s polling. */
function WeightExceptionsBody() {
  const router = useRouter();
  const [status, setStatus] = useState("UNPAID_BEFORE_CUTOFF");
  const [page, setPage] = useState(1);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && TABS.some((t) => t.value === s)) setStatus(s);
  }, []);
  const q = useCoreQuery(() => coreAdmin.weightExceptions({ status, page, limit: 50 }), [status, page], { pollMs: 30000 });
  const rows = q.data?.data || [];

  const columns = [
    { key: "dcn", label: "DCN", render: (r: WeightExceptionRow) => (
      <Link href={`/shipments/${r.shipmentId}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-blue-700 hover:underline">{r.dcn || shortId(r.shipmentId)}</Link>) },
    { key: "route", label: "Route", render: (r: WeightExceptionRow) => <span className="text-gray-900">{r.routeName || "—"}</span> },
    { key: "operator", label: "Operator", render: (r: WeightExceptionRow) => r.operatorName || "—" },
    { key: "declared", label: "Declared", render: (r: WeightExceptionRow) => <span className="tabular-nums">{formatKg(r.declaredWeightGrams)}</span> },
    { key: "actual", label: "Actual", render: (r: WeightExceptionRow) => (
      <span className="tabular-nums"><span className="font-semibold text-gray-900">{formatKg(r.actualWeightGrams)}</span>
        <span className={`block text-[11px] ${(r.rawDifferenceGrams || 0) > 0 ? "text-red-700" : "text-gray-500"}`}>{formatSignedKg(r.rawDifferenceGrams)}</span></span>) },
    { key: "due", label: "Amount due", render: (r: WeightExceptionRow) => <span className="tabular-nums font-semibold">{formatPaise(r.amountDuePaise)}</span> },
    { key: "deadline", label: "Deadline", render: (r: WeightExceptionRow) => <Deadline at={r.cutoffAt} /> },
    { key: "label", label: "Label", render: (r: WeightExceptionRow) => (
      <div className="flex flex-col gap-1 items-start">
        {r.driverLabel ? <StatusBadge status={r.driverLabel} kind="driverLabel" /> : "—"}
        {r.reviewReasonCode && <span className="text-[11px] text-purple-700">Review: {humanize(r.reviewReasonCode)}</span>}
        {r.quoteVersion ? <span className="text-[11px] text-gray-500">Quote v{r.quoteVersion} · {humanize(r.quoteStatus)}</span> : null}
      </div>) },
    { key: "by", label: "Measured by", render: (r: WeightExceptionRow) => (
      <span className="text-[11px]"><span className="font-mono" title={r.measuredBy}>{shortId(r.measuredBy)}</span>{r.measurementCount && r.measurementCount > 1 ? <span className="block text-gray-500">{r.measurementCount} measurements</span> : null}</span>) },
  ];

  return (
    <>
      <div className="flex justify-end -mt-2"><LastSynced at={q.syncedAt} onRefresh={q.reload} /></div>
      <FilterTabs ariaLabel="Exception status" tabs={TABS} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Weight exceptions" rowKey={(r) => r.shipmentId} columns={columns} data={rows} loading={q.loading && !q.data}
        emptyMessage="No shipments in this queue" onRowClick={(r) => router.push(`/shipments/${r.shipmentId}`)}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage} />
    </>
  );
}

export default function WeightExceptionsPage() {
  return (
    <CorePage title="Weight Exceptions" description="Discrepancies and unpaid-cutoff risks, soonest deadline first (PRD §14, OPS-01)" roles={PAGE_ROLES.weightExceptions}>
      <WeightExceptionsBody />
    </CorePage>
  );
}
