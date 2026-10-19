"use client";

import { useState } from "react";
import { Activity, Inbox, XCircle, AlertTriangle, Webhook, Hourglass, Lock, Warehouse, Landmark, ShieldAlert, RefreshCw } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, ConfirmDialog, CorePage, ErrorBanner, JsonBlock, LastSynced, Notice, rowAction } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { OutboxEvent } from "@/lib/core-types";
import { formatDurationSeconds, formatIST, shortId } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

function OutboxPanel() {
  const { run, busy } = useAction();
  const [status, setStatus] = useState("DEAD");
  const [page, setPage] = useState(1);
  const [retrying, setRetrying] = useState<OutboxEvent | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const q = useCoreQuery(() => coreAdmin.outbox({ status, page, limit: 50 }), [status, page], { pollMs: 30000 });
  return (
    <Card title="Outbox events" actions={<FilterTabs ariaLabel="Outbox status" tabs={[{ label: "Dead", value: "DEAD" }, { label: "Pending", value: "PENDING" }, { label: "Dispatched", value: "DISPATCHED" }]} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />}>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Outbox events" rowKey={(e) => e.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No events" onRowClick={(e) => setOpen(open === e.id ? null : e.id)}
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        rowClassName={(e) => (e.status === "DEAD" ? "bg-red-50" : undefined)}
        columns={[
          { key: "type", label: "Event", render: (e: OutboxEvent) => <span className="font-mono text-[12px]">{e.eventType}</span> },
          { key: "agg", label: "Aggregate", render: (e: OutboxEvent) => <span className="text-[12px]">{e.aggregateType} <span className="font-mono text-gray-500">{shortId(e.aggregateId)}</span>{e.aggregateVersion !== null && e.aggregateVersion !== undefined ? ` v${e.aggregateVersion}` : ""}</span> },
          { key: "time", label: "Occurred", render: (e: OutboxEvent) => <span className="text-[12px]">{formatIST(e.occurredAt)}</span> },
          { key: "status", label: "Status", render: (e: OutboxEvent) => (e.status ? <StatusBadge status={e.status} kind="generic" /> : "—") },
          { key: "attempts", label: "Attempts", render: (e: OutboxEvent) => e.attempts ?? 0 },
          { key: "error", label: "Last error", render: (e: OutboxEvent) => <span className="text-[11px] text-red-700">{e.lastError || ""}</span> },
          { key: "ops", label: "Operations", render: (e: OutboxEvent) => (e.status === "DEAD" ? <button className={rowAction("blue")} onClick={(ev) => { ev.stopPropagation(); setRetrying(e); }}><RefreshCw className="w-3.5 h-3.5" aria-hidden />Retry</button> : <span className="text-gray-400">—</span>) },
        ]} />
      {open && <div className="mt-3"><JsonBlock value={(q.data?.data || []).find((e) => e.id === open)?.payload} /></div>}
      <ConfirmDialog open={!!retrying} title="Retry dead event" busy={busy} confirmLabel="Re-queue" onClose={() => setRetrying(null)}
        message={`Re-queue ${retrying?.eventType} (${shortId(retrying?.id)})? Attempts are reset; consumers are idempotent.`}
        onConfirm={async () => { if (!retrying) return; const r = await run(() => coreAdmin.retryOutbox(retrying.id), { success: "Event re-queued" }); setRetrying(null); if (r) q.reload(); }} />
    </Card>
  );
}

function SystemBody() {
  const { roles } = useAuth();
  const canOutbox = hasAnyRole(roles, WRITE_ROLES.outbox);
  const q = useCoreQuery(() => coreAdmin.health(), [], { pollMs: 30000 });
  const h = q.data;
  const n = (v?: number) => (v === undefined || v === null ? "—" : v);
  const alert = (v: number | undefined, threshold = 0) => (v || 0) > threshold;
  return (
    <>
      <div className="flex justify-end -mt-2"><LastSynced at={h?.serverTime || q.syncedAt} onRefresh={q.reload} /></div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {h && (alert(h.outboxDead) || alert(h.webhookSignatureFailures24h) || alert(h.providerEventsInException) || alert(h.warehouseItemsOverMaxHold)) && (
        <Notice tone="danger" title="Alerts need attention">One or more health indicators are above zero. Investigate dead events, provider exceptions, webhook signature failures and over-age warehouse items.</Notice>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Outbox pending" value={n(h?.outboxPending)} icon={Inbox} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatsCard title="Oldest pending event" value={formatDurationSeconds(h?.outboxOldestPendingAgeSeconds)} icon={Hourglass} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="Dead events" value={n(h?.outboxDead)} icon={XCircle} />
        <StatsCard title="Provider events in exception" value={n(h?.providerEventsInException)} icon={AlertTriangle} />
        <StatsCard title="Provider events pending retry" value={n(h?.providerEventsPendingRetry)} icon={RefreshCw} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="Oldest pending provider intent" value={formatDurationSeconds(h?.oldestPendingProviderIntentAgeSeconds)} icon={Hourglass} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatsCard title="Last webhook received" value={h?.lastWebhookReceivedAt ? formatIST(h.lastWebhookReceivedAt) : "Never"} icon={Webhook} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatsCard title="Webhook signature failures (24 h)" value={n(h?.webhookSignatureFailures24h)} icon={ShieldAlert} />
        <StatsCard title="Unpaid holds past cutoff" value={n(h?.unpaidHoldsPastCutoff)} icon={Lock} />
        <StatsCard title="Warehouse items over max hold" value={n(h?.warehouseItemsOverMaxHold)} icon={Warehouse} />
        <StatsCard title="Open recon exceptions" value={n(h?.openReconExceptions)} icon={Landmark} />
        <StatsCard title="Workers" value={h?.workers ? `${h.workers.filter((w) => !w.lastError).length}/${h.workers.length} healthy` : "—"} icon={Activity} iconColor="text-green-600" iconBg="bg-green-50" />
      </div>
      <Card title="Workers">
        <DataTable caption="Background workers" rowKey={(w) => w.name || ""} data={h?.workers || []} loading={q.loading && !q.data} emptyMessage="No worker data" columns={[
          { key: "name", label: "Worker", render: (w: { name?: string }) => <span className="font-mono text-[12px]">{w.name}</span> },
          { key: "last", label: "Last run", render: (w: { lastRunAt?: string | null }) => <span className="text-[12px]">{formatIST(w.lastRunAt)}</span> },
          { key: "error", label: "Status", render: (w: { lastError?: string | null }) => (w.lastError ? <span className="inline-flex items-center gap-1 text-[12px] text-red-700"><XCircle className="w-3.5 h-3.5" aria-hidden />{w.lastError}</span> : <StatusBadge status="SUCCESS" kind="generic" label="OK" />) },
        ]} />
      </Card>
      {canOutbox ? <OutboxPanel /> : <Notice tone="info">Outbox events and retries are available to admins only.</Notice>}
    </>
  );
}

/** P19 — system health / alert inputs (DESIGN.md §17), outbox and dead-event retry (admin). */
export default function SystemPage() {
  return (
    <CorePage title="System Health" description="Outbox backlog, provider events, webhooks, unpaid holds past cutoff and warehouse ageing (PRD §24)" roles={PAGE_ROLES.system}>
      <SystemBody />
    </CorePage>
  );
}
