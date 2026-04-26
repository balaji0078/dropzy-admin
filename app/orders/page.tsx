"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { ordersAPI } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Download, Eye, XCircle, UserPlus } from "lucide-react";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Transit", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await ordersAPI.list(token, page, 20);
      const data = res.data?.orders || [];
      setOrders(data);
      setTotalPages(Math.ceil((res.data?.total || 0) / 20));
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.receiver_name?.toLowerCase().includes(q) ||
          o.pickup_address?.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(result);
  }, [orders, statusFilter, search]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!token) return;
    try {
      await ordersAPI.updateStatus(token, orderId, status);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert("Failed to update order status");
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!token || !confirm("Are you sure you want to cancel this order?")) return;
    try {
      await ordersAPI.cancel(token, orderId);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert("Failed to cancel order");
    }
  };

  const columns = [
    {
      key: "id",
      label: "Order ID",
      render: (order: any) => (
        <span className="font-mono text-xs text-gray-600">{order.id?.substring(0, 8)}...</span>
      ),
    },
    {
      key: "receiver_name",
      label: "Receiver",
      render: (order: any) => (
        <div>
          <p className="font-medium text-gray-900">{order.receiver_name}</p>
          <p className="text-xs text-gray-500">{order.receiver_phone}</p>
        </div>
      ),
    },
    {
      key: "pickup_address",
      label: "Pickup",
      render: (order: any) => (
        <span className="text-gray-600 truncate max-w-[180px] block">
          {order.pickup_address}
        </span>
      ),
    },
    {
      key: "delivery_address",
      label: "Delivery",
      render: (order: any) => (
        <span className="text-gray-600 truncate max-w-[180px] block">
          {order.delivery_address}
        </span>
      ),
    },
    {
      key: "vehicle_type",
      label: "Vehicle",
      render: (order: any) => (
        <span className="capitalize text-gray-600">{order.vehicle_type}</span>
      ),
    },
    {
      key: "total_amount",
      label: "Amount",
      render: (order: any) => (
        <span className="font-semibold">{formatCurrency(order.total_amount || 0)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (order: any) => <StatusBadge status={order.status} />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (order: any) => (
        <span className="text-gray-500 text-xs">{formatDateTime(order.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-gray-900">All Orders</h2>
          <p className="text-[13px] text-gray-500">{orders.length} total orders</p>
        </div>
        <button className="rb-btn rb-btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input pl-10 pr-4 py-2 w-64 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedOrder}
        emptyMessage="No orders found. They will appear here when customers place orders."
      />

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Order ID</p>
                <p className="text-sm font-mono mt-1">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Receiver</p>
                <p className="text-sm mt-1">
                  {selectedOrder.receiver_name} ({selectedOrder.receiver_phone})
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Vehicle</p>
                <p className="text-sm mt-1 capitalize">{selectedOrder.vehicle_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Pickup</p>
                <p className="text-sm mt-1">{selectedOrder.pickup_address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Delivery</p>
                <p className="text-sm mt-1">{selectedOrder.delivery_address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Amount</p>
                <p className="text-sm font-semibold mt-1">
                  {formatCurrency(selectedOrder.total_amount || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Package</p>
                <p className="text-sm mt-1">
                  {selectedOrder.package_type} &middot; {selectedOrder.package_weight}kg
                </p>
              </div>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Notes</p>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedOrder.status === "pending" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "confirmed")}
                  className="rb-btn rb-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Confirm & Assign Driver
                </button>
              )}
              {["pending", "confirmed"].includes(selectedOrder.status) && (
                <button
                  onClick={() => handleCancel(selectedOrder.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
