"use client";

import { CORE_API } from "@/lib/config";
import CoreShipmentsSearch from "@/components/core/pages/ShipmentsSearch";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { shipmentsAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import { Search, ChevronRight, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const FLOW = ["booking_confirmed", "parcel_received", "loaded_into_bus", "in_transit", "arrived_at_destination", "ready_for_collection", "delivered"];
const nextOf = (s: string) => { const i = FLOW.indexOf(s); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null; };
const statusTabs = [
  { label: "All", value: "all" }, { label: "Booking Confirmed", value: "booking_confirmed" },
  { label: "In Transit", value: "in_transit" }, { label: "Delivered", value: "delivered" }, { label: "Warehouse Hold", value: "warehouse_hold" },
];

function LegacyShipmentsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { shipmentsAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); /* eslint-disable-next-line */ }, []);

  const advance = async (s: any) => { const ns = nextOf(s.status); if (!ns) return;
    await shipmentsAPI.updateStatus(token || "", s.id, ns); setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status: ns } : x))); toast(`${s.dcn} → ${ns.replace(/_/g, " ")}`); };
  const cancel = async (s: any) => { await shipmentsAPI.cancel(token || "", s.id); setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status: "cancelled" } : x))); toast(`${s.dcn} cancelled`); };

  const filtered = rows.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return s.dcn.toLowerCase().includes(q) || s.route.toLowerCase().includes(q) || s.operator.toLowerCase().includes(q); }
    return true;
  });
  const columns = [
    { key: "dcn", label: "DCN", render: (s: any) => <span className="font-mono text-xs text-ink-soft">{s.dcn}</span> },
    { key: "route", label: "Route", render: (s: any) => <span className="text-ink">{s.route}</span> },
    { key: "operator", label: "Operator" },
    { key: "weight", label: "Weight", render: (s: any) => (
      <span className={s.actual_kg > s.declared_kg ? "text-danger font-medium" : "text-ink"}>{s.actual_kg}kg{s.actual_kg > s.declared_kg ? ` (decl ${s.declared_kg})` : ""}</span>) },
    { key: "fare", label: "Fare", render: (s: any) => formatCurrency(s.fare) },
    { key: "status", label: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
    { key: "actions", label: "Operations", render: (s: any) => {
      const ns = nextOf(s.status); const done = ["delivered", "cancelled"].includes(s.status);
      return (<div className="flex items-center gap-2">
        {ns && <button onClick={() => advance(s)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink hover:bg-surface-raised px-2 py-1 rounded-md"><ChevronRight className="w-3.5 h-3.5" />{ns.split("_")[0]}</button>}
        {!done && <button onClick={() => cancel(s)} className="inline-flex items-center gap-1 text-[12px] font-semibold text-danger hover:bg-danger/10 px-2 py-1 rounded-md"><XCircle className="w-3.5 h-3.5" />Cancel</button>}
        {done && <span className="text-xs text-ink-faint">—</span>}
      </div>); } },
  ];
  return (
    <div className="space-y-5">
      <div><h1 className="text-[22px] font-bold text-ink">Shipments</h1>
        <p className="text-[13px] text-ink-soft">DCN tracking, weight validation & custody operations (PRD Ch.15.8 / 27)</p></div>
      <div className="flex items-center justify-between gap-4">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search DCN / route…" className="pl-9 pr-3 py-2 rounded-lg border border-line text-[13px] focus:outline-none focus:border-gold" /></div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No shipments found" />
    </div>
  );
}

// NEXT_PUBLIC_CORE_API=true → P3 core shipment search (replaces the legacy mock list, CLIENT_CONTRACTS.md §4.1).
export default function ShipmentsPage() {
  return CORE_API ? <CoreShipmentsSearch /> : <LegacyShipmentsPage />;
}
