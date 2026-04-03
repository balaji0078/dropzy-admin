"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersAPI, healthAPI } from "@/lib/api";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Package,
  Truck,
  CreditCard,
  Clock,
  TrendingUp,
  Users,
  MapPin,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
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
} from "recharts";

// Sample data for charts (will be replaced by real API data)
const weeklyOrders = [
  { day: "Mon", orders: 42, revenue: 18400 },
  { day: "Tue", orders: 55, revenue: 22100 },
  { day: "Wed", orders: 38, revenue: 16200 },
  { day: "Thu", orders: 67, revenue: 29800 },
  { day: "Fri", orders: 72, revenue: 31500 },
  { day: "Sat", orders: 89, revenue: 41200 },
  { day: "Sun", orders: 64, revenue: 27600 },
];

const ordersByStatus = [
  { name: "Delivered", value: 245, color: "#22c55e" },
  { name: "In Transit", value: 42, color: "#8b5cf6" },
  { name: "Pending", value: 18, color: "#eab308" },
  { name: "Cancelled", value: 8, color: "#ef4444" },
];

const vehicleBreakdown = [
  { type: "Bike", count: 145 },
  { type: "Auto", count: 89 },
  { type: "Car", count: 54 },
  { type: "Van", count: 32 },
  { type: "Truck", count: 12 },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [apiStatus, setApiStatus] = useState<"connected" | "error">("connected");

  useEffect(() => {
    if (!token) return;

    // Fetch recent orders
    ordersAPI
      .list(token, 1, 5)
      .then((res) => setRecentOrders(res.data?.orders || []))
      .catch(() => {});

    // Check health
    healthAPI
      .check()
      .then(() => setApiStatus("connected"))
      .catch(() => setApiStatus("error"));
  }, [token]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders Today"
          value="127"
          change={12.5}
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active Drivers"
          value="34"
          change={-3.2}
          icon={Truck}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Revenue Today"
          value={formatCurrency(54200)}
          change={8.7}
          icon={CreditCard}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Pending Deliveries"
          value="18"
          change={-15}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Orders Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Weekly Orders & Revenue</h3>
              <p className="text-sm text-gray-500">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-brand-500 rounded-full" />
                Orders
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                Revenue
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={weeklyOrders}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#338dff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#338dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#338dff"
                strokeWidth={2}
                fill="url(#colorOrders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by Status Pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Orders by Status</h3>
          <p className="text-sm text-gray-500 mb-4">This month breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {ordersByStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Deliveries by Vehicle</h3>
          <p className="text-sm text-gray-500 mb-4">Orders per vehicle type</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vehicleBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} stroke="#94a3b8" width={50} />
              <Tooltip />
              <Bar dataKey="count" fill="#338dff" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Recent Orders</h3>
              <p className="text-sm text-gray-500">Latest 5 orders from the platform</p>
            </div>
            <a href="/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              View all &rarr;
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.pickup_address?.substring(0, 30)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.receiver_name} &middot; {order.vehicle_type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_amount || 0)}
                    </p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No recent orders. Connect your backend to see live data.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "API Server", status: apiStatus === "connected" },
            { label: "PostgreSQL", status: true },
            { label: "Redis Cache", status: true },
            { label: "WebSocket", status: true },
          ].map((svc) => (
            <div key={svc.label} className="flex items-center gap-2 text-sm">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  svc.status ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-600">{svc.label}</span>
              <span className={svc.status ? "text-green-600" : "text-red-600"}>
                {svc.status ? "Online" : "Offline"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
