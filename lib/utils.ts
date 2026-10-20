import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    confirmed: "bg-info/15 text-info",
    picked_up: "bg-info/15 text-info",
    in_transit: "bg-purple-400/15 text-purple-400",
    delivered: "bg-success/15 text-success",
    cancelled: "bg-danger/15 text-danger",
    available: "bg-success/15 text-success",
    on_duty: "bg-info/15 text-info",
    unavailable: "bg-surface-alt text-ink",
    completed: "bg-success/15 text-success",
    failed: "bg-danger/15 text-danger",
    refunded: "bg-purple-400/15 text-purple-400",
    active: "bg-success/15 text-success",
    inactive: "bg-surface-alt text-ink",
    booked: "bg-info/15 text-info",
    accepted: "bg-cyan-400/15 text-cyan-400",
    arrived_at_office: "bg-info/15 text-info",
    ready_for_pickup: "bg-warning/15 text-warning",
    idle: "bg-surface-alt text-ink",
    maintenance: "bg-orange-400/15 text-orange-400",
  };
  return colors[status] || "bg-surface-alt text-ink";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}
