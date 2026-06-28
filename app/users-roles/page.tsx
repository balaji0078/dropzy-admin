"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { rolesAPI } from "@/lib/marketplace-api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { Plus, Ban, Check } from "lucide-react";

const roleTabs = [
  { label: "All", value: "all" }, { label: "Super Admin", value: "super_admin" },
  { label: "Operations", value: "operations_manager" }, { label: "Finance", value: "finance_manager" },
  { label: "Support", value: "support_agent" }, { label: "Operator", value: "operator_admin" },
];
const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", operations_manager: "Operations Manager",
  finance_manager: "Finance Manager", support_agent: "Support Agent", operator_admin: "Operator Admin",
};
const matrix = [
  ["Module", "Customer", "Driver", "Warehouse", "Support", "Finance", "Operator", "Super Admin"],
  ["Booking", "✓", "✗", "✗", "✗", "✗", "✗", "✓"],
  ["Tracking", "✓", "✓", "✓", "✓", "✗", "✓", "✓"],
  ["Warehouse", "✗", "✗", "✓", "✗", "✗", "✗", "✓"],
  ["Support", "✓", "✗", "✗", "✓", "✗", "✗", "✓"],
  ["Settlement", "✗", "✗", "✗", "✗", "✓", "✓", "✓"],
  ["Capacity", "✗", "✗", "✗", "✗", "✗", "✓", "✓"],
];
const emptyForm = { name: "", email: "", role: "support_agent" };

export default function UsersRolesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { rolesAPI.list(token || undefined).then((d) => { setRows(d); setLoading(false); }); /* eslint-disable-next-line */ }, []);

  const setStatus = async (u: any, status: string) => { await rolesAPI.setStatus(token || "", u.id, status); setRows((r) => r.map((x) => (x.id === u.id ? { ...x, status } : x))); toast(`${u.name} ${status === "active" ? "activated" : "suspended"}`); };

  const addUser = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast("Name and email are required", "error"); return; }
    const created = await rolesAPI.create(token || "", { name: form.name.trim(), email: form.email.trim(), role: form.role });
    setRows((r) => [created, ...r]); setShowCreate(false); setForm(emptyForm);
    toast(`${created.name} added as ${roleLabel[created.role] || created.role}`);
  };
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = rows.filter((u) => roleFilter === "all" || u.role === roleFilter);
  const columns = [
    { key: "name", label: "Name", render: (u: any) => (
      <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>) },
    { key: "role", label: "Role", render: (u: any) => <span className="text-gray-700">{roleLabel[u.role] || u.role}</span> },
    { key: "status", label: "Status", render: (u: any) => <StatusBadge status={u.status} /> },
    { key: "last_active", label: "Last Active" },
    { key: "actions", label: "Operations", render: (u: any) => (
      <div className="flex items-center gap-2">
        {u.status === "active" ? (
          <button onClick={() => setStatus(u, "suspended")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"><Ban className="w-3.5 h-3.5" />Suspend</button>
        ) : (
          <button onClick={() => setStatus(u, "active")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-md"><Check className="w-3.5 h-3.5" />Activate</button>
        )}
      </div>) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[22px] font-bold text-gray-900">Users & Roles</h1>
          <p className="text-[13px] text-gray-500">RBAC across the marketplace (PRD Ch.81)</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-semibold" style={{ background: "#D82C2C" }}><Plus className="w-4 h-4" /> Add User</button>
      </div>
      <FilterTabs tabs={roleTabs} activeTab={roleFilter} onChange={setRoleFilter} />
      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No users found" />
      <div className="rb-card-flat overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-[14px] font-bold text-gray-900">Permission Matrix (RBAC)</h3></div>
        <div className="overflow-x-auto p-5">
          <table className="min-w-full text-[13px]"><tbody>
            {matrix.map((row, i) => (
              <tr key={i} className={i === 0 ? "bg-gray-50 font-semibold text-gray-600" : "border-t border-gray-100"}>
                {row.map((cell, j) => (
                  <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium text-gray-900" : "text-center"} ${cell === "✓" ? "text-green-600" : cell === "✗" ? "text-red-400" : ""}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add User">
        <div className="space-y-4">
          <div><label className="block text-[12px] font-semibold text-gray-600 mb-1">Full Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Doe" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]" /></div>
          <div><label className="block text-[12px] font-semibold text-gray-600 mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@dropzy.in" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]" /></div>
          <div><label className="block text-[12px] font-semibold text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#D82C2C]">
              {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={addUser} className="px-4 py-2 rounded-lg text-white text-[13px] font-semibold" style={{ background: "#D82C2C" }}>Add User</button>
        </div>
      </Modal>
    </div>
  );
}
