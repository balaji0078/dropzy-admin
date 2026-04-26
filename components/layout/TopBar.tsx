"use client";

import { Bell, Search, Headphones } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/parcels": "Parcels",
  "/fleet": "Fleet Tracking",
  "/drivers": "Drivers",
  "/agents": "Agents",
  "/payments": "Payments",
  "/customers": "Customers",
  "/pricing": "Pricing Rules",
  "/cost-estimator": "Cost Estimator",
  "/notifications": "Notifications",
  "/notification-logs": "Notification Logs",
  "/settings": "Settings",
  "/orders": "Orders",
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header
      className="h-[56px] bg-white flex items-center justify-between px-6 sticky top-0 z-40"
      style={{ borderBottom: "1px solid #EEEEEE" }}
    >
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search parcels, routes..."
            className="pl-9 pr-4 py-2 w-56 text-[13px] rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
          />
        </div>

        {/* Help */}
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Headphones className="w-[18px] h-[18px]" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white" style={{ background: "#D82C2C" }} />
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 px-3 py-1.5 rounded-full bg-green-50">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-semibold">Live</span>
        </div>
      </div>
    </header>
  );
}
