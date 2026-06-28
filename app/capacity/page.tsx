"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { capacityAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import StatsCard from "@/components/ui/StatsCard";
import { Layers, Boxes, Percent } from "lucide-react";

const stateTabs = [
  { label: "All", value: "all" }, { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" }, { label: "Allocated", value: "allocated" }, { label: "Blocked", value: "blocked" },
];

export default function CapacityPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => { capacityAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); /* eslint-disable-next-line */ }, []);

  const reserve = async (c: any) => { await capacityAPI.reserve(token || "", c.id); setRows((r) => r.map((x) => (x.id === c.id ? { ...x, state: "reserved" } : x))); toast(`${c.vehicle} capacity reserved (15-min hold)`); };
  const allocate = async (c: any) => { await capacityAPI.allocate(token || "", c.id); setRows((r) => r.map((x) => (x.id === c.id ? { ...x, state: "allocated" } : x))); toast(`${c.vehicle} allocated`); };

  const filtered = rows.filter((c) => stateFilter === "all" || c.state === stateFilter);
  const totalCap = rows.reduce((a, c) => a + c.total_kg, 0);
  const totalAvail = rows.reduce((a, c) => a + (c.total_kg - c.booked_kg), 0);
  const columns = [
    { key: "operator", label: "Operator", render: (c: any) => (
      <div><p className="font-medium text-gray-900">{c.operator}</p><p className="text-xs text-gray-400">{c.vehicle}</p></div>) },
    { key: "route", label: "Route" },
    { key: "cap", label: "Capacity (kg)", render: (c: any) => (
      <div className="w-40"><div className="flex justify-between text-xs text-gray-500"><span>{c.booked_kg} booked</span><span>{c.total_kg - c.booked_kg} free</span></div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-100"><div className="h-2 rounded-full" style={{ width: `${(c.booked_kg / c.total_kg) * 100}%`, background: "#D82C2C" }} /></div></div>) },
    { key: "score", label: "Alloc. Score", render: (c: any) => <span className="font-medium text-gray-900">{c.score}</span> },
    { key: "state", label: "State", render: (c: any) => <StatusBadge status={c.state} /> },
    { key: "actions", label: "Operations", render: (c: any) => (
      <div className="flex items-center gap-2">
        {c.state === "available" && <button onClick={() => reserve(c)} className="text-[12px] font-semibold text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-md">Reserve</button>}
        {c.state === "reserved" && <button onClick={() => allocate(c)} className="text-[12px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md">Allocate</button>}
        {["allocated", "blocked", "consumed"].includes(c.state) && <span className="text-xs text-gray-400">—</span>}
      </div>) },
  ];
  return (
    <div className="space-y-5">
      <div><h1 className="text-[22px] font-bold text-gray-900">Capacity Exchange Marketplace</h1>
        <p className="text-[13px] text-gray-500">Reserve & allocate live capacity inventory (PRD Ch.37)</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Published Capacity" value={`${totalCap} kg`} icon={Boxes} />
        <StatsCard title="Available Now" value={`${totalAvail} kg`} icon={Layers} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatsCard title="Utilization" value={`${totalCap ? Math.round((1 - totalAvail / totalCap) * 100) : 0}%`} icon={Percent} />
      </div>
      <FilterTabs tabs={stateTabs} activeTab={stateFilter} onChange={setStateFilter} />
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No capacity slots found" />
    </div>
  );
}
