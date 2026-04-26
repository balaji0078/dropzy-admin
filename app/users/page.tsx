"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Users,
  UserCheck,
  UserX,
  UserCog,
  Search,
  Download,
  MoreVertical,
  Edit2,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

// Mock user data
const mockUsers = [
  { id: 1, name: "Rajesh Kumar", email: "rajesh.kumar@dropzy.in", phone: "+91-98765-43210", role: "driver", status: "active", registered_date: "2025-06-15", last_active: "2026-04-26T14:52:00", deliveries_completed: 342, activity_history: [{ date: "2026-04-26T14:52:00", action: "Completed delivery" }, { date: "2026-04-26T13:30:00", action: "Accepted parcel" }] },
  { id: 2, name: "Priya Sharma", email: "priya.sharma@dropzy.in", phone: "+91-97654-32109", role: "customer", status: "active", registered_date: "2025-08-22", last_active: "2026-04-26T14:45:00", orders_placed: 28, activity_history: [{ date: "2026-04-26T14:45:00", action: "Placed order" }, { date: "2026-04-26T10:15:00", action: "Viewed tracking" }] },
  { id: 3, name: "Amit Patel", email: "amit.patel@dropzy.in", phone: "+91-96543-21098", role: "agent", status: "active", registered_date: "2025-07-10", last_active: "2026-04-26T14:50:00", parcels_handled: 567, activity_history: [{ date: "2026-04-26T14:50:00", action: "Scanned parcel" }, { date: "2026-04-26T14:20:00", action: "Updated status" }] },
  { id: 4, name: "Neha Gupta", email: "neha.gupta@dropzy.in", phone: "+91-95432-10987", role: "driver", status: "active", registered_date: "2025-05-18", last_active: "2026-04-26T14:55:00", deliveries_completed: 521, activity_history: [{ date: "2026-04-26T14:55:00", action: "Completed delivery" }, { date: "2026-04-26T14:10:00", action: "Started route" }] },
  { id: 5, name: "Suresh Singh", email: "suresh.singh@dropzy.in", phone: "+91-94321-09876", role: "customer", status: "suspended", registered_date: "2025-09-05", last_active: "2026-04-20T09:30:00", orders_placed: 5, activity_history: [] },
  { id: 6, name: "Pooja Verma", email: "pooja.verma@dropzy.in", phone: "+91-93210-98765", role: "admin", status: "active", registered_date: "2025-01-30", last_active: "2026-04-26T14:20:00", admin_actions: 156, activity_history: [{ date: "2026-04-26T14:20:00", action: "Updated settings" }] },
  { id: 7, name: "Vikram Reddy", email: "vikram.reddy@dropzy.in", phone: "+91-92109-87654", role: "driver", status: "active", registered_date: "2025-06-25", last_active: "2026-04-26T14:40:00", deliveries_completed: 298, activity_history: [{ date: "2026-04-26T14:40:00", action: "Completed delivery" }] },
  { id: 8, name: "Divya Nair", email: "divya.nair@dropzy.in", phone: "+91-91098-76543", role: "agent", status: "active", registered_date: "2025-08-12", last_active: "2026-04-26T14:38:00", parcels_handled: 423, activity_history: [{ date: "2026-04-26T14:38:00", action: "Scanned parcel" }] },
  { id: 9, name: "Arun Kumar", email: "arun.kumar@dropzy.in", phone: "+91-90987-65432", role: "customer", status: "pending", registered_date: "2026-04-15", last_active: "2026-04-15T10:00:00", orders_placed: 0, activity_history: [] },
  { id: 10, name: "Sneha Das", email: "sneha.das@dropzy.in", phone: "+91-89876-54321", role: "driver", status: "active", registered_date: "2025-07-08", last_active: "2026-04-26T14:42:00", deliveries_completed: 412, activity_history: [{ date: "2026-04-26T14:42:00", action: "Completed delivery" }] },
  { id: 11, name: "Rohan Joshi", email: "rohan.joshi@dropzy.in", phone: "+91-88765-43210", role: "agent", status: "active", registered_date: "2025-09-20", last_active: "2026-04-26T14:30:00", parcels_handled: 354, activity_history: [{ date: "2026-04-26T14:30:00", action: "Scanned parcel" }] },
  { id: 12, name: "Anjali Singh", email: "anjali.singh@dropzy.in", phone: "+91-87654-32109", role: "customer", status: "active", registered_date: "2025-10-03", last_active: "2026-04-26T14:48:00", orders_placed: 15, activity_history: [{ date: "2026-04-26T14:48:00", action: "Placed order" }] },
  { id: 13, name: "Karan Malhotra", email: "karan.malhotra@dropzy.in", phone: "+91-86543-21098", role: "driver", status: "suspended", registered_date: "2025-04-12", last_active: "2026-04-18T08:20:00", deliveries_completed: 189, activity_history: [] },
  { id: 14, name: "Maya Reddy", email: "maya.reddy@dropzy.in", phone: "+91-85432-10987", role: "customer", status: "active", registered_date: "2025-11-08", last_active: "2026-04-26T14:26:00", orders_placed: 22, activity_history: [{ date: "2026-04-26T14:26:00", action: "Viewed tracking" }] },
  { id: 15, name: "Sanjay Gupta", email: "sanjay.gupta@dropzy.in", phone: "+91-84321-09876", role: "agent", status: "active", registered_date: "2025-08-29", last_active: "2026-04-26T14:33:00", parcels_handled: 478, activity_history: [{ date: "2026-04-26T14:33:00", action: "Scanned parcel" }] },
  { id: 16, name: "Isha Patel", email: "isha.patel@dropzy.in", phone: "+91-83210-98765", role: "driver", status: "active", registered_date: "2025-05-16", last_active: "2026-04-26T14:44:00", deliveries_completed: 356, activity_history: [{ date: "2026-04-26T14:44:00", action: "Completed delivery" }] },
  { id: 17, name: "Deepak Rao", email: "deepak.rao@dropzy.in", phone: "+91-82109-87654", role: "customer", status: "active", registered_date: "2025-12-01", last_active: "2026-04-26T14:29:00", orders_placed: 8, activity_history: [{ date: "2026-04-26T14:29:00", action: "Placed order" }] },
  { id: 18, name: "Ravi Verma", email: "ravi.verma@dropzy.in", phone: "+91-81098-76543", role: "agent", status: "active", registered_date: "2025-07-24", last_active: "2026-04-26T14:52:00", parcels_handled: 612, activity_history: [{ date: "2026-04-26T14:52:00", action: "Scanned parcel" }] },
  { id: 19, name: "Sunita Desai", email: "sunita.desai@dropzy.in", phone: "+91-80987-65432", role: "driver", status: "active", registered_date: "2025-06-11", last_active: "2026-04-26T14:23:00", deliveries_completed: 267, activity_history: [{ date: "2026-04-26T14:23:00", action: "Completed delivery" }] },
  { id: 20, name: "Vishal Kumar", email: "vishal.kumar@dropzy.in", phone: "+91-79876-54321", role: "customer", status: "pending", registered_date: "2026-04-22", last_active: "2026-04-22T15:30:00", orders_placed: 0, activity_history: [] },
  { id: 21, name: "Sangeeta Deshmukh", email: "sangeeta.deshmukh@dropzy.in", phone: "+91-78765-43210", role: "driver", status: "active", registered_date: "2025-03-20", last_active: "2026-04-26T14:51:00", deliveries_completed: 645, activity_history: [{ date: "2026-04-26T14:51:00", action: "Completed delivery" }] },
  { id: 22, name: "Harsha Nair", email: "harsha.nair@dropzy.in", phone: "+91-77654-32109", role: "customer", status: "active", registered_date: "2025-10-14", last_active: "2026-04-26T14:35:00", orders_placed: 19, activity_history: [{ date: "2026-04-26T14:35:00", action: "Placed order" }] },
  { id: 23, name: "Nikhil Mehta", email: "nikhil.mehta@dropzy.in", phone: "+91-76543-21098", role: "agent", status: "active", registered_date: "2025-09-07", last_active: "2026-04-26T14:46:00", parcels_handled: 389, activity_history: [{ date: "2026-04-26T14:46:00", action: "Scanned parcel" }] },
  { id: 24, name: "Manish Sharma", email: "manish.sharma@dropzy.in", phone: "+91-75432-10987", role: "driver", status: "active", registered_date: "2025-04-09", last_active: "2026-04-26T14:49:00", deliveries_completed: 534, activity_history: [{ date: "2026-04-26T14:49:00", action: "Completed delivery" }] },
  { id: 25, name: "Ritu Verma", email: "ritu.verma@dropzy.in", phone: "+91-74321-09876", role: "customer", status: "suspended", registered_date: "2025-07-17", last_active: "2026-04-19T11:45:00", orders_placed: 3, activity_history: [] },
  { id: 26, name: "Anand Kumar", email: "anand.kumar@dropzy.in", phone: "+91-73210-98765", role: "admin", status: "active", registered_date: "2025-02-14", last_active: "2026-04-26T14:15:00", admin_actions: 234, activity_history: [{ date: "2026-04-26T14:15:00", action: "Updated configuration" }] },
  { id: 27, name: "Zara Khan", email: "zara.khan@dropzy.in", phone: "+91-72109-87654", role: "driver", status: "active", registered_date: "2025-08-06", last_active: "2026-04-26T14:39:00", deliveries_completed: 378, activity_history: [{ date: "2026-04-26T14:39:00", action: "Completed delivery" }] },
  { id: 28, name: "Priya Desai", email: "priya.desai@dropzy.in", phone: "+91-71098-76543", role: "customer", status: "active", registered_date: "2025-11-25", last_active: "2026-04-26T14:32:00", orders_placed: 12, activity_history: [{ date: "2026-04-26T14:32:00", action: "Viewed tracking" }] },
  { id: 29, name: "Varun Singh", email: "varun.singh@dropzy.in", phone: "+91-70987-65432", role: "agent", status: "active", registered_date: "2025-10-11", last_active: "2026-04-26T14:47:00", parcels_handled: 445, activity_history: [{ date: "2026-04-26T14:47:00", action: "Scanned parcel" }] },
  { id: 30, name: "Kavya Patel", email: "kavya.patel@dropzy.in", phone: "+91-69876-54321", role: "customer", status: "active", registered_date: "2025-12-10", last_active: "2026-04-26T14:41:00", orders_placed: 6, activity_history: [{ date: "2026-04-26T14:41:00", action: "Placed order" }] },
];

const roleColors: Record<string, string> = {
  customer: "bg-blue-100 text-blue-800",
  driver: "bg-purple-100 text-purple-800",
  agent: "bg-cyan-100 text-cyan-800",
  admin: "bg-red-100 text-red-800",
};

export default function UsersPage() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const filteredUsers = mockUsers
    .filter((u) => {
      if (filter === "customers") return u.role === "customer";
      if (filter === "drivers") return u.role === "driver";
      if (filter === "agents") return u.role === "agent";
      if (filter === "admins") return u.role === "admin";
      return true;
    })
    .filter((u) => {
      const searchLower = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone.includes(search)
      );
    });

  const customerCount = mockUsers.filter((u) => u.role === "customer").length;
  const driverCount = mockUsers.filter((u) => u.role === "driver").length;
  const agentCount = mockUsers.filter((u) => u.role === "agent").length;
  const adminCount = mockUsers.filter((u) => u.role === "admin").length;
  const activeCount = mockUsers.filter((u) => u.status === "active").length;

  const toggleUserSelection = (id: number) => {
    setSelectedUsers(
      selectedUsers.includes(id)
        ? selectedUsers.filter((uid) => uid !== id)
        : [...selectedUsers, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (action === "suspend") {
      // Mock action
      alert(`Suspended ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
    } else if (action === "export") {
      // Mock CSV export
      const csv = "name,email,phone,role,status\n" +
        filteredUsers
          .map((u) => `"${u.name}","${u.email}","${u.phone}","${u.role}","${u.status}"`)
          .join("\n");
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
      );
      element.setAttribute("download", "users_export.csv");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Users"
          value={mockUsers.length}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Customers"
          value={customerCount}
          icon={UserCheck}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <StatsCard
          title="Drivers"
          value={driverCount}
          icon={UserCog}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Agents"
          value={agentCount}
          icon={Shield}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Active Users"
          value={activeCount}
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <FilterTabs
          tabs={[
            { label: "All", value: "all", count: mockUsers.length },
            { label: "Customers", value: "customers", count: customerCount },
            { label: "Drivers", value: "drivers", count: driverCount },
            { label: "Agents", value: "agents", count: agentCount },
            { label: "Admins", value: "admins", count: adminCount },
          ]}
          activeTab={filter}
          onChange={setFilter}
        />
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="glass-card border-[#007AFF]/20 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">
            {selectedUsers.length} user(s) selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction("suspend")}
              className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700"
            >
              Suspend Selected
            </button>
            <button
              onClick={() => handleBulkAction("export")}
              className="apple-btn apple-btn-primary px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Export as CSV
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length > 0 &&
                      selectedUsers.length === filteredUsers.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map((u) => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Registered
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleUserSelection(u.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {u.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.phone}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          roleColors[u.role] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(u.registered_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(u.last_active)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`${selectedUser?.name} - User Profile`}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Name
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedUser.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedUser.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>
            </div>

            {/* Role and Account Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Account Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card-static rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                    Role
                  </p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {selectedUser.role}
                  </p>
                </div>
                <div className="glass-card-static rounded-lg p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                    Registered
                  </p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(selectedUser.registered_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Activity Summary
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedUser.role === "customer" && (
                  <>
                    <div className="glass-card-static rounded-lg p-4 border-[#007AFF]/20">
                      <p className="text-xs text-[#007AFF] uppercase tracking-wide mb-1">
                        Orders Placed
                      </p>
                      <p className="text-[22px] font-bold text-gray-900">
                        {selectedUser.orders_placed}
                      </p>
                    </div>
                  </>
                )}
                {selectedUser.role === "driver" && (
                  <>
                    <div className="glass-card-static rounded-lg p-4 border-purple-200/20">
                      <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">
                        Deliveries Completed
                      </p>
                      <p className="text-[22px] font-bold text-gray-900">
                        {selectedUser.deliveries_completed}
                      </p>
                    </div>
                  </>
                )}
                {selectedUser.role === "agent" && (
                  <>
                    <div className="glass-card-static rounded-lg p-4 border-cyan-200/20">
                      <p className="text-xs text-cyan-600 uppercase tracking-wide mb-1">
                        Parcels Handled
                      </p>
                      <p className="text-[22px] font-bold text-gray-900">
                        {selectedUser.parcels_handled}
                      </p>
                    </div>
                  </>
                )}
                {selectedUser.role === "admin" && (
                  <>
                    <div className="glass-card-static rounded-lg p-4 border-red-200/20">
                      <p className="text-xs text-red-600 uppercase tracking-wide mb-1">
                        Admin Actions
                      </p>
                      <p className="text-[22px] font-bold text-gray-900">
                        {selectedUser.admin_actions}
                      </p>
                    </div>
                  </>
                )}
                <div className="glass-card-static rounded-lg p-4">
                  <p className="text-xs text-gray-700 uppercase tracking-wide mb-1">
                    Last Active
                  </p>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatDateTime(selectedUser.last_active)}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity History */}
            {selectedUser.activity_history && selectedUser.activity_history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-2">
                  {selectedUser.activity_history.map(
                    (activity: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="text-sm text-gray-600">
                          {activity.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(activity.date)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {selectedUser.status === "active" && (
                <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 flex items-center justify-center gap-2">
                  <UserX className="w-4 h-4" />
                  Suspend Account
                </button>
              )}
              {selectedUser.status === "suspended" && (
                <button className="flex-1 px-4 py-2 bg-[#34C759]/10 text-[#34C759] rounded-xl text-sm font-medium hover:bg-[#34C759]/20 flex items-center justify-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Activate Account
                </button>
              )}
              <button className="apple-btn apple-btn-secondary flex-1 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
