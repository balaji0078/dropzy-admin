"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Warehouse } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge, { badgeLabel } from "@/components/ui/StatusBadge";
import { CorePage, ErrorBanner, SelectField, TextField, btnOutline, btnPrimary } from "@/components/core/ui";
import { Deadline } from "@/components/core/domain";
import { coreAdmin } from "@/lib/core-api";
import { HOLD_TYPES, SHIPMENT_STATES, type AdminShipmentRow, type Operator, type PageMeta, type Route } from "@/lib/core-types";
import { formatIST, formatKg, formatPaise, istDayBoundaryISO } from "@/lib/format";
import { PAGE_ROLES, hasAnyRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useAction } from "@/lib/use-core";

const empty = { dcn: "", bookingId: "", customerPhone: "", routeId: "", tripId: "", operatorId: "", state: "", holdType: "", createdFrom: "", createdTo: "" };
type Filters = typeof empty;

/** P3 — search shipments (GET /admin/shipments, manual refresh); rows link to P4. */
function ShipmentsSearchBody() {
  const router = useRouter();
  const { roles } = useAuth();
  const { run, busy } = useAction();
  const [f, setF] = useState<Filters>(empty);
  const [rows, setRows] = useState<AdminShipmentRow[]>([]);
  const [meta, setMeta] = useState<PageMeta | undefined>();
  const [page, setPage] = useState(1);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [operators, setOperators] = useState<Operator[] | null>(null);
  const canRoutes = hasAnyRole(roles, ["ops_manager", "admin"]);
  const canOperators = hasAnyRole(roles, ["ops_manager", "finance", "admin"]);

  useEffect(() => {
    if (canRoutes) coreAdmin.routes().then(setRoutes).catch(() => setRoutes(null));
    if (canOperators) coreAdmin.operators().then(setOperators).catch(() => setOperators(null));
  }, [canRoutes, canOperators]);

  const search = async (filters: Filters, p = 1) => {
    setError(null);
    const r = await run(
      () =>
        coreAdmin.searchShipments({
          ...filters,
          customerPhone: filters.customerPhone.replace(/\s/g, ""),
          dcn: filters.dcn.trim().toUpperCase(),
          createdFrom: filters.createdFrom ? istDayBoundaryISO(filters.createdFrom) : undefined,
          createdTo: filters.createdTo ? istDayBoundaryISO(filters.createdTo, true) : undefined,
          page: p,
          limit: 20,
        }),
      { onError: (e) => { setError(e); return false; } },
    );
    setSearched(true);
    if (r) {
      setRows(r.data);
      setMeta(r.meta);
      setPage(p);
    }
  };

  // Initial filters from the URL (TopBar DCN search, dashboard state links); otherwise list the latest shipments.
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const init = { ...empty, dcn: qs.get("dcn") || "", state: qs.get("state") || "", holdType: qs.get("holdType") || "" };
    setF(init);
    search(init, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k: keyof Filters) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const columns = [
    { key: "dcn", label: "DCN", render: (s: AdminShipmentRow) => (
      <Link href={`/shipments/${s.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-xs text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded">
        {s.dcn || "(not booked)"}
      </Link>) },
    { key: "state", label: "State", render: (s: AdminShipmentRow) => (s.state ? <StatusBadge status={s.state} kind="shipmentState" /> : "—") },
    { key: "route", label: "Route / operator", render: (s: AdminShipmentRow) => (
      <div><p className="text-gray-900">{s.routeName || "—"}</p><p className="text-xs text-gray-500">{s.operatorName || ""}</p></div>) },
    { key: "departure", label: "Departure", render: (s: AdminShipmentRow) => <span className="text-[12px]">{formatIST(s.plannedDepartureAt)}</span> },
    { key: "cutoff", label: "Cutoff", render: (s: AdminShipmentRow) => <Deadline at={s.cutoffAt} /> },
    { key: "weight", label: "Declared / actual", render: (s: AdminShipmentRow) => (
      <span className="text-[12px] tabular-nums">{formatKg(s.declaredWeightGrams)} / {s.latestActualWeightGrams ? formatKg(s.latestActualWeightGrams) : "—"}</span>) },
    { key: "label", label: "Payment", render: (s: AdminShipmentRow) => (s.driverLabel ? <StatusBadge status={s.driverLabel} kind="driverLabel" /> : "—") },
    { key: "due", label: "Amount due", render: (s: AdminShipmentRow) => <span className="tabular-nums">{s.amountDuePaise ? formatPaise(s.amountDuePaise) : "—"}</span> },
    { key: "holds", label: "Holds", render: (s: AdminShipmentRow) => (
      <div className="flex flex-wrap gap-1">
        {(s.activeHoldTypes || []).map((h) => <StatusBadge key={h} status={h} kind="hold" />)}
        {s.warehouseRequired && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700"><Warehouse className="w-3 h-3" aria-hidden />Warehouse</span>}
        {!s.activeHoldTypes?.length && !s.warehouseRequired && <span className="text-gray-400">—</span>}
      </div>) },
    { key: "phone", label: "Customer", render: (s: AdminShipmentRow) => <span className="text-[12px] font-mono">{s.customerPhoneMasked || "—"}</span> },
  ];

  return (
    <>
      <form
        className="rb-card-flat p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          search(f, 1);
        }}
        aria-label="Shipment search"
      >
        <TextField label="DCN (exact or prefix)" value={f.dcn} onChange={set("dcn")} placeholder="DCN-MAA-BLR-…" />
        <TextField label="Booking ID" value={f.bookingId} onChange={set("bookingId")} placeholder="UUID" />
        <TextField label="Customer phone" value={f.customerPhone} onChange={set("customerPhone")} inputMode="tel" placeholder="10-digit or +91…" />
        {routes ? (
          <SelectField label="Route" value={f.routeId} onChange={set("routeId")} placeholder="Any route" options={routes.map((r) => ({ value: r.id, label: r.name || r.code || r.id }))} />
        ) : (
          <TextField label="Route ID" value={f.routeId} onChange={set("routeId")} placeholder="UUID" />
        )}
        <TextField label="Trip ID" value={f.tripId} onChange={set("tripId")} placeholder="UUID" />
        {operators ? (
          <SelectField label="Operator" value={f.operatorId} onChange={set("operatorId")} placeholder="Any operator" options={operators.map((o) => ({ value: o.id, label: o.displayName || o.legalName || o.code || o.id }))} />
        ) : (
          <TextField label="Operator ID" value={f.operatorId} onChange={set("operatorId")} placeholder="UUID" />
        )}
        <SelectField label="State" value={f.state} onChange={set("state")} placeholder="Any state" options={SHIPMENT_STATES.map((s) => ({ value: s, label: badgeLabel(s, "shipmentState") }))} />
        <SelectField label="Active hold" value={f.holdType} onChange={set("holdType")} placeholder="Any" options={HOLD_TYPES.map((h) => ({ value: h, label: badgeLabel(h, "hold") }))} />
        <TextField label="Created from (IST)" type="date" value={f.createdFrom} onChange={set("createdFrom")} />
        <TextField label="Created to (IST)" type="date" value={f.createdTo} onChange={set("createdTo")} />
        <div className="flex gap-2 lg:col-span-5 justify-end">
          <button type="button" className={btnOutline} onClick={() => { setF(empty); search(empty, 1); }}><X className="w-4 h-4" aria-hidden />Clear</button>
          <button type="submit" className={btnPrimary} disabled={busy}><Search className="w-4 h-4" aria-hidden />{busy ? "Searching…" : "Search"}</button>
        </div>
      </form>
      <ErrorBanner error={error} onRetry={() => search(f, page)} />
      <DataTable
        caption="Shipment search results"
        columns={columns}
        data={rows}
        loading={busy && !searched}
        emptyMessage={searched ? "No shipments match these filters" : "Searching…"}
        onRowClick={(s) => router.push(`/shipments/${s.id}`)}
        page={meta?.page || page}
        totalPages={meta?.totalPages || 1}
        onPageChange={(p) => search(f, p)}
      />
      {meta && <p className="text-[12px] text-gray-500">{meta.total} shipment{meta.total === 1 ? "" : "s"}</p>}
    </>
  );
}

export default function CoreShipmentsSearch() {
  return (
    <CorePage title="Shipments" description="Search by DCN, booking, customer phone, route, trip, operator, state or hold (FR-ADM-001)" roles={PAGE_ROLES.shipments}>
      <ShipmentsSearchBody />
    </CorePage>
  );
}
