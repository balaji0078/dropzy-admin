"use client";

import { CORE_API } from "@/lib/config";
import CoreDashboard from "@/components/core/pages/Dashboard";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import StatusBadge from "@/components/ui/StatusBadge";
import DropzyScene from "@/components/layout/DropzyScene";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeftRight,
  Truck,
  Shield,
  Clock,
  Star,
  Tag,
  Phone,
  CheckCircle2,
  ChevronRight,
  Zap,
  Users,
  TrendingUp,
  Gift,
  Navigation,
} from "lucide-react";

const DashboardFleetMap = dynamic(
  () => import("@/components/ui/DashboardFleetMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[350px] rounded-xl bg-surface-alt flex items-center justify-center">
        <div className="text-ink-faint text-sm">Loading live map...</div>
      </div>
    ),
  }
);

// Popular routes data
const popularRoutes = [
  { from: "Hyderabad", to: "Mumbai", price: 850, duration: "12h", buses: 45, rating: 4.3 },
  { from: "Bangalore", to: "Chennai", price: 650, duration: "6h", buses: 72, rating: 4.5 },
  { from: "Delhi", to: "Jaipur", price: 550, duration: "5h", buses: 60, rating: 4.2 },
  { from: "Mumbai", to: "Pune", price: 350, duration: "3.5h", buses: 120, rating: 4.6 },
  { from: "Kolkata", to: "Patna", price: 750, duration: "10h", buses: 35, rating: 4.1 },
  { from: "Chennai", to: "Madurai", price: 500, duration: "7h", buses: 55, rating: 4.4 },
];

// Offers data
const offers = [
  { code: "FIRST50", title: "50% OFF on First Booking", desc: "Max discount ₹200. Valid for new users.", color: "#F5C451", bg: "rgba(245,196,81,0.12)" },
  { code: "DROPZY100", title: "Flat ₹100 OFF", desc: "On bookings above ₹500. All routes.", color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  { code: "WEEKEND25", title: "25% OFF Weekend Travel", desc: "Valid on Sat-Sun departures.", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
];

// Recent tracking data
const recentTracking = [
  { id: "DPZ-2026-00001", from: "Hyderabad", to: "Mumbai", status: "in_transit", eta: "Apr 27, 6:30 PM", progress: 65 },
  { id: "DPZ-2026-00003", from: "Chennai", to: "Coimbatore", status: "delivered", eta: "Delivered", progress: 100 },
  { id: "DPZ-2026-00004", from: "Mumbai", to: "Bangalore", status: "ready_for_pickup", eta: "Ready for pickup", progress: 90 },
  { id: "DPZ-2026-00006", from: "Hyderabad", to: "Mumbai", status: "in_transit", eta: "Apr 27, 3:00 PM", progress: 40 },
];

// Stats
const stats = [
  { icon: Package, label: "Parcels Delivered", value: "2.5L+", color: "#F5C451" },
  { icon: Truck, label: "Active Buses", value: "500+", color: "#FB923C" },
  { icon: MapPin, label: "Cities Covered", value: "200+", color: "#34D399" },
  { icon: Users, label: "Happy Customers", value: "50K+", color: "#818CF8" },
];

function LegacyDashboardPage() {
  const { token } = useAuth();
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [date, setDate] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [activeTab, setActiveTab] = useState<"send" | "track">("send");

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  return (
    <div className="space-y-0 -m-6">
      {/* ═══════ HERO SECTION ═══════ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #3B2C67 0%, #241A3D 55%, #14101F 100%)",
          minHeight: "420px",
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="absolute bottom-10 -left-10 w-60 h-60 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />
          {/* Animated bus */}
          <DropzyScene className="absolute inset-x-0 bottom-0 w-full h-[170px] opacity-90" sun={[182, 116]} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-28">
          {/* Hero text */}
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              India&apos;s Most Trusted Parcel Service
            </h1>
            <p className="text-[#CFC8E6] text-base">
              Send parcels across 200+ cities with real-time tracking
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-6 animate-fade-in-up animation-delay-100">
            <div className="inline-flex bg-white/10 rounded-full p-1">
              <button
                onClick={() => setActiveTab("send")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "send"
                    ? "bg-gold text-canvas shadow-gold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Package className="w-4 h-4 inline mr-2 -mt-0.5" />
                Send Parcel
              </button>
              <button
                onClick={() => setActiveTab("track")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "track"
                    ? "bg-gold text-canvas shadow-gold"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Search className="w-4 h-4 inline mr-2 -mt-0.5" />
                Track Parcel
              </button>
            </div>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto animate-fade-in-up animation-delay-200">
            <div className="bg-surface border border-line rounded-2xl shadow-rb-xl p-1.5">
              {activeTab === "send" ? (
                <div className="flex flex-col md:flex-row items-stretch">
                  {/* From */}
                  <div className="flex-1 relative border-b md:border-b-0 md:border-r border-line">
                    <div className="px-5 pt-3 pb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">From</label>
                    </div>
                    <div className="flex items-center px-5 pb-3">
                      <MapPin className="w-5 h-5 text-primary-light mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        placeholder="Enter origin city"
                        className="rb-search-input py-0"
                      />
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className="relative flex items-center justify-center md:-mx-5 z-10">
                    <button
                      onClick={swapCities}
                      className="w-10 h-10 rounded-full bg-surface border-2 border-line flex items-center justify-center hover:border-gold/60 hover:bg-gold/10 transition-all shadow-sm"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-gold" />
                    </button>
                  </div>

                  {/* To */}
                  <div className="flex-1 relative border-b md:border-b-0 md:border-r border-line">
                    <div className="px-5 pt-3 pb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">To</label>
                    </div>
                    <div className="flex items-center px-5 pb-3">
                      <MapPin className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        placeholder="Enter destination city"
                        className="rb-search-input py-0"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex-1 relative border-b md:border-b-0 md:border-r border-line">
                    <div className="px-5 pt-3 pb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Date</label>
                    </div>
                    <div className="flex items-center px-5 pb-3">
                      <Calendar className="w-5 h-5 text-ink-faint mr-3 flex-shrink-0" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rb-search-input py-0"
                      />
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-center p-2">
                    <button className="rb-btn rb-btn-primary px-8 py-4 text-base font-bold rounded-xl w-full md:w-auto">
                      SEARCH
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-stretch">
                  <div className="flex-1 relative">
                    <div className="px-5 pt-3 pb-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Tracking ID</label>
                    </div>
                    <div className="flex items-center px-5 pb-3">
                      <Package className="w-5 h-5 text-primary-light mr-3 flex-shrink-0" />
                      <input
                        type="text"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="Enter your tracking ID (e.g., DPZ-2026-00001)"
                        className="rb-search-input py-0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center p-2">
                    <button className="rb-btn rb-btn-primary px-8 py-4 text-base font-bold rounded-xl w-full md:w-auto">
                      TRACK
                      <Search className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ STATS BAR ═══════ */}
      <div className="max-w-6xl mx-auto px-6 -mt-14 relative z-20">
        <div className="bg-surface border border-line rounded-2xl shadow-rb-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color}1F`, border: `1px solid ${stat.color}55` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold dz-kpi">{stat.value}</p>
                  <p className="text-[12px] text-ink-soft">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ OFFERS SECTION ═══════ */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-ink">Exclusive Offers</h2>
            <p className="text-sm text-ink-soft mt-0.5">Save big on your next shipment</p>
          </div>
          <button className="text-sm font-semibold text-primary-light hover:text-gold flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.code}
              className="rb-card p-5 border-l-4 cursor-pointer"
              style={{ borderLeftColor: offer.color }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold"
                  style={{ background: offer.bg, color: offer.color, border: `1px solid ${offer.color}66` }}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {offer.code}
                </div>
                <Gift className="w-5 h-5 text-ink-faint" />
              </div>
              <h3 className="text-[15px] font-bold text-ink mt-2">{offer.title}</h3>
              <p className="text-[12px] text-ink-soft mt-1">{offer.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ POPULAR ROUTES ═══════ */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-ink">Popular Routes</h2>
            <p className="text-sm text-ink-soft mt-0.5">Most booked parcel routes across India</p>
          </div>
          <button className="text-sm font-semibold text-primary-light hover:text-gold flex items-center gap-1">
            All Routes <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRoutes.map((route) => (
            <div key={`${route.from}-${route.to}`} className="rb-card p-5 cursor-pointer group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-primary-light" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-ink">
                      {route.from} → {route.to}
                    </p>
                    <p className="text-[11px] text-ink-soft">{route.buses} buses daily</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-faint group-hover:text-gold transition-colors" />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-line">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-ink-faint" />
                    <span className="text-[12px] text-ink-soft">{route.duration}</span>
                  </div>
                  <div className="rb-rating">
                    <Star className="w-3 h-3 fill-white" />
                    {route.rating}
                  </div>
                </div>
                <p className="text-[16px] font-bold text-ink">
                  Starting {formatCurrency(route.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ LIVE TRACKING + MAP ═══════ */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Track Your Parcel */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-ink">Track Your Parcel</h2>
                <p className="text-sm text-ink-soft mt-0.5">Real-time shipment updates</p>
              </div>
            </div>
            <div className="space-y-3">
              {recentTracking.map((item) => (
                <div key={item.id} className="rb-card p-4 cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-bold" style={{ color: "var(--dz-primary-light)" }}>{item.id}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-[13px] text-ink font-medium mb-2">
                    {item.from} → {item.to}
                  </p>
                  {/* Progress bar */}
                  <div className="w-full bg-surface-alt rounded-full h-2 mb-1.5">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.progress}%`,
                        background: item.progress === 100
                          ? "#34D399"
                          : "linear-gradient(90deg, #7C3AED, #A78BFA)",
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-ink-faint">{item.progress}% complete</span>
                    <span className="text-[11px] text-ink-soft font-medium">{item.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Fleet Map */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-ink">Live Fleet Map</h2>
                <p className="text-sm text-ink-soft mt-0.5">Real-time bus positions across India</p>
              </div>
              <a href="/fleet" className="text-sm font-semibold text-primary-light hover:text-gold flex items-center gap-1">
                Full View <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="rb-card-flat overflow-hidden">
              <DashboardFleetMap />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ WHY DROPZY ═══════ */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-ink">Why Choose Dropzy?</h2>
          <p className="text-sm text-ink-soft mt-1">Trusted by 50,000+ customers across India</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Shield, title: "Safe & Secure", desc: "Insured parcels with real-time tracking", color: "#A78BFA" },
            { icon: Zap, title: "Super Fast", desc: "Express delivery in 24-48 hours", color: "#FB923C" },
            { icon: TrendingUp, title: "Best Prices", desc: "Competitive rates with no hidden charges", color: "#34D399" },
            { icon: Phone, title: "24/7 Support", desc: "Round the clock customer assistance", color: "#818CF8" },
          ].map((feature) => (
            <div key={feature.title} className="text-center rb-card p-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${feature.color}1F`, border: `1px solid ${feature.color}55` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-[14px] font-bold text-ink mb-1">{feature.title}</h3>
              <p className="text-[12px] text-ink-soft leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <div className="mt-12 bg-canvas border-t border-line text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-dz-offer ring-1 ring-gold/50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-gold" />
                </div>
                <span className="text-lg font-bold">Dropzy</span>
              </div>
              <p className="text-[13px] text-ink-faint leading-relaxed">
                India&apos;s leading bus parcel delivery service with real-time tracking and guaranteed delivery.
              </p>
            </div>

            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink-faint mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {["Dashboard", "Send Parcel", "Track Parcel", "Fleet Tracking", "Pricing"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[13px] text-ink-faint hover:text-gold transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink-faint mb-4">Top Routes</h4>
              <ul className="space-y-2.5">
                {["HYD → MUM", "BLR → CHE", "DEL → JAI", "MUM → PUN", "KOL → PAT"].map((route) => (
                  <li key={route}>
                    <a href="#" className="text-[13px] text-ink-faint hover:text-gold transition-colors">{route}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink-faint mb-4">Contact</h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-[13px] text-ink-faint">
                  <Phone className="w-4 h-4" /> 1800-123-DROPZY
                </li>
                <li className="flex items-center gap-2 text-[13px] text-ink-faint">
                  <Package className="w-4 h-4" /> support@dropzy.in
                </li>
              </ul>
              <div className="mt-4 flex gap-2">
                <div className="w-9 h-9 rounded-full bg-surface-alt border border-line flex items-center justify-center hover:bg-primary-deep hover:border-gold/60 transition-colors cursor-pointer">
                  <span className="text-[12px] font-bold">f</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-surface-alt border border-line flex items-center justify-center hover:bg-primary-deep hover:border-gold/60 transition-colors cursor-pointer">
                  <span className="text-[12px] font-bold">X</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-surface-alt border border-line flex items-center justify-center hover:bg-primary-deep hover:border-gold/60 transition-colors cursor-pointer">
                  <span className="text-[12px] font-bold">in</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-line mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-ink-soft">&copy; 2026 Dropzy. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[12px] text-ink-soft hover:text-gold transition-colors">Privacy Policy</a>
              <a href="#" className="text-[12px] text-ink-soft hover:text-gold transition-colors">Terms of Service</a>
              <a href="#" className="text-[12px] text-ink-soft hover:text-gold transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEXT_PUBLIC_CORE_API=true → P2 operations dashboard; otherwise the legacy dashboard (unchanged).
export default function DashboardPage() {
  return CORE_API ? <CoreDashboard /> : <LegacyDashboardPage />;
}
