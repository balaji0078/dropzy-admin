"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { notificationsAPI } from "@/lib/api";
import FilterTabs from "@/components/ui/FilterTabs";
import { formatDateTime } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Package,
  CreditCard,
  AlertTriangle,
  Truck,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
} from "lucide-react";

const typeTabs = [
  { label: "All", value: "all" },
  { label: "Orders", value: "order" },
  { label: "Payments", value: "payment" },
  { label: "System", value: "system" },
  { label: "Drivers", value: "driver" },
];

const typeIcons: Record<string, any> = {
  order_created: Package,
  order_assigned: Truck,
  order_delivered: Package,
  order_cancelled: Package,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  system_alert: AlertTriangle,
  default: Bell,
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    title: "",
    message: "",
    channel: "push",
    recipients: "all",
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    Promise.all([
      notificationsAPI.list(token, 1, 50),
      notificationsAPI.unreadCount(token),
    ])
      .then(([listRes, countRes]) => {
        setNotifications(listRes.data?.notifications || []);
        setUnreadCount(countRes.data?.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await notificationsAPI.markRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    for (const n of notifications.filter((n) => !n.is_read)) {
      await notificationsAPI.markRead(token, n.id).catch(() => {});
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const filtered =
    typeFilter === "all"
      ? notifications
      : notifications.filter((n) => n.type?.startsWith(typeFilter));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>
          </div>
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            <Send className="w-4 h-4" /> Compose
          </button>
        </div>
      </div>

      <FilterTabs tabs={typeTabs} activeTab={typeFilter} onChange={setTypeFilter} />

      {/* Compose Panel */}
      {showCompose && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Send Notification</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={composeForm.title}
                onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                placeholder="Notification title"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
              <select
                value={composeForm.recipients}
                onChange={(e) => setComposeForm({ ...composeForm, recipients: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="all">All Users</option>
                <option value="customers">Customers Only</option>
                <option value="drivers">Drivers Only</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={composeForm.message}
              onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
              rows={3}
              placeholder="Type your notification message..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-3">
              {[
                { value: "push", label: "Push", icon: Smartphone },
                { value: "email", label: "Email", icon: Mail },
                { value: "sms", label: "SMS", icon: MessageSquare },
              ].map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setComposeForm({ ...composeForm, channel: ch.value })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    composeForm.channel === ch.value
                      ? "bg-brand-50 border-brand-300 text-brand-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ch.icon className="w-4 h-4" /> {ch.label}
                </button>
              ))}
            </div>
          </div>
          <button className="px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
            Send Notification
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">
              Notifications will appear here when order/payment events are triggered.
              Currently no triggers are wired — see the notification service TODO.
            </p>
          </div>
        ) : (
          filtered.map((n) => {
            const Icon = typeIcons[n.type] || typeIcons.default;
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  !n.is_read ? "bg-blue-50/50" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    !n.is_read ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
