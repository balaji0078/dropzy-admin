"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search, Headphones, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { CORE_API } from "@/lib/config";
import { coreInbox } from "@/lib/core-api";
import { hasAnyRole, PAGE_ROLES, ROLE_LABEL } from "@/lib/roles";

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
  "/operators": "Operators",
  "/shipments": "Shipments",
  "/capacity": "Capacity Marketplace",
  "/settlements": "Settlements",
  "/support": "Support",
  "/users-roles": "Users & Roles",
  "/users": "Users",
};

// Core mode titles (P1–P19). Legacy-authenticated pages are not listed (they redirect to /dashboard, §4.0).
const corePageTitles: Record<string, string> = {
  "/dashboard": "Operations Dashboard",
  "/shipments": "Shipments",
  "/weight-exceptions": "Weight Exceptions",
  "/unpaid-holds": "Unpaid Holds",
  "/warehouse/receive": "Warehouse — Scan & Receive",
  "/warehouse/inventory": "Warehouse — Inventory",
  "/warehouse/release": "Warehouse — Release",
  "/disputes": "Disputes",
  "/support": "Support Tickets",
  "/tariffs": "Tariffs",
  "/operators": "Operators",
  "/stops": "Stops",
  "/routes": "Routes",
  "/trips": "Trips",
  "/warehouses": "Warehouses",
  "/users-roles": "Users & Roles",
  "/finance/payments": "Finance — Payments",
  "/finance/ledger": "Finance — Ledger",
  "/finance/reconciliation": "Finance — Reconciliation",
  "/finance/settlements": "Finance — Settlements",
  "/settlements": "Finance — Settlements",
  "/reports": "Reports",
  "/audit": "Audit Log",
  "/notification-logs": "Notification Log",
  "/system": "System Health",
  "/inbox": "Notifications",
  "/capacity": "Capacity Marketplace",
};
const corePrefixTitles: [string, string][] = [
  ["/shipments/", "Shipment Detail"],
  ["/disputes/", "Dispute"],
  ["/warehouse/release/", "Warehouse — Release"],
];

function titleFor(pathname: string): string {
  if (!CORE_API) return pageTitles[pathname] || "Dashboard";
  if (corePageTitles[pathname]) return corePageTitles[pathname];
  const p = corePrefixTitles.find(([prefix]) => pathname.startsWith(prefix));
  return p ? p[1] : "Dropzy Portal";
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, roles, logout } = useAuth();
  const [unread, setUnread] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const title = titleFor(pathname);
  const canSearch = !CORE_API || hasAnyRole(roles, PAGE_ROLES.shipments);

  // Core inbox unread count (30 s, paused while the tab is hidden).
  useEffect(() => {
    if (!CORE_API || !user) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await coreInbox.unreadCount();
        if (!cancelled) setUnread(r?.unread ?? 0);
      } catch {
        /* badge is best effort */
      }
      if (!cancelled && document.visibilityState === "visible") timer = setTimeout(tick, 30000);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
      else if (timer) clearTimeout(timer);
    };
    tick();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!CORE_API) return;
    const q = query.trim();
    if (!q) return;
    router.push(`/shipments?dcn=${encodeURIComponent(q.toUpperCase())}`);
  };

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
        {canSearch && (
          <form className="relative" role="search" onSubmit={submitSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
            <input
              type="text"
              aria-label={CORE_API ? "Search shipments by DCN" : "Search parcels, routes"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={CORE_API ? "Search DCN…" : "Search parcels, routes..."}
              className="pl-9 pr-4 py-2 w-56 text-[13px] rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </form>
        )}

        {/* Help */}
        {!CORE_API && (
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Help">
            <Headphones className="w-[18px] h-[18px]" />
          </button>
        )}

        {/* Notifications */}
        {CORE_API ? (
          <Link href="/inbox" className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
            <Bell className="w-[18px] h-[18px]" />
            {!!unread && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white" style={{ background: "#D82C2C" }}>
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        ) : (
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Notifications">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white" style={{ background: "#D82C2C" }} />
          </button>
        )}

        {/* Core user menu */}
        {CORE_API && user && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="text-right leading-tight">
              <p className="text-[12px] font-semibold text-gray-900">{`${user.first_name} ${user.last_name}`.trim()}</p>
              <p className="text-[11px] text-gray-500">{roles.map((r) => ROLE_LABEL[r]).join(", ")}</p>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Log out" title="Log out">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-[12px] text-gray-500 px-3 py-1.5 rounded-full bg-green-50">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-600 font-semibold">Live</span>
        </div>
      </div>
    </header>
  );
}
