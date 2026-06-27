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
import { useToast } from "@/components/ui/Toast";

// redBus color palette
const RB_COLORS = {
  blue: "#D82C2C",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  indigo: "#D82C2C",
  lightGreen: "#30D158",
};

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
  const toast = useToast();
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
      toast("Refund issued successfully");
    } catch (err) {
      toast("Failed to process refund", "error");
    }
  };

  const columns = [
    {
      key: "transaction_id",
      label: "Transaction ID",
      render: (p: any) => <span className="font-mono text-[12px] font-medium">{p.transaction_id}</span>,
    },
    {
      key: "order_id",
      label: "Order",
      render: (p: any) => (
        <span className="font-mono text-[12px] opacity-70">{p.order_id}</span>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      render: (p: any) => <span className="text-[13px] font-medium">{p.customer_name}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      render: (p: any) => (
        <span className="text-[13px] font-semibold" style={{ color: RB_COLORS.green }}>
          {formatCurrency(p.amount, p.currency)}
        </span>
      ),
    },
    {
      key: "method",
      label: "Method",
      render: (p: any) => (
        <span className="capitalize flex items-center gap-1.5 text-[13px]">
          <CreditCard className="w-4 h-4" style={{ color: RB_COLORS.blue, opacity: 0.6 }} />
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
      render: (p: any) => <span className="text-[12px] opacity-70">{formatDateTime(p.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Revenue Cards with Apple Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Today's Revenue"
          value={formatCurrency(54200)}
          change={8.7}
          icon={DollarSign}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          gradient={`linear-gradient(135deg, ${RB_COLORS.green}, ${RB_COLORS.lightGreen})`}
        />
        <StatsCard
          title="Weekly Revenue"
          value={formatCurrency(386800)}
          change={12.3}
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          gradient={`linear-gradient(135deg, #D82C2C, #D82C2C)`}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(1542000)}
          change={5.1}
          icon={CreditCard}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          gradient={`linear-gradient(135deg, #D82C2C, #7C3AED)`}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FilterTabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "#D82C2C" }}
          />
          <input
            type="text"
            placeholder="Search transaction, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rb-input pl-10 pr-4 py-2.5 w-64 rounded-xl text-[13px] focus:outline-none focus:ring-2 transition-all"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} onRowClick={(p) => { setSelected(p); }} emptyMessage="No payments found." />

      {/* Payment Detail + Refund Modal */}
      <Modal open={!!selected && !refundModal} onClose={() => setSelected(null)} title="Payment Details">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rb-card-flat p-3 rounded-xl">
                <p className="text-[13px] text-gray-500 uppercase text-[11px] tracking-wide">Transaction ID</p>
                <p className="text-[13px] font-mono font-medium mt-1.5">{selected.transaction_id}</p>
              </div>
              <div className="rb-card-flat p-3 rounded-xl">
                <p className="text-[13px] text-gray-500 uppercase text-[11px] tracking-wide">Status</p>
                <div className="mt-1.5"><StatusBadge status={selected.status} /></div>
              </div>
              <div className="rb-card-flat p-3 rounded-xl">
                <p className="text-[13px] text-gray-500 uppercase text-[11px] tracking-wide">Amount</p>
                <p className="text-[13px] font-semibold mt-1.5" style={{ color: RB_COLORS.green }}>
                  {formatCurrency(selected.amount)}
                </p>
              </div>
              <div className="rb-card-flat p-3 rounded-xl">
                <p className="text-[13px] text-gray-500 uppercase text-[11px] tracking-wide">Method</p>
                <p className="text-[13px] capitalize font-medium mt-1.5">{selected.method}</p>
              </div>
            </div>
            {selected.status === "completed" && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setRefundAmount(String(selected.amount)); setRefundModal(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium rounded-xl transition-all"
                  style={{
                    backgroundColor: `${RB_COLORS.red}15`,
                    color: RB_COLORS.red,
                    border: `1px solid rgba(${parseInt(RB_COLORS.red.slice(1, 3), 16)}, ${parseInt(RB_COLORS.red.slice(3, 5), 16)}, ${parseInt(RB_COLORS.red.slice(5, 7), 16)}, 0.2)`,
                  }}
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
            <label className="block text-[13px] font-semibold mb-2">Refund Amount</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="rb-input w-full px-4 py-2.5 rounded-xl text-[13px] focus:outline-none focus:ring-2 transition-all"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-2">Reason</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={3}
              className="rb-input w-full px-4 py-2.5 rounded-xl text-[13px] focus:outline-none focus:ring-2 transition-all"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
              placeholder="Customer requested cancellation..."
            />
          </div>
          <button
            onClick={handleRefund}
            className="rb-btn rb-btn-primary w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              backgroundColor: RB_COLORS.red,
              color: "white",
            }}
          >
            Confirm Refund
          </button>
        </div>
      </Modal>
    </div>
  );
}
