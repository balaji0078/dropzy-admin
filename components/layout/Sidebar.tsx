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
import { CORE_API } from "@/lib/config";
import { navForRoles, ROLE_LABEL } from "@/lib/roles";

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
  const { user, logout, roles, me } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  // Core mode: role-filtered PRD v2 navigation (legacy-authenticated pages are not listed, CLIENT_CONTRACTS §4.0).
  const sections = CORE_API ? navForRoles(roles) : navSections;
  const subtitle = CORE_API ? roles.map((r) => ROLE_LABEL[r]).join(", ") : user?.email || "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-surface border-r border-line flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[60px] px-4 border-b border-line">
        {!collapsed && (
          <Link href="/dashboard" className="group flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
            {/* Logo mark: violet tile with a gold parcel glyph and gold edge (the app's DropzyHero palette). */}
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center bg-dz-offer ring-1 ring-gold/50 shadow-violet">
              <Package className="w-[18px] h-[18px] text-gold" />
            </div>
            <span className="text-[17px] font-extrabold text-ink tracking-tight">Drop<span className="text-gold">zy</span></span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/40">
              {CORE_API ? "Staff" : "Admin"}
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-lg hover:bg-surface-alt hover:text-gold text-ink-faint transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          {collapsed ? <Menu className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5" aria-label="Main navigation">
        {sections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-faint">
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
                    aria-current={isActive ? "page" : undefined}
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
      <div className="p-3 border-t border-line">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 text-primary-light bg-primary-tint ring-1 ring-primary/50"
          >
            {user ? getInitials(user.first_name, user.last_name) : "AD"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">
                {user ? `${user.first_name} ${user.last_name}` : "Admin"}
              </p>
              <p className="text-[11px] text-ink-faint truncate" title={me?.phone || subtitle}>{subtitle}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 rounded-lg hover:bg-surface-alt hover:text-gold text-ink-faint transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
