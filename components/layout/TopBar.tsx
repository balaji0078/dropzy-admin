"use client";

import { Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders Management",
  "/drivers": "Drivers Management",
  "/payments": "Payments",
  "/customers": "Customers",
  "/pricing": "Pricing Rules",
  "/notifications": "Notifications",
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Notifications bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          API Connected
        </div>
      </div>
    </header>
  );
}
