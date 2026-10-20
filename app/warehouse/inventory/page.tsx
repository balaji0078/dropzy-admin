"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import StatusBadge from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, LastSynced, ReasonDialog, SelectField, TextField, rowAction } from "@/components/core/ui";
import { WarehousePicker, useWarehouseSelection } from "@/components/core/warehouse";
import { coreShipments, coreWarehouses } from "@/lib/core-api";
import type { InventoryItem } from "@/lib/core-types";
import { formatAgeHours, formatIST, formatPaise, humanize } from "@/lib/format";
import { PAGE_ROLES, WRITE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction, useCoreQuery } from "@/lib/use-core";

const STATUS_TABS = [{ label: "In stock", value: "ACTIVE" }, { label: "Released", value: "RELEASED" }, { label: "Returned", value: "RETURNED" }, { label: "All", value: "ALL" }];
const STATES = [
  { value: "WAREHOUSE_HOLD_UNPAID", label: "Held — unpaid" }, { value: "WAREHOUSE_HELD_OTHER", label: "Held — other" }, { value: "READY_FOR_PICKUP", label: "Ready for pickup" },
];

function InventoryBody() {
  const { roles } = useAuth();
  const sel = useWarehouseSelection();
  const { run, busy } = useAction();
  const [status, setStatus] = useState("ACTIVE");
  const [state, setState] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [relocating, setRelocating] = useState<InventoryItem | null>(null);
  const [toBin, setToBin] = useState("");
  const canRelocate = hasAnyRole(roles, WRITE_ROLES.relocate);
  const canRelease = hasAnyRole(roles, PAGE_ROLES.warehouseRelease);
  const canDetail = hasAnyRole(roles, PAGE_ROLES.shipments);

  const q = useCoreQuery(
    () => (sel.selected ? coreWarehouses.inventory(sel.selected, { status, state: state || undefined, q: search.trim() || undefined, page, limit: 50 }) : Promise.resolve({ data: [] as InventoryItem[], meta: undefined })),
    [sel.selected, status, state, search, page],
    { pollMs: 30000 },
  );

  const relocate = async (reason: string) => {
    if (!relocating || !sel.selected) return;
    const r = await run(() => coreShipments.relocate(relocating.shipmentId, { warehouseId: sel.selected, toBinCode: toBin.trim(), ...(reason ? { reason } : {}) }), {
      success: `${relocating.dcn} moved to bin ${toBin.trim()}`,
    });
    if (r) {
      setRelocating(null);
      q.reload();
    }
  };

  const columns = [
    { key: "dcn", label: "DCN", render: (i: InventoryItem) => (canDetail ? <Link href={`/shipments/${i.shipmentId}`} className="font-mono text-xs text-primary-light hover:text-gold hover:underline">{i.dcn}</Link> : <span className="font-mono text-xs">{i.dcn}</span>) },
    { key: "state", label: "State", render: (i: InventoryItem) => (i.shipmentState ? <StatusBadge status={i.shipmentState} kind="shipmentState" /> : "—") },
    { key: "hold", label: "Hold reason", render: (i: InventoryItem) => (
      <div className="flex flex-col gap-1 items-start"><span className="text-[12px]">{humanize(i.holdReason)}</span>
        <span className="flex flex-wrap gap-1">{(i.activeHoldTypes || []).map((h) => <StatusBadge key={h} status={h} kind="hold" />)}</span></div>) },
    { key: "due", label: "Amount due", render: (i: InventoryItem) => <span className="tabular-nums font-semibold">{i.amountDuePaise ? formatPaise(i.amountDuePaise) : "—"}</span> },
    { key: "bin", label: "Bin", render: (i: InventoryItem) => <span className="font-mono">{i.binCode || "—"}</span> },
    { key: "received", label: "Received", render: (i: InventoryItem) => <span className="text-[12px]">{formatIST(i.receivedAt)}</span> },
    { key: "age", label: "Age", render: (i: InventoryItem) => (
      i.overMaxHold
        ? <span className="inline-flex items-center gap-1 font-semibold text-danger"><AlertTriangle className="w-3.5 h-3.5" aria-hidden />{formatAgeHours(i.ageHours)} · over max hold</span>
        : <span>{formatAgeHours(i.ageHours)}</span>) },
    { key: "cond", label: "Condition", render: (i: InventoryItem) => humanize(i.condition) },
    { key: "ops", label: "Operations", render: (i: InventoryItem) => (
      <div className="flex items-center gap-1">
        {canRelocate && i.status === "ACTIVE" && <button className={rowAction("indigo")} onClick={() => { setRelocating(i); setToBin(""); }}>Relocate</button>}
        {canRelease && i.status === "ACTIVE" && <Link className={rowAction("green")} href={`/warehouse/release/${i.shipmentId}`}>{i.shipmentState === "RETURN_IN_PROGRESS" ? "Return" : "Release"}</Link>}
        {i.status !== "ACTIVE" && <span className="text-[12px] text-ink-soft">{i.collectorName ? `To ${i.collectorName}` : "—"} {formatIST(i.releasedAt)}</span>}
      </div>) },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 -mt-2">
        <WarehousePicker sel={sel} />
        <LastSynced at={q.syncedAt} onRefresh={q.reload} />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <FilterTabs ariaLabel="Inventory status" tabs={STATUS_TABS} activeTab={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        <div className="w-52"><SelectField label="Shipment state" value={state} onChange={(v) => { setState(v); setPage(1); }} placeholder="Any state" options={STATES} /></div>
        <div className="w-56"><TextField label="DCN prefix or bin" value={search} onChange={(v) => { setSearch(v); setPage(1); }} /></div>
      </div>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      <DataTable caption="Warehouse inventory (oldest first)" rowKey={(i) => i.id || i.shipmentId} columns={columns} data={q.data?.data || []} loading={(q.loading && !q.data) || sel.loading}
        rowClassName={(i) => (i.overMaxHold ? "dz-row-highlight" : undefined)} emptyMessage="No parcels in this view"
        page={q.data?.meta?.page || page} totalPages={q.data?.meta?.totalPages || 1} onPageChange={setPage} />
      <ReasonDialog open={!!relocating} title="Relocate parcel" busy={busy} onClose={() => setRelocating(null)} confirmLabel="Move parcel" requireReason={false}
        canConfirm={!!toBin.trim()} summary={<>Move <strong>{relocating?.dcn}</strong> from bin <strong>{relocating?.binCode}</strong>. The move is audited; the parcel state does not change.</>}
        onConfirm={() => relocate("")}>
        <TextField label="New bin code" value={toBin} onChange={(v) => setToBin(v.toUpperCase())} required maxLength={32} />
      </ReasonDialog>
    </>
  );
}

/** P8 — warehouse inventory with age (red when over max hold) and relocation (30 s). */
export default function WarehouseInventoryPage() {
  return (
    <CorePage title="Warehouse Inventory" description="Held parcels with hold reason, amount due, bin and age (FR-WH-002)" roles={PAGE_ROLES.warehouseInventory}>
      <InventoryBody />
    </CorePage>
  );
}
