"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, LastSynced, SelectField, TextField } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import type { CoreNotification } from "@/lib/core-types";
import { formatIST, humanize, shortId } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

function LogBody() {
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");
  const [template, setTemplate] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [page, setPage] = useState(1);
  const q = useCoreQuery(
    () => coreAdmin.notifications({ channel: channel || undefined, status: status || undefined, templateCode: template.trim() || undefined, shipmentId: shipmentId.trim() || undefined, page, limit: 50 }),
    [channel, status, template, shipmentId, page],
  );
  const reset = () => setPage(1);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-40"><SelectField label="Channel" value={channel} onChange={(v) => { setChannel(v); reset(); }} placeholder="Any" options={["IN_APP", "SMS", "WHATSAPP", "PUSH"].map((c) => ({ value: c, label: humanize(c) }))} /></div>
          <div className="w-40"><SelectField label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} placeholder="Any" options={["QUEUED", "SENT", "DELIVERED", "FAILED", "SKIPPED"].map((c) => ({ value: c, label: humanize(c) }))} /></div>
          <div className="w-52"><TextField label="Template code" value={template} onChange={(v) => { setTemplate(v.toUpperCase()); reset(); }} placeholder="SURCHARGE_DUE" /></div>
          <div className="w-64"><TextField label="Shipment ID" value={shipmentId} onChange={(v) => { setShipmentId(v); reset(); }} /></div>
        </div>
        <LastSynced at={q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Notification log" rowKey={(n) => n.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No notifications"
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "time", label: "Created", render: (n: CoreNotification) => <span className="text-[12px] whitespace-nowrap">{formatIST(n.createdAt)}</span> },
          { key: "tpl", label: "Template", render: (n: CoreNotification) => <span className="font-mono text-[12px]">{n.templateCode}</span> },
          { key: "channel", label: "Channel", render: (n: CoreNotification) => humanize(n.channel) },
          // Recipients are masked by the server (+91******0001); full numbers are never shown here.
          { key: "to", label: "Recipient", render: (n: CoreNotification) => <span className="text-[12px]">{humanize(n.recipientKind)} <span className="font-mono">{n.recipientMasked || "—"}</span></span> },
          { key: "title", label: "Title", render: (n: CoreNotification) => <span className="text-[12px]" title={n.body}>{n.title}</span> },
          { key: "shipment", label: "Shipment", render: (n: CoreNotification) => (n.shipmentId ? <Link className="font-mono text-[11px] text-blue-700 hover:underline" href={`/shipments/${n.shipmentId}`}>{shortId(n.shipmentId)}</Link> : "—") },
          { key: "status", label: "Status", render: (n: CoreNotification) => (n.status ? <StatusBadge status={n.status} kind="generic" /> : "—") },
          { key: "retries", label: "Retries", render: (n: CoreNotification) => n.retryCount ?? 0 },
          { key: "ref", label: "Provider ref", render: (n: CoreNotification) => <span className="font-mono text-[11px]">{n.providerRef || "—"}</span> },
        ]} />
    </>
  );
}

/** P18 — notification log with masked recipients (GET /admin/notifications). */
export default function CoreNotificationLog() {
  return (
    <CorePage title="Notification Log" description="In-app, SMS and WhatsApp notifications sent by the core (recipients masked)" roles={PAGE_ROLES.notificationLog}>
      <LogBody />
    </CorePage>
  );
}
