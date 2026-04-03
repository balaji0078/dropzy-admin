"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { paymentsAPI } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import FilterTabs from "@/components/ui/FilterTabs";
import StatsCard from "@/components/ui/StatsCard";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, CreditCard, TrendingUp, DollarSign, RefreshCcw, RotateCcw } from "lucide-react";

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

// Sample data — replace with real API calls
const samplePayments = [
  {
    id: "pay-001",
    transaction_id: "TXN-20260402150405-a1b2c3d4",
    order_id: "ord-001",
    customer_name: "John Doe",
    amount: 450,
    currency: "INR",
    method: "card",
    status: "completed",
    created_at: "2026-04-02T14:30:00Z",
  },
  {
    id: "pay-002",
    transaction_id: "TXN-20260402151020-e5f6g7h8",
    order_id: "ord-002",
    customer_name: "Jane Smith",
    amount: 320,
    currency: "INR",
    method: "wallet",
    status: "completed",
    created_at: "2026-04-02T15:10:00Z",
  },
  {
    id: "pay-003",
    transaction_id: "TXN-20260402160500-i9j0k1l2",
    order_id: "ord-003",
    customer_name: "Ravi Kumar",
    amount: 780,
    currency: "INR",
    method: "card",
    status: "pending",
    created_at: "2026-04-02T16:05:00Z",
  },
];

export default function PaymentsPage() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const filtered = samplePayments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.transaction_id.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        p.order_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRefund = async () => {
    if (!token || !selected) return;
    try {
      await paymentsAPI.refund(token, selected.id, parseFloat(refundAmount), refundReason);
      setRefundModal(false);
      setSelected(null);
      alert("Refund issued successfully");
    } catch (err) {
      alert("Failed to process refund");
    }
  };

  const columns = [
    {
      key: "transaction_id",
      label: "Transaction ID",
      render: (p: any) => <span className="font-mono text-xs">{p.transaction_id}</span>,
    },
    {
      key: "order_id",
      label: "Order",
      render: (p: any) => <span className="font-mono text-xs text-gray-600">{p.order_id}</span>,
    },
    { key: "customer_name", label: "Customer" },
    {
      key: "amount",
      label: "Amount",
      render: (p: any) => (
        <span className="font-semibold">{formatCurrency(p.amount, p.currency)}</span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (p: any) => (
        <span className="capitalize flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
          {p.method}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p: any) => <StatusBadge status={p.status} />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (p: any) => <span className="text-gray-500 text-xs">{formatDateTime(p.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Today's Revenue" value={formatCurrency(54200)} change={8.7} icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatsCard title="Weekly Revenue" value={formatCurrency(386800)} change={12.3} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatsCard title="Monthly Revenue" value={formatCurrency(1542000)} change={5.1} icon={CreditCard} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transaction, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={(p) => { setSelected(p); }} emptyMessage="No payments found." />

      {/* Payment Detail + Refund Modal */}
      <Modal open={!!selected && !refundModal} onClose={() => setSelected(null)} title="Payment Details">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Transaction ID</p>
                <p className="text-sm font-mono mt-1">{selected.transaction_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <div className="mt-1"><StatusBadge status={selected.status} /></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="text-sm font-semibold mt-1">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Method</p>
                <p className="text-sm capitalize mt-1">{selected.method}</p>
              </div>
            </div>
            {selected.status === "completed" && (
              <div className="pt-4 border-t">
                <button
                  onClick={() => { setRefundAmount(String(selected.amount)); setRefundModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  <RotateCcw className="w-4 h-4" /> Issue Refund
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Refund Form Modal */}
      <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Issue Refund" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="Customer requested cancellation..."
            />
          </div>
          <button
            onClick={handleRefund}
            className="w-full py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Confirm Refund
          </button>
        </div>
      </Modal>
    </div>
  );
}
