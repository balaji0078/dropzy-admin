"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  MessageCircle,
  Phone,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  MessageSquare,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

// Mock notification logs
const mockNotifications = [
  { id: 1, timestamp: "2026-04-26T14:52:00", channel: "whatsapp", recipient_name: "Rajesh Kumar", recipient_phone: "+91-98765-43210", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987654", message: "Your booking has been confirmed. Tracking ID: DZ-987654. Driver will arrive in 15 minutes.", read_receipt: "2026-04-26T14:53:00" },
  { id: 2, timestamp: "2026-04-26T14:50:00", channel: "sms", recipient_name: "Priya Sharma", recipient_phone: "+91-97654-32109", template: "Driver Accepted", status: "delivered", parcel_id: "DZ-987653", message: "Your package is on its way! Driver Priya Sharma accepted your delivery. ETA: 20 mins.", read_receipt: "2026-04-26T14:51:00" },
  { id: 3, timestamp: "2026-04-26T14:48:00", channel: "whatsapp", recipient_name: "Amit Patel", recipient_phone: "+91-96543-21098", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987652", message: "Your package is in transit. Current location: Delhi Karol Bagh. Delivery expected by 6 PM.", read_receipt: "2026-04-26T14:49:00" },
  { id: 4, timestamp: "2026-04-26T14:45:00", channel: "sms", recipient_name: "Neha Gupta", recipient_phone: "+91-95432-10987", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987651", message: "Your package has arrived at Bangalore Koramangala office. Ready for pickup.", read_receipt: "2026-04-26T14:46:00" },
  { id: 5, timestamp: "2026-04-26T14:42:00", channel: "whatsapp", recipient_name: "Suresh Singh", recipient_phone: "+91-94321-09876", template: "Ready for Pickup", status: "delivered", parcel_id: "DZ-987650", message: "Your package is ready for pickup at Chennai T Nagar office. Available until 8 PM.", read_receipt: "2026-04-26T14:43:00" },
  { id: 6, timestamp: "2026-04-26T14:40:00", channel: "sms", recipient_name: "Pooja Verma", recipient_phone: "+91-93210-98765", template: "Delivered", status: "delivered", parcel_id: "DZ-987649", message: "Your package has been delivered! Thank you for choosing Dropzy. Rate your experience.", read_receipt: "2026-04-26T14:41:00" },
  { id: 7, timestamp: "2026-04-26T14:38:00", channel: "whatsapp", recipient_name: "Vikram Reddy", recipient_phone: "+91-92109-87654", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987648", message: "Booking confirmed! Your order ID: DZ-987648. We'll pick up your package within 2 hours.", read_receipt: "2026-04-26T14:39:00" },
  { id: 8, timestamp: "2026-04-26T14:35:00", channel: "sms", recipient_name: "Divya Nair", recipient_phone: "+91-91098-76543", template: "Driver Accepted", status: "pending", parcel_id: "DZ-987647", message: "Driver Divya Nair has accepted your delivery. Arriving soon...", read_receipt: null },
  { id: 9, timestamp: "2026-04-26T14:32:00", channel: "whatsapp", recipient_name: "Arun Kumar", recipient_phone: "+91-90987-65432", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987646", message: "Your parcel is on the way! ETA 30 minutes to Hyderabad Ameerpet office.", read_receipt: "2026-04-26T14:33:00" },
  { id: 10, timestamp: "2026-04-26T14:30:00", channel: "sms", recipient_name: "Sneha Das", recipient_phone: "+91-89876-54321", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987645", message: "Package arrived at Mumbai Andheri hub. Ready for local delivery.", read_receipt: "2026-04-26T14:31:00" },
  { id: 11, timestamp: "2026-04-26T14:28:00", channel: "whatsapp", recipient_name: "Rohan Joshi", recipient_phone: "+91-88765-43210", template: "Ready for Pickup", status: "delivered", parcel_id: "DZ-987644", message: "Your parcel is ready for pickup. Delhi Karol Bagh office. Open till 9 PM.", read_receipt: "2026-04-26T14:29:00" },
  { id: 12, timestamp: "2026-04-26T14:25:00", channel: "sms", recipient_name: "Anjali Singh", recipient_phone: "+91-87654-32109", template: "Delivered", status: "delivered", parcel_id: "DZ-987643", message: "Delivered successfully to Bangalore Koramangala. Delivery partner: Anjali Singh.", read_receipt: "2026-04-26T14:26:00" },
  { id: 13, timestamp: "2026-04-26T14:22:00", channel: "whatsapp", recipient_name: "Karan Malhotra", recipient_phone: "+91-86543-21098", template: "Booking Confirmation", status: "failed", parcel_id: "DZ-987642", message: null, read_receipt: null },
  { id: 14, timestamp: "2026-04-26T14:20:00", channel: "sms", recipient_name: "Maya Reddy", recipient_phone: "+91-85432-10987", template: "Driver Accepted", status: "delivered", parcel_id: "DZ-987641", message: "Driver assigned: Maya Reddy. Will reach in 25 minutes.", read_receipt: "2026-04-26T14:21:00" },
  { id: 15, timestamp: "2026-04-26T14:18:00", channel: "whatsapp", recipient_name: "Sanjay Gupta", recipient_phone: "+91-84321-09876", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987640", message: "En route to Kolkata Park Street. Delivery ETA: 4:45 PM.", read_receipt: "2026-04-26T14:19:00" },
  { id: 16, timestamp: "2026-04-26T14:15:00", channel: "sms", recipient_name: "Isha Patel", recipient_phone: "+91-83210-98765", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987639", message: "Package arrived at Ahmedabad Navrangpura. Will deliver by EOD.", read_receipt: "2026-04-26T14:16:00" },
  { id: 17, timestamp: "2026-04-26T14:12:00", channel: "whatsapp", recipient_name: "Deepak Rao", recipient_phone: "+91-82109-87654", template: "Ready for Pickup", status: "pending", parcel_id: "DZ-987638", message: "Your order is ready! Pick it up from Hyderabad Ameerpet.", read_receipt: null },
  { id: 18, timestamp: "2026-04-26T14:10:00", channel: "sms", recipient_name: "Ravi Verma", recipient_phone: "+91-81098-76543", template: "Delivered", status: "delivered", parcel_id: "DZ-987637", message: "Delivered to Mumbai Andheri. Signed by: Ravi Verma. Thank you!", read_receipt: "2026-04-26T14:11:00" },
  { id: 19, timestamp: "2026-04-26T14:08:00", channel: "whatsapp", recipient_name: "Sunita Desai", recipient_phone: "+91-80987-65432", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987636", message: "Order confirmed! Booking ID: DZ-987636. Pickup from Delhi Karol Bagh.", read_receipt: "2026-04-26T14:09:00" },
  { id: 20, timestamp: "2026-04-26T14:05:00", channel: "sms", recipient_name: "Vishal Kumar", recipient_phone: "+91-79876-54321", template: "Driver Accepted", status: "failed", parcel_id: "DZ-987635", message: null, read_receipt: null },
  { id: 21, timestamp: "2026-04-26T14:02:00", channel: "whatsapp", recipient_name: "Rajesh Kumar", recipient_phone: "+91-98765-43210", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987634", message: "Package in transit. Live tracking available at dropzy.app/track", read_receipt: "2026-04-26T14:03:00" },
  { id: 22, timestamp: "2026-04-26T13:59:00", channel: "sms", recipient_name: "Priya Sharma", recipient_phone: "+91-97654-32109", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987633", message: "Package received at Mumbai Andheri. Local delivery in progress.", read_receipt: "2026-04-26T14:00:00" },
  { id: 23, timestamp: "2026-04-26T13:56:00", channel: "whatsapp", recipient_name: "Amit Patel", recipient_phone: "+91-96543-21098", template: "Ready for Pickup", status: "pending", parcel_id: "DZ-987632", message: "Ready for pickup at Delhi Karol Bagh. Contact: +91-96543-21098", read_receipt: null },
  { id: 24, timestamp: "2026-04-26T13:53:00", channel: "sms", recipient_name: "Neha Gupta", recipient_phone: "+91-95432-10987", template: "Delivered", status: "delivered", parcel_id: "DZ-987631", message: "Successfully delivered to Bangalore Koramangala. Feedback appreciated!", read_receipt: "2026-04-26T13:54:00" },
  { id: 25, timestamp: "2026-04-26T13:50:00", channel: "whatsapp", recipient_name: "Suresh Singh", recipient_phone: "+91-94321-09876", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987630", message: "Booking ID: DZ-987630 confirmed for Chennai T Nagar office.", read_receipt: "2026-04-26T13:51:00" },
  { id: 26, timestamp: "2026-04-26T13:47:00", channel: "sms", recipient_name: "Pooja Verma", recipient_phone: "+91-93210-98765", template: "Driver Accepted", status: "delivered", parcel_id: "DZ-987629", message: "Driver Pooja assigned. Will pickup from your location.", read_receipt: "2026-04-26T13:48:00" },
  { id: 27, timestamp: "2026-04-26T13:44:00", channel: "whatsapp", recipient_name: "Vikram Reddy", recipient_phone: "+91-92109-87654", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987628", message: "Moving towards delivery location. ETA: 5:30 PM", read_receipt: "2026-04-26T13:45:00" },
  { id: 28, timestamp: "2026-04-26T13:41:00", channel: "sms", recipient_name: "Divya Nair", recipient_phone: "+91-91098-76543", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987627", message: "At Ahmedabad Navrangpura office. Ready for delivery dispatch.", read_receipt: "2026-04-26T13:42:00" },
  { id: 29, timestamp: "2026-04-26T13:38:00", channel: "whatsapp", recipient_name: "Arun Kumar", recipient_phone: "+91-90987-65432", template: "Ready for Pickup", status: "failed", parcel_id: "DZ-987626", message: null, read_receipt: null },
  { id: 30, timestamp: "2026-04-26T13:35:00", channel: "sms", recipient_name: "Sneha Das", recipient_phone: "+91-89876-54321", template: "Delivered", status: "delivered", parcel_id: "DZ-987625", message: "Package delivered to Mumbai Andheri by Sneha Das. Thank you!", read_receipt: "2026-04-26T13:36:00" },
  { id: 31, timestamp: "2026-04-26T13:32:00", channel: "whatsapp", recipient_name: "Rohan Joshi", recipient_phone: "+91-88765-43210", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987624", message: "Order DZ-987624 booked successfully from Delhi Karol Bagh.", read_receipt: "2026-04-26T13:33:00" },
  { id: 32, timestamp: "2026-04-26T13:29:00", channel: "sms", recipient_name: "Anjali Singh", recipient_phone: "+91-87654-32109", template: "Driver Accepted", status: "delivered", parcel_id: "DZ-987623", message: "Driver Anjali Singh accepted. Pickup in 10 minutes from Bangalore.", read_receipt: "2026-04-26T13:30:00" },
  { id: 33, timestamp: "2026-04-26T13:26:00", channel: "whatsapp", recipient_name: "Karan Malhotra", recipient_phone: "+91-86543-21098", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987622", message: "In transit to Chennai T Nagar. Delivery by 6 PM.", read_receipt: "2026-04-26T13:27:00" },
  { id: 34, timestamp: "2026-04-26T13:23:00", channel: "sms", recipient_name: "Maya Reddy", recipient_phone: "+91-85432-10987", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987621", message: "Received at Pune Shivaji Nagar office for local delivery.", read_receipt: "2026-04-26T13:24:00" },
  { id: 35, timestamp: "2026-04-26T13:20:00", channel: "whatsapp", recipient_name: "Sanjay Gupta", recipient_phone: "+91-84321-09876", template: "Ready for Pickup", status: "delivered", parcel_id: "DZ-987620", message: "Package ready at Kolkata Park Street office. Open until 9 PM.", read_receipt: "2026-04-26T13:21:00" },
  { id: 36, timestamp: "2026-04-26T13:17:00", channel: "sms", recipient_name: "Isha Patel", recipient_phone: "+91-83210-98765", template: "Delivered", status: "delivered", parcel_id: "DZ-987619", message: "Delivered to Ahmedabad Navrangpura. Signed by delivery partner.", read_receipt: "2026-04-26T13:18:00" },
  { id: 37, timestamp: "2026-04-26T13:14:00", channel: "whatsapp", recipient_name: "Deepak Rao", recipient_phone: "+91-82109-87654", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987618", message: "Booking confirmed! DZ-987618 from Hyderabad Ameerpet office.", read_receipt: "2026-04-26T13:15:00" },
  { id: 38, timestamp: "2026-04-26T13:11:00", channel: "sms", recipient_name: "Ravi Verma", recipient_phone: "+91-81098-76543", template: "Driver Accepted", status: "pending", parcel_id: "DZ-987617", message: "Driver Ravi Verma assigned for your delivery.", read_receipt: null },
  { id: 39, timestamp: "2026-04-26T13:08:00", channel: "whatsapp", recipient_name: "Sunita Desai", recipient_phone: "+91-80987-65432", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987616", message: "On the way to Delhi Karol Bagh. 15 mins away.", read_receipt: "2026-04-26T13:09:00" },
  { id: 40, timestamp: "2026-04-26T13:05:00", channel: "sms", recipient_name: "Vishal Kumar", recipient_phone: "+91-79876-54321", template: "Arrived at Office", status: "delivered", parcel_id: "DZ-987615", message: "Package at Bangalore Koramangala hub. Processing for delivery.", read_receipt: "2026-04-26T13:06:00" },
  { id: 41, timestamp: "2026-04-26T13:02:00", channel: "whatsapp", recipient_name: "Rajesh Kumar", recipient_phone: "+91-98765-43210", template: "Ready for Pickup", status: "failed", parcel_id: "DZ-987614", message: null, read_receipt: null },
  { id: 42, timestamp: "2026-04-26T12:59:00", channel: "sms", recipient_name: "Priya Sharma", recipient_phone: "+91-97654-32109", template: "Delivered", status: "delivered", parcel_id: "DZ-987613", message: "Delivered to Mumbai Andheri successfully.", read_receipt: "2026-04-26T13:00:00" },
  { id: 43, timestamp: "2026-04-26T12:56:00", channel: "whatsapp", recipient_name: "Amit Patel", recipient_phone: "+91-96543-21098", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987612", message: "Your booking is confirmed! Order ID: DZ-987612", read_receipt: "2026-04-26T12:57:00" },
  { id: 44, timestamp: "2026-04-26T12:53:00", channel: "sms", recipient_name: "Neha Gupta", recipient_phone: "+91-95432-10987", template: "Driver Accepted", status: "delivered", parcel_id: "DZ-987611", message: "Driver accepted. Arriving to Bangalore Koramangala soon.", read_receipt: "2026-04-26T12:54:00" },
  { id: 45, timestamp: "2026-04-26T12:50:00", channel: "whatsapp", recipient_name: "Suresh Singh", recipient_phone: "+91-94321-09876", template: "In Transit Update", status: "delivered", parcel_id: "DZ-987610", message: "In transit. Real-time tracking: dropzy.app/track", read_receipt: "2026-04-26T12:51:00" },
  { id: 46, timestamp: "2026-04-26T12:47:00", channel: "sms", recipient_name: "Pooja Verma", recipient_phone: "+91-93210-98765", template: "Arrived at Office", status: "pending", parcel_id: "DZ-987609", message: "At Pune hub. Local delivery pending.", read_receipt: null },
  { id: 47, timestamp: "2026-04-26T12:44:00", channel: "whatsapp", recipient_name: "Vikram Reddy", recipient_phone: "+91-92109-87654", template: "Ready for Pickup", status: "delivered", parcel_id: "DZ-987608", message: "Ready to pickup from Kolkata Park Street office.", read_receipt: "2026-04-26T12:45:00" },
  { id: 48, timestamp: "2026-04-26T12:41:00", channel: "sms", recipient_name: "Divya Nair", recipient_phone: "+91-91098-76543", template: "Delivered", status: "delivered", parcel_id: "DZ-987607", message: "Delivered to Ahmedabad Navrangpura by agent.", read_receipt: "2026-04-26T12:42:00" },
  { id: 49, timestamp: "2026-04-26T12:38:00", channel: "whatsapp", recipient_name: "Arun Kumar", recipient_phone: "+91-90987-65432", template: "Booking Confirmation", status: "delivered", parcel_id: "DZ-987606", message: "Booking confirmed from Hyderabad Ameerpet office.", read_receipt: "2026-04-26T12:39:00" },
  { id: 50, timestamp: "2026-04-26T12:35:00", channel: "sms", recipient_name: "Sneha Das", recipient_phone: "+91-89876-54321", template: "Driver Accepted", status: "failed", parcel_id: "DZ-987605", message: null, read_receipt: null },
];

export default function NotificationLogsPage() {
  const { user, token } = useAuth();
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [search, setSearch] = useState("");
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const filteredNotifications = mockNotifications
    .filter((notif) => {
      if (filter === "sms") return notif.channel === "sms";
      if (filter === "whatsapp") return notif.channel === "whatsapp";
      if (filter === "failed") return notif.status === "failed";
      return true;
    })
    .filter((notif) => {
      const searchLower = search.toLowerCase();
      return (
        notif.recipient_name.toLowerCase().includes(searchLower) ||
        notif.recipient_phone.includes(search) ||
        notif.parcel_id.toLowerCase().includes(searchLower) ||
        notif.template.toLowerCase().includes(searchLower)
      );
    });

  const totalSent = mockNotifications.length;
  const smsSent = mockNotifications.filter((n) => n.channel === "sms").length;
  const whatsappSent = mockNotifications.filter((n) => n.channel === "whatsapp").length;
  const failedCount = mockNotifications.filter((n) => n.status === "failed").length;
  const deliveryRate = (
    ((totalSent - failedCount) / totalSent) *
    100
  ).toFixed(1);

  const templates = [
    "Booking Confirmation",
    "Driver Accepted",
    "In Transit Update",
    "Arrived at Office",
    "Ready for Pickup",
    "Delivered",
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Sent"
          value={totalSent.toLocaleString()}
          icon={MessageCircle}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="SMS Sent"
          value={smsSent.toLocaleString()}
          icon={Phone}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <StatsCard
          title="WhatsApp Sent"
          value={whatsappSent.toLocaleString()}
          icon={MessageSquare}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Failed"
          value={failedCount}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatsCard
          title="Delivery Rate"
          value={`${deliveryRate}%`}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Filter and Search */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, parcel ID, or template..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <FilterTabs
            tabs={[
              { label: "All", value: "all", count: mockNotifications.length },
              {
                label: "SMS",
                value: "sms",
                count: smsSent,
              },
              {
                label: "WhatsApp",
                value: "whatsapp",
                count: whatsappSent,
              },
              {
                label: "Failed",
                value: "failed",
                count: failedCount,
              },
            ]}
            activeTab={filter}
            onChange={setFilter}
          />

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="apple-input px-4 py-2 text-sm rounded-xl"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Parcel ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(notif.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {notif.channel === "whatsapp" ? (
                          <>
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            <span className="text-green-700 font-medium">WhatsApp</span>
                          </>
                        ) : (
                          <>
                            <Phone className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-700 font-medium">SMS</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{notif.recipient_name}</p>
                        <p className="text-xs text-gray-500">{notif.recipient_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {notif.template}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={notif.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {notif.parcel_id}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedNotification(notif);
                          setShowModal(true);
                        }}
                        className="apple-btn apple-btn-primary px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No notifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notification Details Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Notification Details"
        size="md"
      >
        {selectedNotification && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {selectedNotification.channel === "whatsapp" ? (
                    <>
                      <MessageSquare className="w-5 h-5 text-green-600" />
                      <p className="text-sm font-semibold text-gray-900">WhatsApp Message</p>
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-900">SMS Message</p>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formatDateTime(selectedNotification.timestamp)}
                </p>
              </div>
              <StatusBadge status={selectedNotification.status} />
            </div>

            {/* Recipient Info */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Recipient
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedNotification.recipient_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedNotification.recipient_phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Parcel & Template */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Message Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Template</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedNotification.template}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Parcel ID</span>
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {selectedNotification.parcel_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Content */}
            {selectedNotification.message && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Message Content
                </h3>
                <div className="p-4 glass-card-static rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Status */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Delivery Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Status</span>
                  <StatusBadge status={selectedNotification.status} />
                </div>
                {selectedNotification.read_receipt && (
                  <div className="flex items-center justify-between p-3 glass-card-static rounded-lg border-[#34C759]/20">
                    <span className="text-sm text-[#34C759] font-medium">Read Receipt</span>
                    <p className="text-xs text-[#34C759]">
                      {formatDateTime(selectedNotification.read_receipt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
