"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import StatusBadge, { badgeLabel } from "@/components/ui/StatusBadge";
import { CheckboxField, CorePage, ErrorBanner, LastSynced, SelectField, TextField } from "@/components/core/ui";
import { coreAdmin } from "@/lib/core-api";
import { PAYMENT_STATUSES, type PaymentIntent } from "@/lib/core-types";
import { formatIST, formatPaise, humanize, istDayBoundaryISO, shortId } from "@/lib/format";
import { PAGE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useCoreQuery } from "@/lib/use-core";

function PaymentsBody() {
  const { roles } = useAuth();
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [orphan, setOrphan] = useState(false);
  const [page, setPage] = useState(1);
  const canShipment = hasAnyRole(roles, PAGE_ROLES.shipments);
  const q = useCoreQuery(
    () => coreAdmin.payments({ status: status || undefined, kind: kind || undefined, from: from ? istDayBoundaryISO(from) : undefined, to: to ? istDayBoundaryISO(to, true) : undefined, orphan: orphan || undefined, page, limit: 50 }),
    [status, kind, from, to, orphan, page],
  );
  const reset = () => setPage(1);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48"><SelectField label="Status" value={status} onChange={(v) => { setStatus(v); reset(); }} placeholder="Any" options={PAYMENT_STATUSES.map((s) => ({ value: s, label: badgeLabel(s, "paymentStatus") }))} /></div>
          <div className="w-40"><SelectField label="For" value={kind} onChange={(v) => { setKind(v); reset(); }} placeholder="Any" options={[{ value: "BASE_FARE", label: "Base fare" }, { value: "SURCHARGE", label: "Surcharge" }]} /></div>
          <div className="w-40"><TextField label="From (IST)" type="date" value={from} onChange={(v) => { setFrom(v); reset(); }} /></div>
          <div className="w-40"><TextField label="To (IST)" type="date" value={to} onChange={(v) => { setTo(v); reset(); }} /></div>
          <CheckboxField label="Orphans only" checked={orphan} onChange={(v) => { setOrphan(v); reset(); }} />
        </div>
        <LastSynced at={q.syncedAt} onRefresh={q.reload} />
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Payment intents" rowKey={(p) => p.id} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No payments"
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage}
        columns={[
          { key: "id", label: "Intent", render: (p: PaymentIntent) => <span className="font-mono text-[11px]" title={p.id}>{shortId(p.id)}</span> },
          { key: "kind", label: "For", render: (p: PaymentIntent) => humanize(p.invoiceKind) },
          { key: "status", label: "Status", render: (p: PaymentIntent) => <StatusBadge status={p.status} kind="paymentStatus" /> },
          { key: "amount", label: "Amount", render: (p: PaymentIntent) => <span className="tabular-nums font-semibold">{formatPaise(p.amountPaise)}</span> },
          { key: "refunded", label: "Refunded", render: (p: PaymentIntent) => <span className="tabular-nums">{p.amountRefundedPaise ? formatPaise(p.amountRefundedPaise) : "—"}</span> },
          { key: "order", label: "Provider order", render: (p: PaymentIntent) => <span className="font-mono text-[11px]">{p.providerOrderId || "—"}</span> },
          { key: "shipment", label: "Shipment", render: (p: PaymentIntent) => (p.shipmentId ? (canShipment ? <Link className="font-mono text-[11px] text-blue-700 hover:underline" href={`/shipments/${p.shipmentId}`}>{shortId(p.shipmentId)}</Link> : shortId(p.shipmentId)) : "—") },
          { key: "created", label: "Created", render: (p: PaymentIntent) => <span className="text-[12px]">{formatIST(p.createdAt)}</span> },
          { key: "succeeded", label: "Succeeded", render: (p: PaymentIntent) => <span className="text-[12px]">{formatIST(p.succeededAt)}</span> },
          { key: "flags", label: "Notes", render: (p: PaymentIntent) => <span className="text-[11px]">{p.isOrphan ? <strong className="text-red-700">Orphan</strong> : ""} {p.failureMessage || p.failureCode || ""}</span> },
        ]} />
    </>
  );
}

/** P15 — payment intents (finance, admin; ops read). */
export default function FinancePaymentsPage() {
  return (
    <CorePage title="Payments" description="Payment intents with provider status, refunds and orphans (FR-FIN)" roles={PAGE_ROLES.financePayments}>
      <PaymentsBody />
    </CorePage>
  );
}
