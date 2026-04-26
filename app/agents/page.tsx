"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Users,
  Phone,
  MapPin,
  Star,
  Clock,
  Search,
  Wifi,
  WifiOff,
  Package,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Mock agent data
const mockAgents = [
  { id: 1, name: "Rajesh Kumar", phone: "+91-98765-43210", email: "rajesh.kumar@dropzy.in", hub: "Hyderabad Ameerpet", status: "active", parcels_today: 12, rating: 4.8, last_active: "2026-04-26T14:32:00", rfid_status: true, parcels_week: 58, parcels_month: 187, avg_handling_time: 8, recent_activity: [{ time: "2026-04-26T14:32:00", action: "Scanned parcel", parcel_id: "DZ-987654", status: "delivered" }, { time: "2026-04-26T14:15:00", action: "Received parcel", parcel_id: "DZ-987653", status: "in_transit" }, { time: "2026-04-26T13:45:00", action: "Delivered parcel", parcel_id: "DZ-987652", status: "delivered" }] },
  { id: 2, name: "Priya Sharma", phone: "+91-97654-32109", email: "priya.sharma@dropzy.in", hub: "Mumbai Andheri", status: "active", parcels_today: 18, rating: 4.9, last_active: "2026-04-26T14:45:00", rfid_status: true, parcels_week: 72, parcels_month: 228, avg_handling_time: 10, recent_activity: [{ time: "2026-04-26T14:45:00", action: "Scanned parcel", parcel_id: "DZ-987651", status: "in_transit" }, { time: "2026-04-26T14:20:00", action: "Received parcel", parcel_id: "DZ-987650", status: "pending" }, { time: "2026-04-26T13:30:00", action: "Delivered parcel", parcel_id: "DZ-987649", status: "delivered" }] },
  { id: 3, name: "Amit Patel", phone: "+91-96543-21098", email: "amit.patel@dropzy.in", hub: "Delhi Karol Bagh", status: "active", parcels_today: 14, rating: 4.6, last_active: "2026-04-26T14:50:00", rfid_status: true, parcels_week: 65, parcels_month: 201, avg_handling_time: 11, recent_activity: [{ time: "2026-04-26T14:50:00", action: "Delivered parcel", parcel_id: "DZ-987648", status: "delivered" }, { time: "2026-04-26T14:10:00", action: "Scanned parcel", parcel_id: "DZ-987647", status: "in_transit" }, { time: "2026-04-26T13:20:00", action: "Received parcel", parcel_id: "DZ-987646", status: "pending" }] },
  { id: 4, name: "Neha Gupta", phone: "+91-95432-10987", email: "neha.gupta@dropzy.in", hub: "Bangalore Koramangala", status: "active", parcels_today: 16, rating: 4.7, last_active: "2026-04-26T14:55:00", rfid_status: true, parcels_week: 68, parcels_month: 215, avg_handling_time: 9, recent_activity: [{ time: "2026-04-26T14:55:00", action: "Scanned parcel", parcel_id: "DZ-987645", status: "in_transit" }, { time: "2026-04-26T14:25:00", action: "Delivered parcel", parcel_id: "DZ-987644", status: "delivered" }, { time: "2026-04-26T13:35:00", action: "Received parcel", parcel_id: "DZ-987643", status: "pending" }] },
  { id: 5, name: "Suresh Singh", phone: "+91-94321-09876", email: "suresh.singh@dropzy.in", hub: "Chennai T Nagar", status: "active", parcels_today: 11, rating: 4.5, last_active: "2026-04-26T14:20:00", rfid_status: true, parcels_week: 52, parcels_month: 164, avg_handling_time: 13, recent_activity: [{ time: "2026-04-26T14:20:00", action: "Delivered parcel", parcel_id: "DZ-987642", status: "delivered" }, { time: "2026-04-26T13:50:00", action: "Scanned parcel", parcel_id: "DZ-987641", status: "in_transit" }, { time: "2026-04-26T13:00:00", action: "Received parcel", parcel_id: "DZ-987640", status: "pending" }] },
  { id: 6, name: "Pooja Verma", phone: "+91-93210-98765", email: "pooja.verma@dropzy.in", hub: "Pune Shivaji Nagar", status: "inactive", parcels_today: 0, rating: 4.4, last_active: "2026-04-25T16:30:00", rfid_status: false, parcels_week: 0, parcels_month: 142, avg_handling_time: 12, recent_activity: [] },
  { id: 7, name: "Vikram Reddy", phone: "+91-92109-87654", email: "vikram.reddy@dropzy.in", hub: "Kolkata Park Street", status: "active", parcels_today: 9, rating: 4.8, last_active: "2026-04-26T14:40:00", rfid_status: true, parcels_week: 45, parcels_month: 189, avg_handling_time: 8, recent_activity: [{ time: "2026-04-26T14:40:00", action: "Scanned parcel", parcel_id: "DZ-987639", status: "in_transit" }, { time: "2026-04-26T14:05:00", action: "Delivered parcel", parcel_id: "DZ-987638", status: "delivered" }, { time: "2026-04-26T13:15:00", action: "Received parcel", parcel_id: "DZ-987637", status: "pending" }] },
  { id: 8, name: "Divya Nair", phone: "+91-91098-76543", email: "divya.nair@dropzy.in", hub: "Ahmedabad Navrangpura", status: "active", parcels_today: 13, rating: 4.7, last_active: "2026-04-26T14:38:00", rfid_status: true, parcels_week: 62, parcels_month: 196, avg_handling_time: 10, recent_activity: [{ time: "2026-04-26T14:38:00", action: "Delivered parcel", parcel_id: "DZ-987636", status: "delivered" }, { time: "2026-04-26T14:12:00", action: "Scanned parcel", parcel_id: "DZ-987635", status: "in_transit" }, { time: "2026-04-26T13:40:00", action: "Received parcel", parcel_id: "DZ-987634", status: "pending" }] },
  { id: 9, name: "Arun Kumar", phone: "+91-90987-65432", email: "arun.kumar@dropzy.in", hub: "Hyderabad Ameerpet", status: "active", parcels_today: 15, rating: 4.6, last_active: "2026-04-26T14:35:00", rfid_status: true, parcels_week: 71, parcels_month: 222, avg_handling_time: 11, recent_activity: [{ time: "2026-04-26T14:35:00", action: "Scanned parcel", parcel_id: "DZ-987633", status: "in_transit" }, { time: "2026-04-26T14:08:00", action: "Delivered parcel", parcel_id: "DZ-987632", status: "delivered" }, { time: "2026-04-26T13:25:00", action: "Received parcel", parcel_id: "DZ-987631", status: "pending" }] },
  { id: 10, name: "Sneha Das", phone: "+91-89876-54321", email: "sneha.das@dropzy.in", hub: "Mumbai Andheri", status: "active", parcels_today: 17, rating: 4.8, last_active: "2026-04-26T14:42:00", rfid_status: true, parcels_week: 64, parcels_month: 204, avg_handling_time: 9, recent_activity: [{ time: "2026-04-26T14:42:00", action: "Delivered parcel", parcel_id: "DZ-987630", status: "delivered" }, { time: "2026-04-26T14:18:00", action: "Scanned parcel", parcel_id: "DZ-987629", status: "in_transit" }, { time: "2026-04-26T13:45:00", action: "Received parcel", parcel_id: "DZ-987628", status: "pending" }] },
  { id: 11, name: "Rohan Joshi", phone: "+91-88765-43210", email: "rohan.joshi@dropzy.in", hub: "Delhi Karol Bagh", status: "active", parcels_today: 10, rating: 4.5, last_active: "2026-04-26T14:30:00", rfid_status: true, parcels_week: 48, parcels_month: 175, avg_handling_time: 12, recent_activity: [{ time: "2026-04-26T14:30:00", action: "Scanned parcel", parcel_id: "DZ-987627", status: "in_transit" }, { time: "2026-04-26T13:55:00", action: "Delivered parcel", parcel_id: "DZ-987626", status: "delivered" }, { time: "2026-04-26T13:10:00", action: "Received parcel", parcel_id: "DZ-987625", status: "pending" }] },
  { id: 12, name: "Anjali Singh", phone: "+91-87654-32109", email: "anjali.singh@dropzy.in", hub: "Bangalore Koramangala", status: "active", parcels_today: 14, rating: 4.9, last_active: "2026-04-26T14:48:00", rfid_status: true, parcels_week: 66, parcels_month: 217, avg_handling_time: 8, recent_activity: [{ time: "2026-04-26T14:48:00", action: "Delivered parcel", parcel_id: "DZ-987624", status: "delivered" }, { time: "2026-04-26T14:22:00", action: "Scanned parcel", parcel_id: "DZ-987623", status: "in_transit" }, { time: "2026-04-26T13:38:00", action: "Received parcel", parcel_id: "DZ-987622", status: "pending" }] },
  { id: 13, name: "Karan Malhotra", phone: "+91-86543-21098", email: "karan.malhotra@dropzy.in", hub: "Chennai T Nagar", status: "inactive", parcels_today: 0, rating: 4.3, last_active: "2026-04-24T12:15:00", rfid_status: false, parcels_week: 0, parcels_month: 156, avg_handling_time: 14, recent_activity: [] },
  { id: 14, name: "Maya Reddy", phone: "+91-85432-10987", email: "maya.reddy@dropzy.in", hub: "Pune Shivaji Nagar", status: "active", parcels_today: 12, rating: 4.6, last_active: "2026-04-26T14:26:00", rfid_status: true, parcels_week: 57, parcels_month: 192, avg_handling_time: 10, recent_activity: [{ time: "2026-04-26T14:26:00", action: "Scanned parcel", parcel_id: "DZ-987621", status: "in_transit" }, { time: "2026-04-26T13:58:00", action: "Delivered parcel", parcel_id: "DZ-987620", status: "delivered" }, { time: "2026-04-26T13:05:00", action: "Received parcel", parcel_id: "DZ-987619", status: "pending" }] },
  { id: 15, name: "Sanjay Gupta", phone: "+91-84321-09876", email: "sanjay.gupta@dropzy.in", hub: "Kolkata Park Street", status: "active", parcels_today: 11, rating: 4.4, last_active: "2026-04-26T14:33:00", rfid_status: true, parcels_week: 53, parcels_month: 198, avg_handling_time: 11, recent_activity: [{ time: "2026-04-26T14:33:00", action: "Delivered parcel", parcel_id: "DZ-987618", status: "delivered" }, { time: "2026-04-26T14:02:00", action: "Scanned parcel", parcel_id: "DZ-987617", status: "in_transit" }, { time: "2026-04-26T13:22:00", action: "Received parcel", parcel_id: "DZ-987616", status: "pending" }] },
  { id: 16, name: "Isha Patel", phone: "+91-83210-98765", email: "isha.patel@dropzy.in", hub: "Ahmedabad Navrangpura", status: "active", parcels_today: 16, rating: 4.8, last_active: "2026-04-26T14:44:00", rfid_status: true, parcels_week: 63, parcels_month: 211, avg_handling_time: 9, recent_activity: [{ time: "2026-04-26T14:44:00", action: "Scanned parcel", parcel_id: "DZ-987615", status: "in_transit" }, { time: "2026-04-26T14:16:00", action: "Delivered parcel", parcel_id: "DZ-987614", status: "delivered" }, { time: "2026-04-26T13:32:00", action: "Received parcel", parcel_id: "DZ-987613", status: "pending" }] },
  { id: 17, name: "Deepak Rao", phone: "+91-82109-87654", email: "deepak.rao@dropzy.in", hub: "Hyderabad Ameerpet", status: "active", parcels_today: 13, rating: 4.7, last_active: "2026-04-26T14:29:00", rfid_status: true, parcels_week: 61, parcels_month: 207, avg_handling_time: 10, recent_activity: [{ time: "2026-04-26T14:29:00", action: "Delivered parcel", parcel_id: "DZ-987612", status: "delivered" }, { time: "2026-04-26T14:00:00", action: "Scanned parcel", parcel_id: "DZ-987611", status: "in_transit" }, { time: "2026-04-26T13:18:00", action: "Received parcel", parcel_id: "DZ-987610", status: "pending" }] },
  { id: 18, name: "Ravi Verma", phone: "+91-81098-76543", email: "ravi.verma@dropzy.in", hub: "Mumbai Andheri", status: "active", parcels_today: 19, rating: 4.9, last_active: "2026-04-26T14:52:00", rfid_status: true, parcels_week: 73, parcels_month: 229, avg_handling_time: 8, recent_activity: [{ time: "2026-04-26T14:52:00", action: "Scanned parcel", parcel_id: "DZ-987609", status: "in_transit" }, { time: "2026-04-26T14:28:00", action: "Delivered parcel", parcel_id: "DZ-987608", status: "delivered" }, { time: "2026-04-26T13:42:00", action: "Received parcel", parcel_id: "DZ-987607", status: "pending" }] },
  { id: 19, name: "Sunita Desai", phone: "+91-80987-65432", email: "sunita.desai@dropzy.in", hub: "Delhi Karol Bagh", status: "active", parcels_today: 8, rating: 4.6, last_active: "2026-04-26T14:23:00", rfid_status: true, parcels_week: 44, parcels_month: 168, avg_handling_time: 13, recent_activity: [{ time: "2026-04-26T14:23:00", action: "Delivered parcel", parcel_id: "DZ-987606", status: "delivered" }, { time: "2026-04-26T13:52:00", action: "Scanned parcel", parcel_id: "DZ-987605", status: "in_transit" }, { time: "2026-04-26T13:08:00", action: "Received parcel", parcel_id: "DZ-987604", status: "pending" }] },
  { id: 20, name: "Vishal Kumar", phone: "+91-79876-54321", email: "vishal.kumar@dropzy.in", hub: "Bangalore Koramangala", status: "active", parcels_today: 12, rating: 4.5, last_active: "2026-04-26T14:37:00", rfid_status: true, parcels_week: 59, parcels_month: 189, avg_handling_time: 12, recent_activity: [{ time: "2026-04-26T14:37:00", action: "Scanned parcel", parcel_id: "DZ-987603", status: "in_transit" }, { time: "2026-04-26T14:07:00", action: "Delivered parcel", parcel_id: "DZ-987602", status: "delivered" }, { time: "2026-04-26T13:28:00", action: "Received parcel", parcel_id: "DZ-987601", status: "pending" }] },
];

export default function AgentsPage() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredAgents = mockAgents
    .filter((agent) => {
      if (filter === "active") return agent.status === "active";
      if (filter === "inactive") return agent.status === "inactive";
      return true;
    })
    .filter((agent) => {
      const searchLower = search.toLowerCase();
      return (
        agent.name.toLowerCase().includes(searchLower) ||
        agent.hub.toLowerCase().includes(searchLower) ||
        agent.phone.includes(search)
      );
    });

  const activeCount = mockAgents.filter((a) => a.status === "active").length;
  const inactiveCount = mockAgents.filter((a) => a.status === "inactive").length;
  const totalParcels = mockAgents.reduce((sum, a) => sum + a.parcels_today, 0);
  const avgTime =
    mockAgents.reduce((sum, a) => sum + a.avg_handling_time, 0) / mockAgents.length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Agents"
          value={mockAgents.length}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Today"
          value={activeCount}
          icon={Wifi}
          iconBg="bg-green-50"
          iconColor="text-emerald-600"
        />
        <StatsCard
          title="Parcels Handled Today"
          value={totalParcels}
          icon={Package}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Avg Handling Time"
          value={`${Math.round(avgTime)} min`}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Filter and Search */}
      <div className="rb-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, hub, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <FilterTabs
          tabs={[
            { label: "All", value: "all", count: mockAgents.length },
            { label: "Active", value: "active", count: activeCount },
            { label: "Inactive", value: "inactive", count: inactiveCount },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />
      </div>

      {/* Agents Table */}
      <div className="rb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hub Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Parcels Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {agent.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {agent.hub}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {agent.parcels_today}
                    </td>
                    <td className="px-6 py-4 text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {agent.rating}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(agent.last_active)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowModal(true);
                        }}
                        className="rb-btn rb-btn-primary text-xs px-3 py-1.5"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No agents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Details Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={selectedAgent?.name || "Agent Details"}
        size="lg"
      >
        {selectedAgent && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Name
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedAgent.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedAgent.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedAgent.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Hub Location
                  </p>
                  <p className="text-sm font-medium text-gray-900">{selectedAgent.hub}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rb-card-flat rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">This Week</p>
                  <p className="text-[22px] font-bold text-gray-900">{selectedAgent.parcels_week}</p>
                  <p className="text-[12px] text-gray-500">parcels handled</p>
                </div>
                <div className="rb-card-flat rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">This Month</p>
                  <p className="text-[22px] font-bold text-gray-900">{selectedAgent.parcels_month}</p>
                  <p className="text-[12px] text-gray-500">parcels handled</p>
                </div>
                <div className="rb-card-flat rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Avg Handling Time</p>
                  <p className="text-[22px] font-bold text-gray-900">{selectedAgent.avg_handling_time}</p>
                  <p className="text-[12px] text-gray-500">minutes</p>
                </div>
                <div className="rb-card-flat rounded-xl p-4">
                  <p className="text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Customer Rating</p>
                  <p className="text-[22px] font-bold text-gray-900">{selectedAgent.rating}</p>
                  <p className="text-[12px] text-gray-500">out of 5</p>
                </div>
              </div>
            </div>

            {/* RFID Scanner Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">RFID Scanner Status</h3>
              <div className="flex items-center gap-3 p-4 rb-card-flat rounded-xl">
                {selectedAgent.rfid_status ? (
                  <>
                    <Wifi className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {selectedAgent.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {selectedAgent.recent_activity.map((activity: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-3 rb-card-flat rounded-lg"
                    >
                      <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Parcel: {activity.parcel_id}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDateTime(activity.time)}
                        </p>
                      </div>
                      <StatusBadge status={activity.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
