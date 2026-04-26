"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { driversAPI } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { Search, MapPin, Star, Shield, ShieldOff } from "lucide-react";
import { getInitials } from "@/lib/utils";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "On Duty", value: "on_duty" },
  { label: "Unavailable", value: "unavailable" },
];

export default function DriversPage() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    // Fetch nearby drivers with a wide radius to get all
    driversAPI
      .getNearby(token, 13.0827, 80.2707, 500, 100)
      .then((res) => setDrivers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    let result = drivers;
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.vehicle_plate?.toLowerCase().includes(q) ||
          d.vehicle_type?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [drivers, statusFilter, search]);

  const columns = [
    {
      key: "driver",
      label: "Driver",
      render: (d: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold text-white" style={{ backgroundColor: "#007AFF" }}>
            {getInitials("D", d.id?.substring(0, 1) || "R")}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-[13px]">Driver #{d.id?.substring(0, 6)}</p>
            <p className="text-[11px] text-gray-500">{d.is_verified ? "Verified" : "Unverified"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (d: any) => (
        <div>
          <p className="font-medium capitalize text-[13px]">{d.vehicle_type}</p>
          <p className="text-[11px] text-gray-500">{d.vehicle_plate}</p>
        </div>
      ),
    },
    {
      key: "vehicle_model",
      label: "Model",
      render: (d: any) => <span className="text-gray-600 text-[13px]">{d.vehicle_model || "—"}</span>,
    },
    {
      key: "location",
      label: "Location",
      render: (d: any) => (
        <div className="flex items-center gap-1 text-gray-500 text-[11px]">
          <MapPin className="w-3 h-3" />
          {d.current_lat?.toFixed(4)}, {d.current_lng?.toFixed(4)}
        </div>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (d: any) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium text-[13px]">{d.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-400 text-[11px]">({d.total_ratings || 0})</span>
        </div>
      ),
    },
    {
      key: "total_deliveries",
      label: "Deliveries",
      render: (d: any) => <span className="font-semibold text-[13px]">{d.total_deliveries || 0}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (d: any) => <StatusBadge status={d.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">All Drivers</h2>
          <p className="section-subtitle">{drivers.length} registered drivers</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search plate, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="apple-input pl-10 pr-4 py-2 w-64 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={setSelected}
        emptyMessage="No drivers found. Drivers will appear here after registration."
      />

      {/* Driver Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Driver Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">Driver ID</p>
                <p className="text-[13px] font-mono mt-2">{selected.id}</p>
              </div>
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">Status</p>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
              </div>
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">Vehicle</p>
                <p className="text-[13px] mt-2 capitalize">
                  {selected.vehicle_type} — {selected.vehicle_plate}
                </p>
              </div>
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">License</p>
                <p className="text-[13px] mt-2">{selected.license_number}</p>
              </div>
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">Rating</p>
                <p className="text-[13px] mt-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {selected.rating?.toFixed(1)} ({selected.total_ratings} reviews)
                </p>
              </div>
              <div className="glass-card-static p-3 rounded-xl">
                <p className="text-[11px] text-gray-500 uppercase font-medium tracking-tight">Total Deliveries</p>
                <p className="text-[13px] font-semibold mt-2">{selected.total_deliveries}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {!selected.is_verified && (
                <button className="apple-btn apple-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium" style={{ backgroundColor: "#34C759" }}>
                  <Shield className="w-4 h-4" /> Verify Driver
                </button>
              )}
              <button className="apple-btn apple-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium" style={{ color: "#FF3B30", backgroundColor: "rgba(255, 59, 48, 0.1)" }}>
                <ShieldOff className="w-4 h-4" /> Suspend Driver
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
