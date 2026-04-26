"use client";

import { Bell, Search, Command } from "lucide-react";
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

const pageSubtitles: Record<string, string> = {
  "/dashboard": "Overview & Analytics",
  "/parcels": "Track & manage shipments",
  "/fleet": "Real-time vehicle monitoring",
  "/drivers": "Driver management",
  "/agents": "Agent operations",
  "/payments": "Revenue & transactions",
  "/customers": "Customer directory",
  "/pricing": "Rate configuration",
  "/cost-estimator": "Shipping cost calculator",
  "/notifications": "Alerts & messages",
  "/notification-logs": "Delivery history",
  "/settings": "App configuration",
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = pageTitles[pathname] || "Dashboard";
  const subtitle = pageSubtitles[pathname] || "";

  return (
    <header
      className="h-[60px] flex items-center justify-between px-6 sticky top-0 z-40"
      style={{
        background: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
      }}
    >
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="text-[12px] text-gray-400 -mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-12 py-2 w-56 text-[13px] rounded-xl transition-all duration-200"
            style={{
              background: "rgba(0, 0, 0, 0.03)",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
            onFocus={(e) => {
              e.target.style.background = "white";
              e.target.style.borderColor = "rgba(0, 122, 255, 0.3)";
              e.target.style.boxShadow = "0 0 0 3px rgba(0, 122, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.target.style.background = "rgba(0, 0, 0, 0.03)";
              e.target.style.borderColor = "rgba(0, 0, 0, 0.06)";
              e.target.style.boxShadow = "none";
            }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-gray-300">
            <kbd className="text-[10px] font-medium bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
              <Command className="w-2.5 h-2.5 inline" />K
            </kbd>
          </div>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-gray-400 transition-all duration-200 hover:text-gray-600"
          style={{ background: "rgba(0, 0, 0, 0.03)" }}
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Status */}
        <div className="flex items-center gap-2 text-[12px] text-gray-400 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(52, 199, 89, 0.06)" }}
        >
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
