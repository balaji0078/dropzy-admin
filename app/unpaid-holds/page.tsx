"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, LastSynced, SelectField, TextField } from "@/components/core/ui";
import { Deadline } from "@/components/core/domain";
import { coreAdmin, coreWarehouses } from "@/lib/core-api";
import type { UnpaidHoldRow, Warehouse } from "@/lib/core-types";
import { formatAgeHours, formatIST, formatPaise, humanize, shortId } from "@/lib/format";
import { PAGE_ROLES } from "@/lib/roles";
import { useCoreQuery } from "@/lib/use-core";

const LOCATIONS = [
  { label: "All", value: "ALL" }, { label: "At origin", value: "ORIGIN" }, { label: "In transit", value: "IN_TRANSIT" }, { label: "Warehouse", value: "WAREHOUSE" },
];

/** P6 — ACTIVE SURCHARGE_UNPAID holds with location, age, amount and exemption flag (30 s). */
function UnpaidHoldsBody() {
  const router = useRouter();
  const [location, setLocation] = useState("ALL");
  const [warehouseId, setWarehouseId] = useState("");
  const [minAge, setMinAge] = useState("");
  const [page, setPage] = useState(1);
  const wh = useCoreQuery<Warehouse[]>(() => coreWarehouses.list(), [], { silent: true });
  const whName = (id?: string | null) => (id ? wh.data?.find((w) => w.id === id)?.name || shortId(id) : "—");
  const minAgeHours = /^\d+$/.test(minAge) ? Number(minAge) : undefined;
  const q = useCoreQuery(() => coreAdmin.unpaidHolds({ location, warehouseId: warehouseId || undefined, minAgeHours, page, limit: 50 }), [location, warehouseId, minAgeHours, page], { pollMs: 30000 });

  const columns = [
    { key: "dcn", label: "DCN", render: (r: UnpaidHoldRow) => <Link href={`/shipments/${r.shipmentId}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-primary-light hover:text-gold hover:underline">{r.dcn || shortId(r.shipmentId)}</Link> },
    { key: "state", label: "State", render: (r: UnpaidHoldRow) => (r.state ? <StatusBadge status={r.state} kind="shipmentState" /> : "—") },
    { key: "location", label: "Location", render: (r: UnpaidHoldRow) => <span>{humanize(r.location)}{r.location === "WAREHOUSE" && <span className="block text-[11px] text-ink-soft">{whName(r.warehouseId)}</span>}</span> },
    { key: "amount", label: "Amount due", render: (r: UnpaidHoldRow) => <span className="font-semibold tabular-nums">{formatPaise(r.amountDuePaise)}</span> },
    { key: "age", label: "Age", render: (r: UnpaidHoldRow) => <span className={(r.ageHours || 0) >= 72 ? "text-danger font-semibold" : ""}>{formatAgeHours(r.ageHours)}<span className="block text-[11px] text-ink-soft">since {formatIST(r.placedAt)}</span></span> },
    { key: "cutoff", label: "Cutoff", render: (r: UnpaidHoldRow) => <Deadline at={r.cutoffAt} /> },
    { key: "exempt", label: "Load exemption", render: (r: UnpaidHoldRow) => (r.loadGateExempt ? <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-warning"><ShieldCheck className="w-3.5 h-3.5" aria-hidden />Exempt</span> : <span className="text-ink-faint">No</span>) },
    { key: "operator", label: "Operator", render: (r: UnpaidHoldRow) => r.operatorName || "—" },
    { key: "phone", label: "Customer", render: (r: UnpaidHoldRow) => <span className="font-mono text-[12px]">{r.customerPhoneMasked || "—"}</span> },
  ];

  return (
    <>
      <div className="flex justify-end -mt-2"><LastSynced at={q.syncedAt} onRefresh={q.reload} /></div>
      <div className="flex flex-wrap items-end gap-4">
        <FilterTabs ariaLabel="Location" tabs={LOCATIONS} activeTab={location} onChange={(v) => { setLocation(v); setPage(1); }} />
        <div className="w-56"><SelectField label="Warehouse" value={warehouseId} onChange={(v) => { setWarehouseId(v); setPage(1); }} placeholder="Any warehouse" options={(wh.data || []).map((w) => ({ value: w.id, label: w.name || w.code || w.id }))} /></div>
        <div className="w-40"><TextField label="Minimum age (hours)" value={minAge} onChange={(v) => { setMinAge(v.replace(/\D/g, "")); setPage(1); }} inputMode="numeric" /></div>
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Unpaid holds" rowKey={(r) => r.holdId} columns={columns} data={q.data?.data || []} loading={q.loading && !q.data} emptyMessage="No unpaid holds"
        rowClassName={(r) => ((r.ageHours || 0) >= 72 || (r.cutoffAt && new Date(r.cutoffAt).getTime() - Date.now() < 3600000) ? "dz-row-highlight" : undefined)}
        onRowClick={(r) => router.push(`/shipments/${r.shipmentId}`)} page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage} />
    </>
  );
}

export default function UnpaidHoldsPage() {
  return (
    <CorePage title="Unpaid Holds" description="Active unpaid-surcharge holds, oldest first (PRD §25)" roles={PAGE_ROLES.unpaidHolds}>
      <UnpaidHoldsBody />
    </CorePage>
  );
}
