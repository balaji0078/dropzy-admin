"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { pricingAPI } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import FilterTabs from "@/components/ui/FilterTabs";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { Plus, Calculator, Edit, Truck } from "lucide-react";

const vehicleTabs = [
  { label: "All", value: "all" },
  { label: "Bike", value: "bike" },
  { label: "Auto", value: "auto" },
  { label: "Car", value: "car" },
  { label: "Van", value: "van" },
  { label: "Truck", value: "truck" },
];

export default function PricingPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [editRule, setEditRule] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimateResult, setEstimateResult] = useState<any>(null);
  const [estimateForm, setEstimateForm] = useState({
    vehicle_type: "bike",
    distance_km: 5,
    weight_kg: 1,
  });
  const [createForm, setCreateForm] = useState({
    vehicle_type: "bike",
    base_price: 30,
    price_per_km: 10,
    price_per_kg: 5,
    min_price: 30,
    max_price: 500,
    currency: "INR",
    effective_from: new Date().toISOString(),
  });

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    pricingAPI
      .getRules(token)
      .then((res) => setRules(res.data?.rules || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = vehicleFilter === "all" ? rules : rules.filter((r) => r.vehicle_type === vehicleFilter);

  const handleEstimate = async () => {
    try {
      const res = await pricingAPI.getEstimate(estimateForm);
      setEstimateResult(res.data);
    } catch (err) {
      alert("Failed to get estimate");
    }
  };

  const handleCreateRule = async () => {
    if (!token) return;
    try {
      await pricingAPI.createRule(token, createForm);
      setShowCreate(false);
      // Refresh
      const res = await pricingAPI.getRules(token);
      setRules(res.data?.rules || res.data || []);
    } catch (err) {
      alert("Failed to create rule");
    }
  };

  const columns = [
    {
      key: "vehicle_type",
      label: "Vehicle",
      render: (r: any) => (
        <span className="capitalize flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" /> {r.vehicle_type}
        </span>
      ),
    },
    {
      key: "base_price",
      label: "Base Price",
      render: (r: any) => formatCurrency(r.base_price),
    },
    {
      key: "price_per_km",
      label: "Per Km",
      render: (r: any) => formatCurrency(r.price_per_km),
    },
    {
      key: "price_per_kg",
      label: "Per Kg",
      render: (r: any) => formatCurrency(r.price_per_kg),
    },
    {
      key: "min_price",
      label: "Min",
      render: (r: any) => formatCurrency(r.min_price),
    },
    {
      key: "max_price",
      label: "Max",
      render: (r: any) => formatCurrency(r.max_price || 0),
    },
    {
      key: "currency",
      label: "Currency",
    },
    {
      key: "is_active",
      label: "Active",
      render: (r: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_active !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
          {r.is_active !== false ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Pricing Rules</h2>
          <p className="section-subtitle">Manage delivery pricing per vehicle type</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowEstimate(true)} className="apple-btn apple-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Calculator className="w-4 h-4" /> Test Estimate
          </button>
          <button onClick={() => setShowCreate(true)} className="apple-btn apple-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      <FilterTabs tabs={vehicleTabs} activeTab={vehicleFilter} onChange={setVehicleFilter} />

      <DataTable columns={columns} data={filtered} loading={loading} onRowClick={setEditRule} emptyMessage="No pricing rules. Add one to get started." />

      {/* Create Rule Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Pricing Rule">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select value={createForm.vehicle_type} onChange={(e) => setCreateForm({ ...createForm, vehicle_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm">
              {["bike", "auto", "car", "mini", "van", "truck"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          {["base_price", "price_per_km", "price_per_kg", "min_price", "max_price"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace(/_/g, " ")}</label>
              <input type="number" value={(createForm as any)[field]} onChange={(e) => setCreateForm({ ...createForm, [field]: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          ))}
          <button onClick={handleCreateRule} className="apple-btn apple-btn-primary w-full py-2.5 rounded-xl text-sm font-medium">Create Rule</button>
        </div>
      </Modal>

      {/* Estimate Modal */}
      <Modal open={showEstimate} onClose={() => { setShowEstimate(false); setEstimateResult(null); }} title="Price Estimate Tester">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select value={estimateForm.vehicle_type} onChange={(e) => setEstimateForm({ ...estimateForm, vehicle_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm">
              {["bike", "auto", "car", "mini", "van", "truck"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input type="number" value={estimateForm.distance_km} onChange={(e) => setEstimateForm({ ...estimateForm, distance_km: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" value={estimateForm.weight_kg} onChange={(e) => setEstimateForm({ ...estimateForm, weight_kg: parseFloat(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <button onClick={handleEstimate} className="apple-btn apple-btn-primary w-full py-2.5 rounded-xl text-sm font-medium">Calculate</button>

          {estimateResult && (
            <div className="glass-card-static rounded-xl p-4 space-y-2 mt-4">
              <div className="flex justify-between text-sm"><span>Base Price</span><span>{formatCurrency(estimateResult.base_price)}</span></div>
              <div className="flex justify-between text-sm"><span>Distance ({estimateResult.distance_km} km)</span><span>{formatCurrency(estimateResult.distance_price)}</span></div>
              <div className="flex justify-between text-sm"><span>Weight ({estimateResult.weight_kg} kg)</span><span>{formatCurrency(estimateResult.weight_price)}</span></div>
              {estimateResult.surge_price > 0 && (
                <div className="flex justify-between text-sm text-orange-600"><span>Surge ({estimateResult.surge_multiplier}x)</span><span>{formatCurrency(estimateResult.surge_price)}</span></div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 mt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <span>Total</span>
                <span className="text-[#007AFF]">{formatCurrency(estimateResult.total_price)}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
