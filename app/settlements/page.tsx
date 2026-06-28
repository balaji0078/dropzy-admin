"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { settlementsAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const statusTabs = [
  { label: "All", value: "all" }, { label: "Generated", value: "generated" },
  { label: "Approved", value: "approved" }, { label: "Paid", value: "paid" },
];

export default function SettlementsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { settlementsAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); /* eslint-disable-next-line */ }, []);

  const approve = async (s: any) => { await settlementsAPI.approve(token || "", s.id); setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status: "approved" } : x))); toast(`${s.operator} settlement approved`); };
  const release = async (s: any) => { await settlementsAPI.release(token || "", s.id); setRows((r) => r.map((x) => (x.id === s.id ? { ...x, status: "paid" } : x))); toast(`Payout released to ${s.operator}`); };

  const exportCsv = () => {
    const header = "Operator,Period,Revenue,Commission,Gateway Fee,Payout,Status";
    const lines = rows.map((s) => [s.operator, s.period, s.revenue, s.commission, s.gateway_fee, s.payout, s.status].join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "settlements.csv"; a.click(); URL.revokeObjectURL(url);
    toast("Settlements exported");
  };

  const filtered = rows.filter((s) => statusFilter === "all" || s.status === statusFilter);
  const columns = [
    { key: "operator", label: "Operator", render: (s: any) => (
      <div><p className="font-medium text-gray-900">{s.operator}</p><p className="text-xs text-gray-400">{s.period}</p></div>) },
    { key: "revenue", label: "Revenue", render: (s: any) => formatCurrency(s.revenue) },
    { key: "commission", label: "Commission", render: (s: any) => formatCurrency(s.commission) },
    { key: "payout", label: "Payout", render: (s: any) => <span className="font-semibold text-gray-900">{formatCurrency(s.payout)}</span> },
    { key: "status", label: "Status", render: (s: any) => <StatusBadge status={s.status} /> },
    { key: "actions", label: "Operations", render: (s: any) => (
      <div className="flex items-center gap-2">
        {s.status === "generated" && <button onClick={() => approve(s)} className="text-[12px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-md">Approve</button>}
        {s.status === "approved" && <button onClick={() => release(s)} className="text-[12px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md">Release payout</button>}
        {s.status === "paid" && <span className="text-[12px] font-semibold text-green-600">Settled</span>}
      </div>) },
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-gray-900">Settlements</h1>
          <p className="text-[13px] text-gray-500">Approve & release weekly operator payouts (PRD Ch.51)</p></div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"><Download className="w-4 h-4" /> Export CSV</button>
      </div>
      <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No settlements found" />
    </div>
  );
}
