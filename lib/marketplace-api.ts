// ---------------------------------------------------------------------------
// Marketplace API layer (PRD modules: Operators, Shipments, Capacity,
// Settlements, Support, Users & Roles).
//
// Today these endpoints don't exist on the backend, so MOCK=true serves an
// in-memory store (with latency + persisted mutations within the session).
// When the backend ships the routes from BACKEND_MARKETPLACE_MODULES_SPEC.md,
// set NEXT_PUBLIC_MARKETPLACE_LIVE=true and every call hits the real API.
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://18.60.129.43:8080/api/v1";
const MOCK = process.env.NEXT_PUBLIC_MARKETPLACE_LIVE !== "true";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

async function request<T>(endpoint: string, opts: { method?: string; body?: any; token?: string } = {}): Promise<T> {
  const { method = "GET", body, token } = opts;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

// ───────────────────────── in-memory mock stores ─────────────────────────
let operators = [
  { id: "op1", name: "Easyride", gst_number: "33AABCE1234F1Z5", city: "Chennai", buses: 64, routes: 22, rating: 4.8, on_time_pct: 96, status: "approved" },
  { id: "op2", name: "KPN Travels", gst_number: "33AABCK5678G1Z2", city: "Madurai", buses: 120, routes: 40, rating: 4.5, on_time_pct: 92, status: "approved" },
  { id: "op3", name: "Orange Tours", gst_number: "29AABCO9012H1Z9", city: "Bangalore", buses: 85, routes: 31, rating: 4.2, on_time_pct: 88, status: "approved" },
  { id: "op4", name: "National Travels", gst_number: "33AABCN3456J1Z1", city: "Coimbatore", buses: 40, routes: 12, rating: 0, on_time_pct: 0, status: "kyc_review" },
  { id: "op5", name: "SRS Travels", gst_number: "29AABCS7890K1Z7", city: "Bangalore", buses: 55, routes: 18, rating: 0, on_time_pct: 0, status: "pending" },
];
let shipments = [
  { id: "s1", dcn: "DCN-CHE-BLR-2026-000123", route: "Chennai → Bangalore", operator: "Easyride", declared_kg: 2, actual_kg: 2.5, fare: 240, status: "in_transit" },
  { id: "s2", dcn: "DCN-CHE-MDU-2026-000118", route: "Chennai → Madurai", operator: "KPN Travels", declared_kg: 1, actual_kg: 1, fare: 150, status: "delivered" },
  { id: "s3", dcn: "DCN-BLR-CHE-2026-000090", route: "Bangalore → Chennai", operator: "Orange Tours", declared_kg: 5, actual_kg: 6.3, fare: 410, status: "warehouse_hold" },
  { id: "s4", dcn: "DCN-CHE-CBE-2026-000131", route: "Chennai → Coimbatore", operator: "Easyride", declared_kg: 3, actual_kg: 3, fare: 220, status: "booking_confirmed" },
];
let capacity = [
  { id: "c1", operator: "Easyride", vehicle: "TN01AB1234", route: "CHE → BLR", departure: "21:00", total_kg: 300, booked_kg: 180, score: 92.4, state: "available" },
  { id: "c2", operator: "KPN Travels", vehicle: "TN05CD5678", route: "CHE → MDU", departure: "22:30", total_kg: 250, booked_kg: 250, score: 88.1, state: "allocated" },
  { id: "c3", operator: "Orange Tours", vehicle: "KA09EF9012", route: "BLR → CHE", departure: "20:15", total_kg: 350, booked_kg: 120, score: 95.0, state: "available" },
  { id: "c4", operator: "Easyride", vehicle: "TN01GH3456", route: "CHE → CBE", departure: "23:00", total_kg: 200, booked_kg: 60, score: 79.3, state: "reserved" },
];
let settlements = [
  { id: "st1", operator: "Easyride", period: "Jun 1 – Jun 7", revenue: 45000, commission: 4500, gateway_fee: 900, payout: 39600, status: "paid" },
  { id: "st2", operator: "KPN Travels", period: "Jun 1 – Jun 7", revenue: 57000, commission: 5700, gateway_fee: 1140, payout: 50160, status: "approved" },
  { id: "st3", operator: "Orange Tours", period: "Jun 1 – Jun 7", revenue: 33000, commission: 3300, gateway_fee: 660, payout: 29040, status: "generated" },
];
let tickets = [
  { id: "TKT-3001", dcn: "DCN-CHE-BLR-2026-000123", customer: "Arjun", category: "Delay", priority: "high", assignee: "Support A", status: "investigating" },
  { id: "TKT-3002", dcn: "DCN-CHE-MDU-2026-000118", customer: "Priya", category: "Damage", priority: "high", assignee: "Support B", status: "assigned" },
  { id: "TKT-3003", dcn: "DCN-BLR-CHE-2026-000090", customer: "Rahul", category: "Refund", priority: "medium", assignee: "Unassigned", status: "open" },
  { id: "TKT-3004", dcn: "DCN-CHE-CBE-2026-000131", customer: "Meena", category: "Payment Issue", priority: "low", assignee: "Support A", status: "resolved" },
];
let users = [
  { id: "u1", name: "Balaji E", email: "easyridesouth@gmail.com", role: "super_admin", status: "active", last_active: "2026-06-27" },
  { id: "u2", name: "Ops Manager", email: "ops@dropzy.in", role: "operations_manager", status: "active", last_active: "2026-06-26" },
  { id: "u3", name: "Finance Lead", email: "finance@dropzy.in", role: "finance_manager", status: "active", last_active: "2026-06-25" },
  { id: "u4", name: "Support A", email: "support.a@dropzy.in", role: "support_agent", status: "active", last_active: "2026-06-27" },
  { id: "u5", name: "Easyride Admin", email: "admin@easyride.in", role: "operator_admin", status: "suspended", last_active: "2026-06-24" },
];

// ───────────────────────────── Operators ─────────────────────────────
export const operatorsAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...operators]; } return request<any[]>("/operators", { token }); },
  create: async (token: string, data: any) => {
    if (MOCK) { await delay(); const o = { id: `op${Date.now()}`, rating: 0, on_time_pct: 0, status: "pending", ...data }; operators = [o, ...operators]; return o; }
    return request<any>("/operators", { method: "POST", body: data, token });
  },
  setStatus: async (token: string, id: string, status: string) => {
    if (MOCK) { await delay(); operators = operators.map((o) => (o.id === id ? { ...o, status } : o)); return operators.find((o) => o.id === id); }
    const path = status === "approved" ? "approve" : "suspend";
    return request<any>(`/operators/${id}/${path}`, { method: "POST", token });
  },
};

// ───────────────────────────── Shipments ─────────────────────────────
export const shipmentsAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...shipments]; } return request<any[]>("/shipments", { token }); },
  updateStatus: async (token: string, id: string, status: string) => {
    if (MOCK) { await delay(); shipments = shipments.map((s) => (s.id === id ? { ...s, status } : s)); return shipments.find((s) => s.id === id); }
    return request<any>(`/shipments/${id}/status`, { method: "PATCH", body: { status }, token });
  },
  cancel: async (token: string, id: string) => {
    if (MOCK) { await delay(); shipments = shipments.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)); return shipments.find((s) => s.id === id); }
    return request<any>(`/shipments/${id}/cancel`, { method: "POST", token });
  },
};

// ───────────────────────────── Capacity ─────────────────────────────
export const capacityAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...capacity]; } return request<any[]>("/capacity", { token }); },
  reserve: async (token: string, id: string) => {
    if (MOCK) { await delay(); capacity = capacity.map((c) => (c.id === id ? { ...c, state: "reserved" } : c)); return capacity.find((c) => c.id === id); }
    return request<any>("/capacity/reserve", { method: "POST", body: { id }, token });
  },
  allocate: async (token: string, id: string) => {
    if (MOCK) { await delay(); capacity = capacity.map((c) => (c.id === id ? { ...c, state: "allocated" } : c)); return capacity.find((c) => c.id === id); }
    return request<any>("/capacity/allocate", { method: "POST", body: { id }, token });
  },
};

// ──────────────────────────── Settlements ────────────────────────────
export const settlementsAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...settlements]; } return request<any[]>("/settlements", { token }); },
  approve: async (token: string, id: string) => {
    if (MOCK) { await delay(); settlements = settlements.map((s) => (s.id === id ? { ...s, status: "approved" } : s)); return settlements.find((s) => s.id === id); }
    return request<any>(`/settlements/${id}/approve`, { method: "POST", token });
  },
  release: async (token: string, id: string) => {
    if (MOCK) { await delay(); settlements = settlements.map((s) => (s.id === id ? { ...s, status: "paid" } : s)); return settlements.find((s) => s.id === id); }
    return request<any>(`/settlements/${id}/release`, { method: "POST", token });
  },
};

// ────────────────────────────── Support ──────────────────────────────
export const supportAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...tickets]; } return request<any[]>("/support/tickets", { token }); },
  setStatus: async (token: string, id: string, status: string, assignee?: string) => {
    if (MOCK) { await delay(); tickets = tickets.map((t) => (t.id === id ? { ...t, status, ...(assignee ? { assignee } : {}) } : t)); return tickets.find((t) => t.id === id); }
    return request<any>(`/support/tickets/${id}`, { method: "PATCH", body: { status, assignee }, token });
  },
};

// ───────────────────────────── Users & Roles ─────────────────────────
export const rolesAPI = {
  list: async (token?: string) => { if (MOCK) { await delay(); return [...users]; } return request<any[]>("/users", { token }); },
  create: async (token: string, data: any) => {
    if (MOCK) { await delay(); const u = { id: `u${Date.now()}`, status: "active", last_active: new Date().toISOString().slice(0, 10), ...data }; users = [u, ...users]; return u; }
    return request<any>("/users", { method: "POST", body: data, token });
  },
  setStatus: async (token: string, id: string, status: string) => {
    if (MOCK) { await delay(); users = users.map((u) => (u.id === id ? { ...u, status } : u)); return users.find((u) => u.id === id); }
    return request<any>(`/users/${id}/status`, { method: "PATCH", body: { status }, token });
  },
};
