"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Star,
  Zap,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronDown,
  X,
  FileText,
  Pill,
  UtensilsCrossed,
  Cpu,
  Shirt,
  Gift,
  Briefcase,
  HelpCircle,
  Flower2,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───
type Mode = "international" | "domestic";

interface CarrierQuote {
  carrier_id: string;
  carrier_name: string;
  logo_url: string;
  base_price_inr: number;
  gst_inr: number;
  total_price_inr: number;
  estimated_delivery_days: { min: number; max: number };
  is_express: boolean;
  badge: "Recommended" | "Cheapest" | "Fastest" | null;
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

// ─── Mock carrier data generator ───
function generateMockQuotes(mode: Mode, weight: number): CarrierQuote[] {
  const baseMultiplier = mode === "international" ? 3.5 : 1;
  const weightMultiplier = weight <= 1 ? 1 : weight <= 5 ? 1.8 : weight <= 10 ? 2.5 : 3.5;

  const carriers = mode === "international"
    ? [
        { id: "dhl", name: "DHL Express", logo: "DHL" },
        { id: "fedex", name: "FedEx International", logo: "FedEx" },
        { id: "aramex", name: "Aramex", logo: "Aramex" },
        { id: "ups", name: "UPS Worldwide", logo: "UPS" },
      ]
    : [
        { id: "bluedart", name: "Blue Dart", logo: "BD" },
        { id: "delhivery", name: "Delhivery", logo: "DLV" },
        { id: "dtdc", name: "DTDC", logo: "DTDC" },
        { id: "ekart", name: "Ekart Logistics", logo: "EK" },
        { id: "xpressbees", name: "XpressBees", logo: "XB" },
      ];

  return carriers.map((carrier, i) => {
    const basePrice = Math.round((150 + i * 80) * baseMultiplier * weightMultiplier);
    const gst = Math.round(basePrice * 0.18);
    const minDays = mode === "international" ? 3 + i : 1 + Math.floor(i / 2);
    const maxDays = minDays + 2 + Math.floor(i / 2);

    return {
      carrier_id: carrier.id,
      carrier_name: carrier.name,
      logo_url: carrier.logo,
      base_price_inr: basePrice,
      gst_inr: gst,
      total_price_inr: basePrice + gst,
      estimated_delivery_days: { min: minDays, max: maxDays },
      is_express: i < 2,
      badge: i === 0 ? "Recommended" : i === carriers.length - 1 ? "Cheapest" : i === 1 ? "Fastest" : null,
    };
  });
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
            "w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm transition-all",
            error ? "border-red-400 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          )}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
          "w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm text-left transition-all",
          error ? "border-red-400" : "border-gray-200 hover:border-gray-300"
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
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md"
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
  const [quotes, setQuotes] = useState<CarrierQuote[] | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "price" | "time">("recommended");
  const [filterExpress, setFilterExpress] = useState<"all" | "express" | "economy">("all");
  const [showRestrictionWarning, setShowRestrictionWarning] = useState(false);
  const [apiError, setApiError] = useState(false);

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
    setQuotes(null);
    setErrors({});
    setApiError(false);
  };

  // Check if restricted type
  useEffect(() => {
    const restricted = PACKAGE_TYPES.find((p) => p.id === form.package_type)?.restricted;
    setShowRestrictionWarning(!!restricted);
  }, [form.package_type]);

  // Weight options based on package type
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
    setQuotes(null);

    try {
      // Try real API first
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
        if (res.data?.quotes) {
          setQuotes(res.data.quotes);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall back to mock data
    }

    // Simulate API delay with mock data
    await new Promise((r) => setTimeout(r, 2000));
    setQuotes(generateMockQuotes(mode, form.weight_kg));
    setLoading(false);
  };

  // Sort & filter quotes
  const displayQuotes = quotes
    ? [...quotes]
        .filter((q) =>
          filterExpress === "all" ? true : filterExpress === "express" ? q.is_express : !q.is_express
        )
        .sort((a, b) => {
          if (sortBy === "price") return a.total_price_inr - b.total_price_inr;
          if (sortBy === "time") return a.estimated_delivery_days.min - b.estimated_delivery_days.min;
          // recommended: badge first, then price
          const badgeOrder = { Recommended: 0, Fastest: 1, Cheapest: 2 };
          const aScore = a.badge ? (badgeOrder[a.badge] ?? 3) : 3;
          const bScore = b.badge ? (badgeOrder[b.badge] ?? 3) : 3;
          return aScore - bScore || a.total_price_inr - b.total_price_inr;
        })
    : null;

  const isFormComplete =
    form.pickup_city &&
    (mode === "international" ? form.destination_country : form.destination_city) &&
    form.package_type &&
    form.weight_kg > 0 &&
    form.mobile.length === 10;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Shipping Cost Estimator</h2>
        <p className="text-sm text-gray-500">
          Get instant shipping rates for domestic and international parcels
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
      {!quotes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 animate-fade-in">
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
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={form.shipment_value}
                onChange={(e) => setForm({ ...form, shipment_value: e.target.value })}
                placeholder="Enter approximate value in INR"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
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
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white"
                    )}
                  >
                    {isSelected && (
                      <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-4 h-4 text-emerald-500 bg-white rounded-full" />
                    )}
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{pkg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom type input for OTHER */}
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

            {/* Restriction warning */}
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
                    "w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm appearance-none bg-white transition-all",
                    errors.weight_kg ? "border-red-400" : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
                    "w-full pr-4 py-2.5 border rounded-lg text-sm transition-all",
                    mode === "international" ? "pl-16" : "pl-10",
                    errors.mobile ? "border-red-400" : "border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
              "w-full flex items-center justify-center gap-2 py-3 rounded-lg text-base font-bold transition-all duration-200",
              isFormComplete && !loading
                ? "bg-[#E8732A] text-white hover:bg-[#d4661f] shadow-md hover:shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Fetching Rates...
              </>
            ) : (
              <>
                {mode === "international" ? "Check International Rates" : "Check Domestic Rates"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !quotes && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-20 ml-auto" />
                  <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {quotes && !loading && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Back + Summary */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setQuotes(null); setApiError(false); }}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Modify Search
            </button>
            <div className="text-sm text-gray-500">
              {form.pickup_city} → {mode === "international" ? form.destination_country : form.destination_city}
              <span className="mx-2">|</span>
              {form.weight_kg} kg
              <span className="mx-2">|</span>
              {PACKAGE_TYPES.find((p) => p.id === form.package_type)?.label}
            </div>
          </div>

          {/* Sort & Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase">Sort by:</span>
            {[
              { key: "recommended", label: "Recommended", icon: Star },
              { key: "price", label: "Price", icon: TrendingDown },
              { key: "time", label: "Fastest", icon: Zap },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  sortBy === key
                    ? "bg-[#1E3A5F] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
            <div className="border-l border-gray-200 pl-3 ml-1 flex gap-2">
              {[
                { key: "all", label: "All" },
                { key: "express", label: "Express" },
                { key: "economy", label: "Economy" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterExpress(key as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filterExpress === key
                      ? "bg-[#E8732A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Carrier Cards */}
          {displayQuotes && displayQuotes.length > 0 ? (
            displayQuotes.map((quote, idx) => (
              <div
                key={quote.carrier_id}
                className={cn(
                  "bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200",
                  quote.badge === "Recommended" && "ring-2 ring-brand-200 border-brand-300"
                )}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Carrier Logo */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                    quote.carrier_id === "dhl" ? "bg-yellow-500" :
                    quote.carrier_id === "fedex" ? "bg-purple-600" :
                    quote.carrier_id === "bluedart" ? "bg-blue-600" :
                    quote.carrier_id === "delhivery" ? "bg-red-500" :
                    quote.carrier_id === "dtdc" ? "bg-indigo-600" :
                    quote.carrier_id === "aramex" ? "bg-orange-500" :
                    quote.carrier_id === "ups" ? "bg-amber-700" :
                    quote.carrier_id === "ekart" ? "bg-blue-500" :
                    "bg-gray-600"
                  )}>
                    {quote.logo_url}
                  </div>

                  {/* Carrier Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{quote.carrier_name}</h3>
                      {quote.badge && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                          quote.badge === "Recommended" ? "bg-brand-100 text-brand-700" :
                          quote.badge === "Fastest" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        )}>
                          {quote.badge}
                        </span>
                      )}
                      {quote.is_express && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700">
                          Express
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {quote.estimated_delivery_days.min}–{quote.estimated_delivery_days.max} Business Days
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="w-4 h-4 text-gray-700" />
                      <span className="text-xl font-bold text-gray-900">
                        {quote.total_price_inr.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Base: {quote.base_price_inr.toLocaleString("en-IN")} + GST: {quote.gst_inr.toLocaleString("en-IN")}
                    </div>
                    <button className="mt-2 px-5 py-1.5 bg-[#E8732A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4661f] transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No carriers match the current filter.</p>
              <button onClick={() => setFilterExpress("all")} className="mt-2 text-brand-600 text-sm font-medium hover:underline">
                Show all carriers
              </button>
            </div>
          )}
        </div>
      )}

      {/* API Error State */}
      {apiError && (
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Unable to fetch rates</h3>
          <p className="text-sm text-gray-500 mt-1">All carrier APIs timed out. Please try again.</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={handleCheckRates}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <a
              href="mailto:support@dropzy.com"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
