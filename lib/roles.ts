// Role → page access and sidebar mapping (CLIENT_CONTRACTS.md §4.1).
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Boxes, Scale, Lock, ScanLine, Warehouse, PackageCheck, Gavel, LifeBuoy, Tags, Building2, MapPin, Route as RouteIcon,
  Bus, Store, ShieldCheck, CreditCard, BookOpen, Landmark, Wallet, FileSpreadsheet, History, MessageSquare, Activity, Bell, Layers,
} from "lucide-react";
import type { Role } from "./core-types";

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  driver: "Driver",
  warehouse_staff: "Warehouse staff",
  support: "Support",
  ops_manager: "Ops manager",
  finance: "Finance",
  admin: "Admin",
};

const SUP: Role = "support";
const OPS: Role = "ops_manager";
const FIN: Role = "finance";
const ADM: Role = "admin";
const WH: Role = "warehouse_staff";

/** Page access (the "Roles" column of §4.1). */
export const PAGE_ROLES = {
  dashboard: [SUP, OPS, FIN, ADM],
  shipments: [SUP, OPS, FIN, ADM],
  weightExceptions: [SUP, OPS, FIN, ADM],
  unpaidHolds: [SUP, OPS, FIN, ADM],
  warehouseReceive: [WH],
  warehouseInventory: [WH, SUP, OPS, FIN, ADM],
  warehouseRelease: [WH],
  disputes: [SUP, OPS, ADM],
  support: [SUP, OPS, ADM],
  tariffs: [OPS, FIN, ADM],
  catalog: [OPS, ADM],
  users: [OPS, ADM],
  financePayments: [FIN, ADM, OPS],
  finance: [FIN, ADM],
  reports: [OPS, FIN, ADM],
  audit: [SUP, OPS, FIN, ADM],
  notificationLog: [SUP, OPS, ADM],
  system: [ADM, OPS, FIN],
  inbox: [WH, SUP, OPS, FIN, ADM],
  capacity: [OPS, ADM],
} satisfies Record<string, Role[]>;

/** Write permissions inside pages (openapi x-roles). */
export const WRITE_ROLES = {
  overrides: [OPS, ADM],
  identityHold: [SUP, OPS, ADM],
  openDispute: [SUP, OPS, ADM],
  assignDispute: [SUP, OPS, ADM],
  resolveDispute: [OPS, ADM],
  tickets: [SUP, OPS, ADM],
  tariffs: [ADM],
  catalog: [ADM],
  trips: [OPS, ADM],
  users: [ADM],
  finance: [FIN, ADM],
  outbox: [ADM],
  relocate: [WH],
} satisfies Record<string, Role[]>;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that see the item in the sidebar (§4.1 "Sidebar by role"). */
  sidebar: Role[];
}
export interface NavSection {
  title: string;
  items: NavItem[];
}

// Sidebar by role: warehouse_staff → P7, P8, P9 (+ notifications); support → P2–P6, P10, P11, P17, P18;
// ops_manager → all except finance write pages (P15 shows payments read only); finance → P2–P6, P12, P15, P16, P17, P19;
// admin → all. P7/P9 are warehouse_staff-only pages (x-roles), so they are listed for warehouse_staff only.
export const CORE_NAV: NavSection[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, sidebar: [SUP, OPS, FIN, ADM] },
      { href: "/shipments", label: "Shipments", icon: Boxes, sidebar: [SUP, OPS, FIN, ADM] },
      { href: "/weight-exceptions", label: "Weight Exceptions", icon: Scale, sidebar: [SUP, OPS, FIN, ADM] },
      { href: "/unpaid-holds", label: "Unpaid Holds", icon: Lock, sidebar: [SUP, OPS, FIN, ADM] },
      { href: "/disputes", label: "Disputes", icon: Gavel, sidebar: [SUP, OPS, ADM] },
      { href: "/support", label: "Support Tickets", icon: LifeBuoy, sidebar: [SUP, OPS, ADM] },
    ],
  },
  {
    title: "Warehouse",
    items: [
      { href: "/warehouse/receive", label: "Scan & Receive", icon: ScanLine, sidebar: [WH] },
      { href: "/warehouse/inventory", label: "Inventory", icon: Warehouse, sidebar: [WH, OPS, ADM] },
      { href: "/warehouse/release", label: "Release", icon: PackageCheck, sidebar: [WH] },
    ],
  },
  {
    title: "Catalog & Pricing",
    items: [
      { href: "/tariffs", label: "Tariffs", icon: Tags, sidebar: [OPS, FIN, ADM] },
      { href: "/operators", label: "Operators", icon: Building2, sidebar: [OPS, ADM] },
      { href: "/stops", label: "Stops", icon: MapPin, sidebar: [OPS, ADM] },
      { href: "/routes", label: "Routes", icon: RouteIcon, sidebar: [OPS, ADM] },
      { href: "/trips", label: "Trips", icon: Bus, sidebar: [OPS, ADM] },
      { href: "/warehouses", label: "Warehouses", icon: Store, sidebar: [OPS, ADM] },
      { href: "/users-roles", label: "Users & Roles", icon: ShieldCheck, sidebar: [OPS, ADM] },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/finance/payments", label: "Payments", icon: CreditCard, sidebar: [FIN, OPS, ADM] },
      { href: "/finance/ledger", label: "Ledger", icon: BookOpen, sidebar: [FIN, ADM] },
      { href: "/finance/reconciliation", label: "Reconciliation", icon: Landmark, sidebar: [FIN, ADM] },
      { href: "/finance/settlements", label: "Settlements", icon: Wallet, sidebar: [FIN, ADM] },
      { href: "/reports", label: "Reports", icon: FileSpreadsheet, sidebar: [OPS, FIN, ADM] },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/audit", label: "Audit Log", icon: History, sidebar: [SUP, OPS, FIN, ADM] },
      { href: "/notification-logs", label: "Notification Log", icon: MessageSquare, sidebar: [SUP, OPS, ADM] },
      { href: "/system", label: "System Health", icon: Activity, sidebar: [OPS, FIN, ADM] },
      { href: "/inbox", label: "Notifications", icon: Bell, sidebar: [WH, OPS, ADM] },
    ],
  },
  {
    title: "Marketplace (mock)",
    items: [{ href: "/capacity", label: "Capacity Marketplace", icon: Layers, sidebar: [OPS, ADM] }],
  },
];

export function hasAnyRole(roles: Role[], allowed: readonly Role[]): boolean {
  return roles.some((r) => allowed.includes(r));
}

export function navForRoles(roles: Role[]): NavSection[] {
  return CORE_NAV.map((s) => ({ ...s, items: s.items.filter((i) => hasAnyRole(roles, i.sidebar)) })).filter((s) => s.items.length > 0);
}

/** First page a user lands on after login. */
export function landingRoute(roles: Role[]): string {
  const first = navForRoles(roles)[0]?.items[0];
  return first?.href || "/inbox";
}

/** Legacy routes disabled in core mode (§4.0): redirected to /dashboard. */
export const LEGACY_DISABLED_ROUTES = [
  "/orders", "/drivers", "/pricing", "/payments", "/notifications", "/cost-estimator", "/parcels", "/fleet", "/agents", "/customers", "/users",
];
