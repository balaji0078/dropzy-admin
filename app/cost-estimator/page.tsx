"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { ratesAPI } from "@/lib/api";
import {
  Globe,
  MapPin,
  Package,
  Weight,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  FileText,
  Pill,
  UtensilsCrossed,
  Cpu,
  Shirt,
  Gift,
  Briefcase,
  HelpCircle,
  DollarSign,
  Send,
  ArrowLeft,
  Truck,
  Shield,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───
type Mode = "international" | "domestic";

interface ShippingEstimate {
  base_price: number;
  gst: number;
  total_price: number;
  estimated_days: { min: number; max: number };
  service_type: string;
}

interface FormData {
  pickup_city: string;
  pickup_pincode: string;
  destination_country: string;
  destination_city: string;
  destination_pincode: string;
  package_type: string;
  package_type_custom: string;
  weight_kg: number;
  mobile: string;
  shipment_value: string;
}

// ─── Constants ───
const PACKAGE_TYPES = [
  { id: "DOCS", label: "DOCS", icon: FileText },
  { id: "PARCEL", label: "PARCEL", icon: Package },
  { id: "MEDS", label: "MEDS", icon: Pill, restricted: true },
  { id: "FOOD", label: "FOOD", icon: UtensilsCrossed, restricted: true },
  { id: "ELECT", label: "ELECT.", icon: Cpu },
  { id: "CLOTHES", label: "CLOTHES", icon: Shirt },
  { id: "RAKHI", label: "RAKHI", icon: Gift },
  { id: "EXCESS_BAG", label: "EXCESS BAG", icon: Briefcase },
  { id: "OTHER", label: "OTHER", icon: HelpCircle },
];

const WEIGHT_OPTIONS = [
  { value: 0.5, label: "0.5 kg" },
  { value: 1, label: "1 kg" },
  { value: 2, label: "2 kg" },
  { value: 5, label: "5 kg" },
  { value: 10, label: "10 kg" },
  { value: 20, label: "20 kg" },
  { value: 30, label: "30 kg+" },
];

const WEIGHT_OPTIONS_EXCESS = [
  { value: 10, label: "10 kg" },
  { value: 15, label: "15 kg" },
  { value: 20, label: "20 kg" },
  { value: 25, label: "25 kg" },
  { value: 30, label: "30 kg+" },
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria",
  "Bahrain", "Bangladesh", "Belgium", "Bhutan", "Brazil", "Brunei",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Czech Republic",
  "Denmark", "Egypt", "Ethiopia", "Finland", "France", "Germany", "Ghana",
  "Greece", "Hong Kong", "Hungary", "Iceland", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Laos", "Lebanon", "Libya", "Malaysia", "Maldives", "Mauritius",
  "Mexico", "Mongolia", "Morocco", "Myanmar", "Nepal", "Netherlands",
  "New Zealand", "Nigeria", "Norway", "Oman", "Pakistan", "Panama",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain",
  "Sri Lanka", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey",
  "UAE", "Uganda", "Ukraine", "United Kingdom", "United States", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

const INDIAN_CITIES = [
  { city: "Mumbai", state: "MH", pincode: "400001" },
  { city: "Delhi", state: "DL", pincode: "110001" },
  { city: "Bangalore", state: "KA", pincode: "560001" },
  { city: "Hyderabad", state: "TS", pincode: "500001" },
  { city: "Chennai", state: "TN", pincode: "600001" },
  { city: "Kolkata", state: "WB", pincode: "700001" },
  { city: "Pune", state: "MH", pincode: "411001" },
  { city: "Ahmedabad", state: "GJ", pincode: "380001" },
  { city: "Jaipur", state: "RJ", pincode: "302001" },
  { city: "Lucknow", state: "UP", pincode: "226001" },
  { city: "Surat", state: "GJ", pincode: "395001" },
  { city: "Nagpur", state: "MH", pincode: "440001" },
  { city: "Indore", state: "MP", pincode: "452001" },
  { city: "Bhopal", state: "MP", pincode: "462001" },
  { city: "Patna", state: "BR", pincode: "800001" },
  { city: "Vadodara", state: "GJ", pincode: "390001" },
  { city: "Coimbatore", state: "TN", pincode: "641001" },
  { city: "Kochi", state: "KL", pincode: "682001" },
  { city: "Visakhapatnam", state: "AP", pincode: "530001" },
  { city: "Chandigarh", state: "CH", pincode: "160001" },
  { city: "Guwahati", state: "AS", pincode: "781001" },
  { city: "Thiruvananthapuram", state: "KL", pincode: "695001" },
  { city: "Mysore", state: "KA", pincode: "570001" },
  { city: "Ranchi", state: "JH", pincode: "834001" },
  { city: "Dehradun", state: "UK", pincode: "248001" },
  { city: "Amritsar", state: "PB", pincode: "143001" },
  { city: "Noida", state: "UP", pincode: "201301" },
  { city: "Gurgaon", state: "HR", pincode: "122001" },
  { city: "Varanasi", state: "UP", pincode: "221001" },
  { city: "Agra", state: "UP", pincode: "282001" },
];

// ─── Generate Dropzy estimate ───
function generateEstimate(mode: Mode, weight: number, shipmentValue: number): ShippingEstimate {
  const baseRatePerKg = mode === "international" ? 350 : 80;
  const handlingFee = mode === "international" ? 250 : 50;
  const basePrice = Math.round(handlingFee + weight * baseRatePerKg);
  const gst = Math.round(basePrice * 0.18);
  const minDays = mode === "international" ? 5 : 2;
  const maxDays = mode === "international" ? 10 : 5;

  return {
    base_price: basePrice,
    gst,
    total_price: basePrice + gst,
    estimated_days: { min: minDays, max: maxDays },
    service_type: mode === "international" ? "International Shipping" : "Domestic Shipping",
  };
}

// ─── Sub-components ───

function CityTypeahead({
  value,
  onChange,
  onSelect,
  placeholder,
  label,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (city: typeof INDIAN_CITIES[0]) => void;
  placeholder: string;
  label: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 2
    ? INDIAN_CITIES.filter((c) =>
        c.city.toLowerCase().includes(value.toLowerCase()) ||
        c.pincode.startsWith(value)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => value.length >= 2 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full apple-input pl-10 pr-4 py-2.5 transition-all",
            error ? "border-red-400 focus:ring-2 focus:ring-red-100" : "focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10"
          )}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 glass-card rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((city) => (
            <button
              key={city.pincode}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors flex justify-between items-center"
              onClick={() => { onSelect(city); setOpen(false); }}
            >
              <span className="font-medium text-gray-900">{city.city}, {city.state}</span>
              <span className="text-xs text-gray-400">{city.pincode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CountryDropdown({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        Destination Country
      </label>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "apple-input w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-all",
          error ? "border-red-400" : ""
        )}
      >
        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className={value ? "text-gray-900 flex-1" : "text-gray-400 flex-1"}>
          {value || "Select country"}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && (
        <div className="absolute z-20 w-full mt-1 glass-card rounded-xl shadow-lg">
          <div className="p-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="apple-input w-full pl-8 pr-3 py-1.5 text-sm rounded-md"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((country) => (
              <button
                key={country}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-brand-50 transition-colors",
                  value === country && "bg-brand-50 text-brand-700 font-medium"
                )}
                onClick={() => { onChange(country); setOpen(false); setSearch(""); }}
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───
export default function CostEstimatorPage() {
  const { token, user } = useAuth();
  const [mode, setMode] = useState<Mode>("international");
  const [form, setForm] = useState<FormData>({
    pickup_city: "",
    pickup_pincode: "",
    destination_country: "",
    destination_city: "",
    destination_pincode: "",
    package_type: "PARCEL",
    package_type_custom: "",
    weight_kg: 0,
    mobile: "",
    shipment_value: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<ShippingEstimate | null>(null);
  const [showRestrictionWarning, setShowRestrictionWarning] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-fill mobile if logged in
  useEffect(() => {
    if (user?.phone) {
      setForm((prev) => ({ ...prev, mobile: user.phone!.replace(/^\+91/, "") }));
    }
  }, [user]);

  // Reset fields when switching tabs (except mobile)
  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setForm((prev) => ({
      ...prev,
      pickup_city: "",
      pickup_pincode: "",
      destination_country: "",
      destination_city: "",
      destination_pincode: "",
      package_type: "PARCEL",
      package_type_custom: "",
      weight_kg: 0,
      shipment_value: "",
    }));
    setEstimate(null);
    setErrors({});
    setApiError(false);
    setSent(false);
  };

  // Check if restricted type
  useEffect(() => {
    const restricted = PACKAGE_TYPES.find((p) => p.id === form.package_type)?.restricted;
    setShowRestrictionWarning(!!restricted);
  }, [form.package_type]);

  const weightOptions = form.package_type === "EXCESS_BAG" ? WEIGHT_OPTIONS_EXCESS : WEIGHT_OPTIONS;

  // Validate form
  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.pickup_city) errs.pickup_city = "Pickup city is required";
    if (mode === "international" && !form.destination_country) errs.destination_country = "Destination country is required";
    if (mode === "domestic" && !form.destination_city) errs.destination_city = "Destination city is required";
    if (mode === "domestic" && form.destination_city && form.destination_city === form.pickup_city) {
      errs.destination_city = "Destination must be different from pickup city";
    }
    if (!form.package_type) errs.package_type = "Package type is required";
    if (!form.weight_kg) errs.weight_kg = "Weight is required";
    if (!form.mobile) errs.mobile = "Mobile number required";
    else if (!/^\d{10}$/.test(form.mobile)) errs.mobile = "Enter valid 10-digit mobile number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle check rates
  const handleCheckRates = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError(false);
    setEstimate(null);
    setSent(false);

    try {
      if (token) {
        const res = await ratesAPI.estimate(token, {
          pickup_pincode: form.pickup_pincode,
          destination_country: mode === "international" ? form.destination_country : undefined,
          destination_city: mode === "domestic" ? form.destination_city : undefined,
          package_type: form.package_type,
          weight_kg: form.weight_kg,
          mobile: form.mobile,
          mode,
          shipment_value: form.shipment_value ? parseFloat(form.shipment_value) : undefined,
        });
        if (res.data?.estimate) {
          setEstimate(res.data.estimate);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall back to generated estimate
    }

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1500));
    setEstimate(generateEstimate(mode, form.weight_kg, parseFloat(form.shipment_value) || 0));
    setLoading(false);
  };

  // Handle send estimate to customer
  const handleSendEstimate = () => {
    setSent(true);
    // In production, this would send via SMS/WhatsApp to the mobile number
    setTimeout(() => setSent(false), 3000);
  };

  // Copy estimate summary
  const handleCopyEstimate = () => {
    const dest = mode === "international" ? form.destination_country : form.destination_city;
    const pkgLabel = PACKAGE_TYPES.find((p) => p.id === form.package_type)?.label || form.package_type;
    const text = `Dropzy Shipping Estimate\n${form.pickup_city} → ${dest}\nPackage: ${pkgLabel} | Weight: ${form.weight_kg} kg\n${form.shipment_value ? `Shipment Value: ₹${parseInt(form.shipment_value).toLocaleString("en-IN")}\n` : ""}Estimated Cost: ₹${estimate!.total_price.toLocaleString("en-IN")} (incl. GST)\nDelivery: ${estimate!.estimated_days.min}–${estimate!.estimated_days.max} Business Days`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormComplete =
    form.pickup_city &&
    (mode === "international" ? form.destination_country : form.destination_city) &&
    form.package_type &&
    form.weight_kg > 0 &&
    form.mobile.length === 10;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="section-title">Shipping Cost Estimator</h2>
        <p className="section-subtitle">
          Calculate shipping costs and send estimates to customers
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode("international")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
            mode === "international"
              ? "bg-[#1E3A5F] text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          )}
        >
          <Globe className="w-4 h-4" />
          International
        </button>
        <button
          onClick={() => switchMode("domestic")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
            mode === "domestic"
              ? "bg-[#1E3A5F] text-white shadow-md"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
          )}
        >
          <MapPin className="w-4 h-4" />
          Domestic
        </button>
      </div>

      {/* Quote Form */}
      {!estimate && !loading && (
        <div className="glass-card p-6 space-y-5 animate-fade-in">
          {/* Pickup & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <CityTypeahead
              label="Pickup City"
              value={form.pickup_city}
              onChange={(v) => setForm({ ...form, pickup_city: v, pickup_pincode: "" })}
              onSelect={(c) => setForm({ ...form, pickup_city: `${c.city}, ${c.state}`, pickup_pincode: c.pincode })}
              placeholder="Type city or pincode"
              error={errors.pickup_city}
            />
            {mode === "international" ? (
              <CountryDropdown
                value={form.destination_country}
                onChange={(v) => setForm({ ...form, destination_country: v })}
                error={errors.destination_country}
              />
            ) : (
              <CityTypeahead
                label="Destination City"
                value={form.destination_city}
                onChange={(v) => setForm({ ...form, destination_city: v, destination_pincode: "" })}
                onSelect={(c) => setForm({ ...form, destination_city: `${c.city}, ${c.state}`, destination_pincode: c.pincode })}
                placeholder="Type city or pincode"
                error={errors.destination_city}
              />
            )}
          </div>

          {/* Shipment Value */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Shipment Value (Approx.)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={form.shipment_value}
                onChange={(e) => setForm({ ...form, shipment_value: e.target.value })}
                placeholder="Enter approximate value in INR"
                className="apple-input w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {/* Package Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Package Type
            </label>
            {errors.package_type && <p className="text-xs text-red-500 mb-2">{errors.package_type}</p>}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {PACKAGE_TYPES.map((pkg) => {
                const isSelected = form.package_type === pkg.id;
                const Icon = pkg.icon;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setForm({ ...form, package_type: pkg.id, weight_kg: pkg.id === "EXCESS_BAG" && form.weight_kg < 10 ? 0 : form.weight_kg })}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all duration-200 border-2",
                      isSelected
                        ? "border-[#34C759] bg-[#34C759]/10 text-[#34C759]"
                        : "border-gray-200 glass-card-static text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[#34C759] bg-white rounded-full" />
                    )}
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{pkg.label}</span>
                  </button>
                );
              })}
            </div>

            {form.package_type === "OTHER" && (
              <input
                type="text"
                maxLength={300}
                value={form.package_type_custom}
                onChange={(e) => setForm({ ...form, package_type_custom: e.target.value })}
                placeholder="Describe your package (max 300 characters)"
                className="mt-3 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            )}

            {showRestrictionWarning && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {form.package_type === "MEDS"
                    ? "Prescription medicines require licensed pharmacy documents. Check our restricted items policy."
                    : "Food items are subject to customs restrictions for international shipments. Perishable items may require special packaging."}
                </p>
              </div>
            )}
          </div>

          {/* Weight & Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Select Weight
              </label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.weight_kg || ""}
                  onChange={(e) => setForm({ ...form, weight_kg: parseFloat(e.target.value) || 0 })}
                  className={cn(
                    "apple-input w-full pl-10 pr-4 py-2.5 text-sm appearance-none transition-all",
                    errors.weight_kg ? "border-red-400" : ""
                  )}
                >
                  <option value="">Select weight</option>
                  {weightOptions.map((w) => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {mode === "international" && (
                  <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-500">+91</span>
                )}
                <input
                  type="tel"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  placeholder="10-digit mobile number"
                  className={cn(
                    "apple-input w-full pr-4 py-2.5 text-sm transition-all",
                    mode === "international" ? "pl-16" : "pl-10",
                    errors.mobile ? "border-red-400" : ""
                  )}
                />
              </div>
              {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckRates}
            disabled={!isFormComplete || loading}
            className={cn(
              "apple-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-200",
              isFormComplete && !loading
                ? "apple-btn-primary"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {mode === "international" ? "Check International Rates" : "Check Domestic Rates"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-12 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-[#007AFF]/10 rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-[#007AFF]" />
            </div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-[#007AFF]/20 border-t-[#007AFF] rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-600">Calculating shipping cost...</p>
        </div>
      )}

      {/* Estimate Result */}
      {estimate && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Back button */}
          <button
            onClick={() => { setEstimate(null); setApiError(false); setSent(false); }}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Modify Search
          </button>

          {/* Estimate Card */}
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2a5080] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Dropzy {estimate.service_type}</h3>
                  <p className="text-white/70 text-sm">
                    {form.pickup_city} → {mode === "international" ? form.destination_country : form.destination_city}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              {/* Route & Package Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 glass-card-static rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Package</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{PACKAGE_TYPES.find((p) => p.id === form.package_type)?.label}</p>
                </div>
                <div className="text-center p-3 glass-card-static rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Weight</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{form.weight_kg} kg</p>
                </div>
                <div className="text-center p-3 glass-card-static rounded-lg">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Delivery</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{estimate.estimated_days.min}–{estimate.estimated_days.max} Days</p>
                </div>
                {form.shipment_value && (
                  <div className="text-center p-3 glass-card-static rounded-lg">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Declared Value</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">₹{parseInt(form.shipment_value).toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="glass-card-static rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base Shipping Charge</span>
                  <span className="text-gray-900 font-medium">₹{estimate.base_price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (18%)</span>
                  <span className="text-gray-900 font-medium">₹{estimate.gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="pt-3 flex justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="text-base font-bold text-gray-900">Total Estimated Cost</span>
                  <span className="text-2xl font-bold text-[#E8732A]">₹{estimate.total_price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Door-to-door delivery</span>
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Shipment insurance included</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Real-time tracking</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSendEstimate}
                  disabled={sent}
                  className={cn(
                    "apple-btn flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                    sent
                      ? "bg-[#34C759] text-white"
                      : "apple-btn-primary"
                  )}
                >
                  {sent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Sent to {form.mobile}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Estimate to Customer
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyEstimate}
                  className="apple-btn apple-btn-secondary flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Error State */}
      {apiError && (
        <div className="glass-card border-red-200 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Unable to calculate estimate</h3>
          <p className="text-sm text-gray-500 mt-1">Something went wrong. Please try again.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={handleCheckRates}
              className="apple-btn apple-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
