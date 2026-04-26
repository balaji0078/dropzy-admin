"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Search, Mail, Phone, MapPin, Package, CreditCard, Star } from "lucide-react";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Verified", value: "verified" },
  { label: "Unverified", value: "unverified" },
];

// Sample data — these come from GET /api/v1/users in production
const sampleCustomers = [
  { id: "u1", first_name: "John", last_name: "Doe", email: "john@example.com", phone: "+919876543210", city: "Chennai", is_active: true, is_verified: true, total_orders: 12, total_spent: 5400, created_at: "2026-01-15T10:00:00Z" },
  { id: "u2", first_name: "Priya", last_name: "Sharma", email: "priya@example.com", phone: "+919876543211", city: "Mumbai", is_active: true, is_verified: true, total_orders: 8, total_spent: 3200, created_at: "2026-02-20T14:00:00Z" },
  { id: "u3", first_name: "Ravi", last_name: "Kumar", email: "ravi@example.com", phone: "+919876543212", city: "Bangalore", is_active: true, is_verified: false, total_orders: 3, total_spent: 950, created_at: "2026-03-10T09:00:00Z" },
  { id: "u4", first_name: "Anita", last_name: "Patel", email: "anita@example.com", phone: "+919876543213", city: "Delhi", is_active: false, is_verified: true, total_orders: 0, total_spent: 0, created_at: "2026-03-28T16:00:00Z" },
];

export default function CustomersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("orders");

  const filtered = sampleCustomers.filter((c) => {
    if (statusFilter === "active" && !c.is_active) return false;
    if (statusFilter === "inactive" && c.is_active) return false;
    if (statusFilter === "verified" && !c.is_verified) return false;
    if (statusFilter === "unverified" && c.is_verified) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns = [
    {
      key: "name",
      label: "Customer",
      render: (c: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D82C2C]/10 text-[#D82C2C] rounded-full flex items-center justify-center text-sm font-semibold">
            {getInitials(c.first_name, c.last_name)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{c.first_name} {c.last_name}</p>
            <p className="text-xs text-gray-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (c: any) => <span className="text-gray-600">{c.phone}</span>,
    },
    {
      key: "city",
      label: "City",
      render: (c: any) => (
        <span className="flex items-center gap-1 text-gray-600">
          <MapPin className="w-3 h-3" /> {c.city}
        </span>
      ),
    },
    {
      key: "total_orders",
      label: "Orders",
      render: (c: any) => <span className="font-semibold">{c.total_orders}</span>,
    },
    {
      key: "total_spent",
      label: "Total Spent",
      render: (c: any) => <span className="font-semibold">{formatCurrency(c.total_spent)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c: any) => <StatusBadge status={c.is_active ? "active" : "inactive"} />,
    },
    {
      key: "created_at",
      label: "Joined",
      render: (c: any) => <span className="text-gray-500 text-xs">{formatDate(c.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[16px] font-bold text-gray-900">All Customers</h2>
        <p className="text-[13px] text-gray-500">{sampleCustomers.length} registered customers</p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search name, email, city..." value={search} onChange={(e) => setSearch(e.target.value)} className="rb-input pl-10 pr-4 py-2 w-64" />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={setSelected} emptyMessage="No customers found." />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#D82C2C]/10 text-[#D82C2C] rounded-full flex items-center justify-center text-xl font-bold">
                {getInitials(selected.first_name, selected.last_name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selected.first_name} {selected.last_name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selected.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selected.phone}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              {["orders", "payments", "reviews"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-[#D82C2C] text-[#D82C2C]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "orders" && <Package className="w-4 h-4 inline mr-1.5" />}
                  {tab === "payments" && <CreditCard className="w-4 h-4 inline mr-1.5" />}
                  {tab === "reviews" && <Star className="w-4 h-4 inline mr-1.5" />}
                  {tab} History
                </button>
              ))}
            </div>

            <div className="min-h-[120px] flex items-center justify-center text-sm text-gray-400">
              {activeTab === "orders" && `${selected.total_orders} orders — connect API to load details`}
              {activeTab === "payments" && `${formatCurrency(selected.total_spent)} total spent — connect API to load details`}
              {activeTab === "reviews" && "Reviews will load from GET /api/v1/reviews/users/:id"}
            </div>

            <div className="pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <button className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100">
                Deactivate Account
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
