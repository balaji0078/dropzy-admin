"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { operatorsAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { Search, Plus, Star, Check, Ban } from "lucide-react";

const statusTabs = [
  { label: "All", value: "all" }, { label: "Approved", value: "approved" },
  { label: "KYC Review", value: "kyc_review" }, { label: "Pending", value: "pending" }, { label: "Suspended", value: "suspended" },
];
const emptyForm = { name: "", gst_number: "", city: "", mobile: "", email: "", buses: "", routes: "" };

export default function OperatorsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => { setLoading(true); operatorsAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setStatus = async (id: string, status: string, verb: string) => {
    const op = rows.find((o) => o.id === id);
    await operatorsAPI.setStatus(token || "", id, status);
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status } : o)));
    toast(`${op?.name || "Operator"} ${verb}`);
  };

  const onboard = async () => {
    if (!form.name.trim()) { toast("Operator name is required", "error"); return; }
    const created = await operatorsAPI.create(token || "", {
      name: form.name.trim(), gst_number: form.gst_number.trim() || "—", city: form.city.trim() || "—",
      buses: Number(form.buses) || 0, routes: Number(form.routes) || 0,
    });
    setRows((r) => [created, ...r]);
    setShowCreate(false); setForm(emptyForm);
    toast(`${created.name} onboarded — pending KYC`);
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const filtered = rows.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) { const q = search.toLowerCase(); return o.name.toLowerCase().includes(q) || o.city.toLowerCase().includes(q) || (o.gst_number || "").toLowerCase().includes(q); }
    return true;
  });

  const columns = [
    { key: "name", label: "Operator", render: (o: any) => (
      <div><p className="font-medium text-gray-900">{o.name}</p><p className="text-xs text-gray-400">{o.city} · {o.gst_number}</p></div>) },
    { key: "fleet", label: "Fleet / Routes", render: (o: any) => <span className="text-gray-700">{o.buses} buses · {o.routes} routes</span> },
    { key: "rating", label: "Rating", render: (o: any) => o.rating ? (
      <span className="inline-flex items-center gap-1 text-gray-700"><Star className="w-3.5 h-3.5 text-amber-500" />{o.rating}</span>) : <span className="text-gray-400">—</span> },
    { key: "status", label: "Status", render: (o: any) => <StatusBadge status={o.status} /> },
    { key: "actions", label: "Operations", render: (o: any) => (
      <div className="flex items-center gap-2">
        {(o.status === "pending" || o.status === "kyc_review") && (
          <button onClick={() => setStatus(o.id, "approved", "approved — marketplace live")}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-md"><Check className="w-3.5 h-3.5" />Approve</button>)}
        {o.status === "approved" && (
          <button onClick={() => setStatus(o.id, "suspended", "suspended")}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"><Ban className="w-3.5 h-3.5" />Suspend</button>)}
        {o.status === "suspended" && (
          <button onClick={() => setStatus(o.id, "approved", "re-approved")}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-md"><Check className="w-3.5 h-3.5" />Re-approve</button>)}
      </div>) },
  ];

  const field = (label: string, key: string, type = "text", placeholder = "") => (
    <div>
      <label className="block text-[12px] font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-gray-900">Operators</h1>
          <p className="text-[13px] text-gray-500">Onboarding, KYC & marketplace status (PRD Ch.21)</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-semibold" style={{ background: "#D82C2C" }}><Plus className="w-4 h-4" /> Onboard Operator</button>
      </div>
      <div className="flex items-center justify-between gap-4">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search operators…" className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]" /></div>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No operators found" />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard Operator">
        <div className="grid grid-cols-2 gap-4">
          {field("Company Name *", "name", "text", "Easyride")}
          {field("GST Number", "gst_number", "text", "33AABCE1234F1Z5")}
          {field("City", "city", "text", "Chennai")}
          {field("Mobile", "mobile", "tel", "+91 90000 00000")}
          {field("Email", "email", "email", "ops@operator.in")}
          {field("Buses", "buses", "number", "0")}
          {field("Routes", "routes", "number", "0")}
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onboard} className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold" style={{ background: "#D82C2C" }}>Onboard Operator</button>
        </div>
      </Modal>
    </div>
  );
}
