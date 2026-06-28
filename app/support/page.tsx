"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { supportAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import { Search } from "lucide-react";

const statusTabs = [
  { label: "All", value: "all" }, { label: "Open", value: "open" }, { label: "Assigned", value: "assigned" },
  { label: "Investigating", value: "investigating" }, { label: "Resolved", value: "resolved" },
];

export default function SupportPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => { supportAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); /* eslint-disable-next-line */ }, []);

  const assign = async (t: any) => { await supportAPI.setStatus(token || "", t.id, "assigned", "You"); setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "assigned", assignee: "You" } : x))); toast(`${t.id} assigned to you`); };
  const resolve = async (t: any) => { await supportAPI.setStatus(token || "", t.id, "resolved"); setRows((r) => r.map((x) => (x.id === t.id ? { ...x, status: "resolved" } : x))); toast(`${t.id} resolved`); };

  const filtered = rows.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return t.id.toLowerCase().includes(q) || t.dcn.toLowerCase().includes(q) || t.category.toLowerCase().includes(q); }
    return true;
  });
  const columns = [
    { key: "id", label: "Ticket", render: (t: any) => <span className="font-mono text-xs text-gray-700">{t.id}</span> },
    { key: "dcn", label: "DCN", render: (t: any) => <span className="font-mono text-xs text-gray-400">{t.dcn}</span> },
    { key: "category", label: "Category" },
    { key: "priority", label: "Priority", render: (t: any) => <StatusBadge status={t.priority} /> },
    { key: "assignee", label: "Assignee" },
    { key: "status", label: "Status", render: (t: any) => <StatusBadge status={t.status} /> },
    { key: "actions", label: "Operations", render: (t: any) => {
      const closed = ["resolved", "closed"].includes(t.status);
      return (<div className="flex items-center gap-2">
        {t.status === "open" && <button onClick={() => assign(t)} className="text-[12px] font-semibold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-md">Assign to me</button>}
        {!closed && <button onClick={() => resolve(t)} className="text-[12px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-md">Resolve</button>}
        {closed && <span className="text-xs text-gray-400">—</span>}
      </div>); } },
  ];
  return (
    <div className="space-y-5">
      <div><h1 className="text-[22px] font-bold text-gray-900">Support Center</h1>
        <p className="text-[13px] text-gray-500">Assign, investigate & resolve tickets (PRD Ch.15.11)</p></div>
      <div className="flex items-center justify-between gap-4">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets…" className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]" /></div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No tickets found" />
    </div>
  );
}
