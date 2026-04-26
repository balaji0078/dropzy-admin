"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Truck,
  CreditCard,
  Users,
  MapPin,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

const DashboardFleetMap = dynamic(
  () => import("@/components/ui/DashboardFleetMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(0, 0, 0, 0.02)" }}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#007AFF", borderTopColor: "transparent" }}
          />
          <span className="text-[12px] text-gray-400">Loading map...</span>
        </div>
      </div>
    ),
  }
);

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

const deliveryTrends = [
  { day: "Mon", booked: 320, delivered: 240 },
  { day: "Tue", booked: 380, delivered: 290 },
  { day: "Wed", booked: 350, delivered: 310 },
  { day: "Thu", booked: 420, delivered: 380 },
  { day: "Fri", booked: 480, delivered: 420 },
  { day: "Sat", booked: 510, delivered: 450 },
  { day: "Sun", booked: 410, delivered: 380 },
];

const routeUtilization = [
  { route: "HYD → MUM", parcels: 380 },
  { route: "BLR → DEL", parcels: 320 },
  { route: "CHE → PUN", parcels: 290 },
  { route: "KOL → AHM", parcels: 250 },
  { route: "MUM → BLR", parcels: 180 },
];

const parcelStatusData = [
  { name: "Booked", value: 420, color: "#007AFF" },
  { name: "Accepted", value: 310, color: "#5AC8FA" },
  { name: "In Transit", value: 342, color: "#5856D6" },
  { name: "At Office", value: 180, color: "#FF9500" },
  { name: "Ready", value: 150, color: "#FF2D55" },
  { name: "Delivered", value: 1445, color: "#34C759" },
];

const mockRecentParcels = [
  { id: "DPZ-2026-00001", sender: "Rajesh Kumar", receiver: "Priya Singh", route: "HYD → MUM", status: "in_transit", lastUpdate: "2026-04-26 14:30" },
  { id: "DPZ-2026-00002", sender: "Amit Patel", receiver: "Neha Gupta", route: "BLR → DEL", status: "accepted", lastUpdate: "2026-04-26 13:45" },
  { id: "DPZ-2026-00003", sender: "Sanjay Reddy", receiver: "Kavya Sharma", route: "CHE → PUN", status: "delivered", lastUpdate: "2026-04-26 12:15" },
  { id: "DPZ-2026-00004", sender: "Deepak Verma", receiver: "Anjali Joshi", route: "MUM → BLR", status: "ready_for_pickup", lastUpdate: "2026-04-26 11:20" },
  { id: "DPZ-2026-00005", sender: "Vikram Singh", receiver: "Pooja Mishra", route: "KOL → AHM", status: "arrived_at_office", lastUpdate: "2026-04-26 10:50" },
  { id: "DPZ-2026-00006", sender: "Akshay Desai", receiver: "Divya Iyer", route: "HYD → MUM", status: "in_transit", lastUpdate: "2026-04-26 09:30" },
  { id: "DPZ-2026-00007", sender: "Suresh Nair", receiver: "Meera Dutta", route: "BLR → DEL", status: "booked", lastUpdate: "2026-04-26 08:45" },
  { id: "DPZ-2026-00008", sender: "Harish Kulkarni", receiver: "Sneha Rao", route: "CHE → PUN", status: "accepted", lastUpdate: "2026-04-26 07:55" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: "12px",
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
      }}
    >
      <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[13px] font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { token } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="p-6 rounded-3xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #007AFF 0%, #5856D6 50%, #AF52DE 100%)",
          boxShadow: "0 8px 32px rgba(0, 122, 255, 0.2)",
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3), transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2), transparent 50%)",
          }}
        />
        <div className="relative z-10">
          <p className="text-white/70 text-[13px] font-medium">Welcome back</p>
          <h2 className="text-white text-[22px] font-bold tracking-tight mt-0.5">Dropzy Operations Center</h2>
          <p className="text-white/60 text-[13px] mt-1">Everything running smoothly today</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 text-center">
            <p className="text-white text-[20px] font-bold">98.2%</p>
            <p className="text-white/60 text-[11px] font-medium">On-Time Rate</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 text-center">
            <p className="text-white text-[20px] font-bold">4.8</p>
            <p className="text-white/60 text-[11px] font-medium">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Parcels"
          value="2,847"
          change={14.2}
          icon={Package}
          gradient="linear-gradient(135deg, #007AFF, #5AC8FA)"
        />
        <StatsCard
          title="In Transit"
          value="342"
          change={8.5}
          icon={Activity}
          gradient="linear-gradient(135deg, #5856D6, #AF52DE)"
        />
        <StatsCard
          title="Delivered Today"
          value="189"
          change={12.1}
          icon={Package}
          gradient="linear-gradient(135deg, #34C759, #30D158)"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(482350)}
          change={18.3}
          icon={CreditCard}
          gradient="linear-gradient(135deg, #FF9500, #FFCC00)"
        />
        <StatsCard
          title="Active Buses"
          value="28"
          change={5.2}
          icon={Truck}
          gradient="linear-gradient(135deg, #5AC8FA, #007AFF)"
        />
        <StatsCard
          title="Active Agents"
          value="15"
          change={2.8}
          icon={Users}
          gradient="linear-gradient(135deg, #FF2D55, #FF6482)"
        />
      </div>

      {/* Live Fleet Map */}
      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="section-title">Live Fleet Map</h3>
            <p className="section-subtitle mt-0.5">Real-time bus positions updating every 3 seconds</p>
          </div>
          <a
            href="/fleet"
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color: "#007AFF" }}
          >
            Full Fleet View
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <DashboardFleetMap />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Trends */}
        <div className="glass-card-static p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="section-title">Delivery Trends</h3>
              <p className="section-subtitle mt-0.5">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#007AFF" }} />
                <span className="text-[11px] text-gray-400">Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#34C759" }} />
                <span className="text-[11px] text-gray-400">Delivered</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={deliveryTrends}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34C759" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#34C759" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="booked" stroke="#007AFF" strokeWidth={2.5} fill="url(#blueGrad)" dot={false} activeDot={{ r: 5, fill: "#007AFF", stroke: "white", strokeWidth: 2 }} />
              <Area type="monotone" dataKey="delivered" stroke="#34C759" strokeWidth={2.5} fill="url(#greenGrad)" dot={false} activeDot={{ r: 5, fill: "#34C759", stroke: "white", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Route Utilization */}
        <div className="glass-card-static p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="section-title">Route Utilization</h3>
              <p className="section-subtitle mt-0.5">Top 5 routes by parcel count</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={routeUtilization} barSize={32}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#007AFF" stopOpacity={1} />
                  <stop offset="100%" stopColor="#5856D6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
              <XAxis dataKey="route" tick={{ fontSize: 10, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8E8E93" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="parcels" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parcel Status Distribution */}
      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="section-title">Parcel Status Distribution</h3>
            <p className="section-subtitle mt-0.5">All parcels across lifecycle</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={parcelStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {parcelStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {parcelStatusData.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <p className="text-[12px] font-medium text-gray-500">{item.name}</p>
                  </div>
                  <p className="text-[22px] font-bold text-gray-900 tracking-tight">{item.value.toLocaleString()}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {((item.value / parcelStatusData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Parcels */}
      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-title">Recent Parcels</h3>
            <p className="section-subtitle mt-0.5">Latest shipments</p>
          </div>
          <a
            href="/parcels"
            className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
            style={{ color: "#007AFF" }}
          >
            View all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="apple-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Route</th>
                <th>Status</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentParcels.map((parcel) => (
                <tr key={parcel.id}>
                  <td className="font-semibold text-gray-900">{parcel.id}</td>
                  <td className="text-gray-600">{parcel.sender}</td>
                  <td className="text-gray-600">{parcel.receiver}</td>
                  <td>
                    <span className="px-2 py-1 rounded-lg text-[12px] font-medium" style={{ background: "rgba(0, 122, 255, 0.06)", color: "#007AFF" }}>
                      {parcel.route}
                    </span>
                  </td>
                  <td><StatusBadge status={parcel.status} /></td>
                  <td className="text-gray-400 text-[12px]">{parcel.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
