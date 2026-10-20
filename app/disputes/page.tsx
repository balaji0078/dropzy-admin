"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, LastSynced, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { Dispute } from "@/lib/core-types";
import { formatIST, humanize, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const TABS = [{ label: "Open", value: "OPEN" }, { label: "Under review", value: "UNDER_REVIEW" }, { label: "Resolved", value: "RESOLVED" }, { label: "All", value: "" }];

function DisputesBody() {
  const router = useRouter();
  const { me, roles } = useAuth();
  const { run } = useAction();
  const [status, setStatus] = useState("OPEN");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const q = useCoreQuery(() => coreAdmin.disputes({ status: status || undefined, assignedTo: mine ? me?.id : undefined, page, limit: 50 }), [status, mine, page], { pollMs: 30000 });
  const canAssign = hasAnyRole(roles, WRITE_ROLES.assignDispute);
  const canShipment = hasAnyRole(roles, PAGE_ROLES.shipments);

  const assignToMe = async (d: Dispute) => {
    if (!me) return;
    const r = await run(() => coreAdmin.assignDispute(d.id, me.id), { success: `${d.caseNumber} assigned to you` });
    if (r) q.reload();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-center gap-4">
          <FilterTabs ariaLabel="Dispute status" tabs={TABS} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          <CheckboxField label="Assigned to me" checked={mine} onChange={(v) => { setMine(v); setPage(1); }} />
        </div>
        <LastSynced at={q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Disputes (oldest open first)" rowKey={(d) => d.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No disputes"
        onRowClick={(d) => router.push(`/disputes/${d.id}`)} page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "case", label: "Case", render: (d: Dispute) => <Link href={`/disputes/${d.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-primary-light hover:text-gold hover:underline">{d.caseNumber || shortId(d.id)}</Link> },
          { key: "dcn", label: "DCN", render: (d: Dispute) => (canShipment && d.shipmentId ? <Link href={`/shipments/${d.shipmentId}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-primary-light hover:text-gold hover:underline">{d.dcn}</Link> : <span className="font-mono text-xs">{d.dcn}</span>) },
          { key: "reason", label: "Reason", render: (d: Dispute) => humanize(d.reasonCode) },
          { key: "status", label: "Status", render: (d: Dispute) => (d.status ? <StatusBadge status={d.status} kind="generic" /> : "—") },
          { key: "hold", label: "Hold", render: (d: Dispute) => (d.holdPlaced ? <StatusBadge status="DISPUTE" kind="hold" /> : <span className="text-ink-faint text-[12px]">No hold</span>) },
          { key: "assignee", label: "Assigned to", render: (d: Dispute) => (d.assignedTo ? (d.assignedTo === me?.id ? "Me" : <span className="font-mono text-[11px]">{shortId(d.assignedTo)}</span>) : <span className="text-ink-faint">Unassigned</span>) },
          { key: "outcome", label: "Outcome", render: (d: Dispute) => humanize(d.outcome) },
          { key: "created", label: "Opened", render: (d: Dispute) => <span className="text-[12px]">{formatIST(d.createdAt)}</span> },
          { key: "ops", label: "Operations", render: (d: Dispute) => (canAssign && d.status !== "RESOLVED" && d.assignedTo !== me?.id ? (
            <button className={rowAction("indigo")} onClick={(e) => { e.stopPropagation(); assignToMe(d); }}>Assign to me</button>) : <span className="text-ink-faint">—</span>) },
        ]} />
    </>
  );
}

/** P10 — dispute queue (30 s). */
export default function DisputesPage() {
  return (
    <CorePage title="Disputes" description="Weight and payment disputes with preserved quote snapshots (T11/T12, OPS-02)" roles={PAGE_ROLES.disputes}>
      <DisputesBody />
    </CorePage>
  );
}
