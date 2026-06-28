"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  CreditCard,
  Users,
  Tags,
  Bell,
  LogOut,
  ChevronLeft,
  Menu,
  Calculator,
  MapPin,
  Bus,
  UserCheck,
  MessageSquare,
  Settings,
  Building2,
  Boxes,
  Layers,
  Wallet,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn, getInitials } from "@/lib/utils";

const navSections = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/parcels", label: "Parcels", icon: MapPin },
      { href: "/fleet", label: "Fleet Tracking", icon: Bus },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/drivers", label: "Drivers", icon: Truck },
      { href: "/agents", label: "Agents", icon: UserCheck },
      { href: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/pricing", label: "Pricing", icon: Tags },
      { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { href: "/operators", label: "Operators", icon: Building2 },
      { href: "/shipments", label: "Shipments", icon: Boxes },
      { href: "/capacity", label: "Capacity Marketplace", icon: Layers },
      { href: "/settlements", label: "Settlements", icon: Wallet },
      { href: "/support", label: "Support", icon: LifeBuoy },
      { href: "/users-roles", label: "Users & Roles", icon: ShieldCheck },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/notification-logs", label: "Notification Logs", icon: MessageSquare },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{ borderRight: "1px solid #EEEEEE" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[60px] px-4" style={{ borderBottom: "1px solid #EEEEEE" }}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#D82C2C" }}
            >
              <Package className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900">Dropzy</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#FEF2F2", color: "#D82C2C" }}>
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
        >
          {collapsed ? <Menu className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "sidebar-link",
                      isActive ? "sidebar-link-active" : "sidebar-link-inactive"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3" style={{ borderTop: "1px solid #EEEEEE" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 text-white"
            style={{ background: "#D82C2C" }}
          >
            {user ? getInitials(user.first_name, user.last_name) : "AD"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Admin"}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
