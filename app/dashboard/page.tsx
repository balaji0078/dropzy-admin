"use client";

import { useState } from "react";
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
} from "lucide-react";
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
  Legend,
} from "recharts";

// Mock data for delivery trends
const deliveryTrends = [
  { day: "Mon", booked: 320, delivered: 240 },
  { day: "Tue", booked: 380, delivered: 290 },
  { day: "Wed", booked: 350, delivered: 310 },
  { day: "Thu", booked: 420, delivered: 380 },
  { day: "Fri", booked: 480, delivered: 420 },
  { day: "Sat", booked: 510, delivered: 450 },
  { day: "Sun", booked: 410, delivered: 380 },
];

// Mock data for route utilization
const routeUtilization = [
  { route: "HYD → MUM", parcels: 380 },
  { route: "BLR → DEL", parcels: 320 },
  { route: "CHE → PUN", parcels: 290 },
  { route: "KOL → AHM", parcels: 250 },
  { route: "MUM → BLR", parcels: 180 },
];

// Mock data for parcel status distribution
const parcelStatusData = [
  { name: "Booked", value: 420, color: "#3b82f6" },
  { name: "Accepted", value: 310, color: "#06b6d4" },
  { name: "In Transit", value: 342, color: "#8b5cf6" },
  { name: "Arrived at Office", value: 180, color: "#f59e0b" },
  { name: "Ready for Pickup", value: 150, color: "#ec4899" },
  { name: "Delivered", value: 1445, color: "#22c55e" },
];

// Mock recent parcels data
const mockRecentParcels = [
  {
    id: "DPZ-2026-00001",
    sender: "Rajesh Kumar",
    receiver: "Priya Singh",
    route: "HYD → MUM",
    status: "in_transit",
    lastUpdate: "2026-04-26 14:30",
  },
  {
    id: "DPZ-2026-00002",
    sender: "Amit Patel",
    receiver: "Neha Gupta",
    route: "BLR → DEL",
    status: "accepted",
    lastUpdate: "2026-04-26 13:45",
  },
  {
    id: "DPZ-2026-00003",
    sender: "Sanjay Reddy",
    receiver: "Kavya Sharma",
    route: "CHE → PUN",
    status: "delivered",
    lastUpdate: "2026-04-26 12:15",
  },
  {
    id: "DPZ-2026-00004",
    sender: "Deepak Verma",
    receiver: "Anjali Joshi",
    route: "MUM → BLR",
    status: "ready_for_pickup",
    lastUpdate: "2026-04-26 11:20",
  },
  {
    id: "DPZ-2026-00005",
    sender: "Vikram Singh",
    receiver: "Pooja Mishra",
    route: "KOL → AHM",
    status: "arrived_at_office",
    lastUpdate: "2026-04-26 10:50",
  },
  {
    id: "DPZ-2026-00006",
    sender: "Akshay Desai",
    receiver: "Divya Iyer",
    route: "HYD → MUM",
    status: "in_transit",
    lastUpdate: "2026-04-26 09:30",
  },
  {
    id: "DPZ-2026-00007",
    sender: "Suresh Nair",
    receiver: "Meera Dutta",
    route: "BLR → DEL",
    status: "booked",
    lastUpdate: "2026-04-26 08:45",
  },
  {
    id: "DPZ-2026-00008",
    sender: "Harish Kulkarni",
    receiver: "Sneha Rao",
    route: "CHE → PUN",
    status: "accepted",
    lastUpdate: "2026-04-26 07:55",
  },
  {
    id: "DPZ-2026-00009",
    sender: "Ramesh Iyer",
    receiver: "Anjali Nair",
    route: "MUM → BLR",
    status: "delivered",
    lastUpdate: "2026-04-26 06:20",
  },
  {
    id: "DPZ-2026-00010",
    sender: "Naveen Kumar",
    receiver: "Ritika Saxena",
    route: "KOL → AHM",
    status: "in_transit",
    lastUpdate: "2026-04-25 22:10",
  },
];

// Mock bus locations for map visualization
const busLocations = [
  { id: "BUS-001", city: "Hyderabad", lat: 17.36, lng: 78.47, route: "HYD → MUM" },
  { id: "BUS-002", city: "Mumbai", lat: 19.07, lng: 72.88, route: "MUM → BLR" },
  { id: "BUS-003", city: "Delhi", lat: 28.70, lng: 77.10, route: "DEL → KOL" },
  { id: "BUS-004", city: "Bangalore", lat: 12.97, lng: 77.59, route: "BLR → CHE" },
  { id: "BUS-005", city: "Chennai", lat: 13.08, lng: 80.27, route: "CHE → PUN" },
  { id: "BUS-006", city: "Pune", lat: 18.52, lng: 73.85, route: "PUN → AHM" },
  { id: "BUS-007", city: "Kolkata", lat: 22.57, lng: 88.36, route: "KOL → HYD" },
  { id: "BUS-008", city: "Ahmedabad", lat: 23.02, lng: 72.57, route: "AHM → MUM" },
];

export default function DashboardPage() {
  const { token } = useAuth();

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Total Parcels"
          value="2,847"
          change={14.2}
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="In Transit"
          value="342"
          change={8.5}
          icon={Activity}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Delivered Today"
          value="189"
          change={12.1}
          icon={Package}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(482350)}
          change={18.3}
          icon={CreditCard}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatsCard
          title="Active Buses"
          value="28"
          change={5.2}
          icon={Truck}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <StatsCard
          title="Active Agents"
          value="15"
          change={2.8}
          icon={Users}
          iconBg="bg-pink-50"
          iconColor="text-pink-600"
        />
      </div>

      {/* Live Fleet Map Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Live Fleet Map</h3>
        <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100 overflow-hidden">
          {/* Simulated map with bus locations */}
          <svg viewBox="0 0 1000 600" className="w-full h-full" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" }}>
            {/* India outline (simplified) */}
            <path
              d="M 350 200 L 450 150 L 500 160 L 480 250 L 520 280 L 510 320 L 480 350 L 420 360 L 380 340 L 350 300 Z"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Bus markers */}
            {busLocations.map((bus) => {
              // Normalize coordinates to SVG viewBox
              const svgLat = 550 - bus.lat * 8;
              const svgLng = 200 + bus.lng * 3;
              return (
                <g key={bus.id}>
                  {/* Bus dot */}
                  <circle cx={svgLng} cy={svgLat} r="8" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                  {/* Bus icon indicator */}
                  <text x={svgLng} y={svgLat + 1} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
                    B
                  </text>
                  {/* Route line (simplified) */}
                  <line
                    x1={svgLng}
                    y1={svgLat}
                    x2={svgLng + 40}
                    y2={svgLat - 40}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="4"
                    opacity="0.5"
                  />
                  {/* Label */}
                  <text x={svgLng} y={svgLat + 25} textAnchor="middle" fontSize="9" fill="#475569" className="pointer-events-none">
                    {bus.city}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-700">Active Bus</span>
            </div>
          </div>

          {/* Bus count */}
          <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{busLocations.length} Buses on Map</p>
            <p className="text-xs text-gray-500">Live tracking active</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Delivery Trends</h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={deliveryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="booked"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: "#22c55e", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Route Utilization */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Route Utilization</h3>
              <p className="text-sm text-gray-500">Top 5 routes by parcel count</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={routeUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="route" tick={{ fontSize: 11 }} stroke="#94a3b8" angle={-15} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="parcels" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Parcel Status Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Parcel Status Distribution</h3>
            <p className="text-sm text-gray-500">All parcels across lifecycle</p>
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
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {parcelStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 h-full">
              {parcelStatusData.map((item) => (
                <div key={item.name} className="bg-gray-50 rounded-lg p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((item.value / parcelStatusData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Parcels Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recent Parcels</h3>
            <p className="text-sm text-gray-500">Latest 10 parcels</p>
          </div>
          <a href="/parcels" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Tracking ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Sender</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Receiver</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentParcels.map((parcel) => (
                <tr key={parcel.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{parcel.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{parcel.sender}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{parcel.receiver}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{parcel.route}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={parcel.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{parcel.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
