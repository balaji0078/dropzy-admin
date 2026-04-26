"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { Truck, MapPin, User, Gauge, Box, X, Navigation, Activity, History, Clock, ChevronRight } from "lucide-react";
import { getTripHistory, TripHistory } from "@/lib/mock-live-tracking";

const FleetMap = dynamic(() => import("@/components/ui/FleetMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.02)" }}>
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#D82C2C", borderTopColor: "transparent" }} />
        <span className="text-[12px] text-gray-400">Loading map...</span>
      </div>
    </div>
  ),
});

const TripHistoryPlayer = dynamic(() => import("@/components/ui/TripHistoryPlayer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.02)" }}>
      <span className="text-[12px] text-gray-400">Loading trip player...</span>
    </div>
  ),
});

const MOCK_BUSES = [
  { id: "BUS-001", busNumber: "KA-05-AB-1001", route: "HYD → MUM", driver: "Ramesh Kumar", driverPhone: "+91-9876543001", status: "active", lastLocation: "Telangana", latitude: 17.36, longitude: 78.47, speed: 68, parcelsOnboard: 24, capacity: 50, registrationDate: "2024-01-15" },
  { id: "BUS-002", busNumber: "MH-02-CD-2001", route: "MUM → BLR", driver: "Priya Sharma", driverPhone: "+91-9876543002", status: "active", lastLocation: "Maharashtra", latitude: 19.07, longitude: 72.88, speed: 72, parcelsOnboard: 31, capacity: 50, registrationDate: "2024-02-20" },
  { id: "BUS-003", busNumber: "DL-01-EF-3001", route: "DEL → KOL", driver: "Arun Verma", driverPhone: "+91-9876543003", status: "active", lastLocation: "Delhi", latitude: 28.70, longitude: 77.10, speed: 65, parcelsOnboard: 28, capacity: 50, registrationDate: "2024-03-10" },
  { id: "BUS-004", busNumber: "KA-07-GH-4001", route: "BLR → CHE", driver: "Deepak Reddy", driverPhone: "+91-9876543004", status: "active", lastLocation: "Karnataka", latitude: 12.97, longitude: 77.59, speed: 58, parcelsOnboard: 19, capacity: 50, registrationDate: "2024-04-05" },
  { id: "BUS-005", busNumber: "TN-09-IJ-5001", route: "CHE → PUN", driver: "Kavya Iyer", driverPhone: "+91-9876543005", status: "active", lastLocation: "Tamil Nadu", latitude: 13.08, longitude: 80.27, speed: 70, parcelsOnboard: 35, capacity: 50, registrationDate: "2024-05-12" },
  { id: "BUS-006", busNumber: "MH-03-KL-6001", route: "PUN → AHM", driver: "Sanjana Singh", driverPhone: "+91-9876543006", status: "idle", lastLocation: "Pune", latitude: 18.52, longitude: 73.85, speed: 0, parcelsOnboard: 12, capacity: 50, registrationDate: "2024-06-18" },
  { id: "BUS-007", busNumber: "WB-11-MN-7001", route: "KOL → HYD", driver: "Jyoti Dutta", driverPhone: "+91-9876543007", status: "active", lastLocation: "West Bengal", latitude: 22.57, longitude: 88.36, speed: 62, parcelsOnboard: 26, capacity: 50, registrationDate: "2024-07-22" },
  { id: "BUS-008", busNumber: "GJ-08-OP-8001", route: "AHM → MUM", driver: "Vikas Patel", driverPhone: "+91-9876543008", status: "active", lastLocation: "Gujarat", latitude: 23.02, longitude: 72.57, speed: 66, parcelsOnboard: 29, capacity: 50, registrationDate: "2024-08-08" },
  { id: "BUS-009", busNumber: "KA-06-QR-9001", route: "BLR → HYD", driver: "Suresh Nair", driverPhone: "+91-9876543009", status: "maintenance", lastLocation: "Karnataka (Depot)", latitude: 12.97, longitude: 77.59, speed: 0, parcelsOnboard: 0, capacity: 50, registrationDate: "2023-12-01" },
  { id: "BUS-010", busNumber: "MH-04-ST-10001", route: "MUM → DEL", driver: "Rohan Sharma", driverPhone: "+91-9876543010", status: "active", lastLocation: "Maharashtra", latitude: 19.07, longitude: 72.88, speed: 69, parcelsOnboard: 33, capacity: 50, registrationDate: "2024-09-14" },
];

const INDIAN_CITY_COORDS = [
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, stateCode: "RJ" },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, stateCode: "UP" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, stateCode: "MH" },
  { name: "Indore", lat: 22.7196, lng: 75.8577, stateCode: "MP" },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, stateCode: "MP" },
  { name: "Patna", lat: 25.6093, lng: 85.1376, stateCode: "BR" },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, stateCode: "CH" },
  { name: "Ranchi", lat: 23.3441, lng: 85.3096, stateCode: "JH" },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812, stateCode: "GJ" },
  { name: "Surat", lat: 21.1702, lng: 72.8311, stateCode: "GJ" },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, stateCode: "TN" },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, stateCode: "AP" },
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, stateCode: "OD" },
  { name: "Dehradun", lat: 30.3165, lng: 78.0322, stateCode: "UK" },
  { name: "Amritsar", lat: 31.6340, lng: 74.8723, stateCode: "PB" },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319, stateCode: "UP" },
  { name: "Mysore", lat: 12.2958, lng: 76.6394, stateCode: "KA" },
  { name: "Aurangabad", lat: 19.8762, lng: 75.3433, stateCode: "MH" },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362, stateCode: "AS" },
  { name: "Raipur", lat: 21.2514, lng: 81.6296, stateCode: "CG" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, stateCode: "UP" },
  { name: "Varanasi", lat: 25.3176, lng: 82.9739, stateCode: "UP" },
  { name: "Nashik", lat: 19.9975, lng: 73.7898, stateCode: "MH" },
  { name: "Jodhpur", lat: 26.2389, lng: 73.0243, stateCode: "RJ" },
  { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, stateCode: "KL" },
];

const generateMockBuses = () => {
  const buses = [...MOCK_BUSES];
  const routes = ["HYD → MUM", "MUM → BLR", "BLR → DEL", "CHE → PUN", "KOL → AHM", "DEL → HYD", "PUN → MUM", "AHM → BLR"];
  const driverNames = ["Ramesh", "Priya", "Arun", "Deepak", "Kavya", "Sanjana", "Jyoti", "Vikas"];
  const lastNames = ["Kumar", "Sharma", "Verma", "Reddy", "Iyer", "Singh", "Dutta", "Patel"];
  const statuses = ["active", "idle", "active", "active", "active", "idle", "active", "maintenance"];

  for (let i = 10; i < 35; i++) {
    const city = INDIAN_CITY_COORDS[(i - 10) % INDIAN_CITY_COORDS.length];
    const status = statuses[(i + 2) % statuses.length];
    buses.push({
      id: `BUS-${String(i + 1).padStart(3, "0")}`,
      busNumber: `${city.stateCode}-${String((i % 15) + 1).padStart(2, "0")}-UV-${String(i + 1001).padStart(4, "0")}`,
      route: routes[i % routes.length],
      driver: `${driverNames[i % driverNames.length]} ${lastNames[i % lastNames.length]}`,
      driverPhone: `+91-${9800000000 + i}`,
      status,
      lastLocation: city.name,
      latitude: city.lat + (Math.random() - 0.5) * 0.5,
      longitude: city.lng + (Math.random() - 0.5) * 0.5,
      speed: status === "active" ? Math.floor(55 + Math.random() * 30) : 0,
      parcelsOnboard: status === "active" ? Math.floor(10 + Math.random() * 35) : Math.floor(Math.random() * 5),
      capacity: 50,
      registrationDate: `202${Math.floor(i / 10)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    });
  }
  return buses;
};

const allBuses = generateMockBuses();

function BusDetailPanel({ bus, onClose }: { bus: (typeof allBuses)[0] | null; onClose: () => void }) {
  if (!bus) return null;

  const capacityPct = (bus.parcelsOnboard / bus.capacity) * 100;
  const speedPct = (bus.speed / 120) * 100;

  return (
    <div className="rb-card-flat flex flex-col max-h-[600px]">
      <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <h2 className="text-[16px] font-bold tracking-tight text-gray-900">{bus.busNumber}</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/[0.04] transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Status Card */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(216,44,44,0.06), rgba(216,44,44,0.06))", border: "1px solid rgba(216,44,44,0.1)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-900">Status</h3>
            <StatusBadge status={bus.status} />
          </div>
          <div className="space-y-2 text-[13px]">
            <div><span className="text-gray-400">Route:</span> <span className="font-medium text-gray-900 ml-1">{bus.route}</span></div>
            <div><span className="text-gray-400">Location:</span> <span className="font-medium text-gray-900 ml-1">{bus.lastLocation}</span></div>
          </div>
        </div>

        {/* Driver */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.02)" }}>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <User className="w-3.5 h-3.5" style={{ color: "#D82C2C" }} /> Driver
          </h3>
          <div className="space-y-1.5 text-[13px]">
            <div><span className="text-gray-400">Name:</span> <span className="font-medium text-gray-900 ml-1">{bus.driver}</span></div>
            <div><span className="text-gray-400">Phone:</span> <span className="font-medium text-gray-900 ml-1">{bus.driverPhone}</span></div>
          </div>
        </div>

        {/* GPS */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.02)" }}>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5" style={{ color: "#D82C2C" }} /> GPS
          </h3>
          <div className="space-y-1.5 text-[13px]">
            <div><span className="text-gray-400">Lat:</span> <span className="font-mono text-gray-900 ml-1">{bus.latitude.toFixed(4)}</span></div>
            <div><span className="text-gray-400">Lng:</span> <span className="font-mono text-gray-900 ml-1">{bus.longitude.toFixed(4)}</span></div>
          </div>
        </div>

        {/* Metrics */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.02)" }}>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5" style={{ color: "#34C759" }} /> Performance
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-gray-400">Speed</span>
                <span className="font-semibold text-gray-900">{bus.speed} km/h</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${speedPct}%`, background: "#34C759" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-gray-400">Capacity</span>
                <span className="font-semibold text-gray-900">{bus.parcelsOnboard}/{bus.capacity}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${capacityPct}%`, background: "#D82C2C" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Parcels */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(0,0,0,0.02)" }}>
          <h3 className="text-[13px] font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Box className="w-3.5 h-3.5" style={{ color: "#FF9500" }} /> Parcels
          </h3>
          <div className="text-[28px] font-bold tracking-tight" style={{ color: "#D82C2C" }}>{bus.parcelsOnboard}</div>
          <div className="text-[12px] text-gray-400">{bus.capacity - bus.parcelsOnboard} spaces remaining</div>
        </div>
      </div>
    </div>
  );
}

function formatTripTime(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatTripDuration(start: string, end: string): string {
  if (!start || !end) return "--";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

export default function FleetPage() {
  const { token } = useAuth();
  const [selectedBus, setSelectedBus] = useState<(typeof allBuses)[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripHistory | null>(null);
  const [tripFilter, setTripFilter] = useState<"all" | "completed" | "delayed" | "in_progress">("all");
  const [showTripHistory, setShowTripHistory] = useState(false);

  const allTrips = useMemo(() => getTripHistory(), []);
  const filteredTrips = useMemo(() => {
    if (tripFilter === "all") return allTrips.slice(0, 30);
    return allTrips.filter((t) => t.status === tripFilter).slice(0, 30);
  }, [allTrips, tripFilter]);

  const activeBuses = allBuses.filter((b) => b.status === "active").length;
  const maintenanceBuses = allBuses.filter((b) => b.status === "maintenance").length;
  const filteredBuses = filterStatus ? allBuses.filter((b) => b.status === filterStatus) : allBuses;

  const handleBusClick = useCallback((bus: (typeof allBuses)[0]) => {
    setSelectedBus(bus);
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Buses" value={allBuses.length.toString()} change={5.2} icon={Truck} gradient="linear-gradient(135deg, #D82C2C, #E74C3C)" />
        <StatsCard title="Active" value={activeBuses.toString()} change={8.5} icon={Activity} gradient="linear-gradient(135deg, #34C759, #30D158)" />
        <StatsCard title="On Route" value={(activeBuses - 2).toString()} change={3.2} icon={MapPin} gradient="linear-gradient(135deg, #D82C2C, #FF6B6B)" />
        <StatsCard title="Maintenance" value={maintenanceBuses.toString()} change={-2.1} icon={Truck} gradient="linear-gradient(135deg, #FF9500, #FFCC00)" />
      </div>

      {/* Map + Detail */}
      <div className={`grid gap-6 ${selectedBus ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
        <div className={`rb-card-flat p-6 ${selectedBus ? "lg:col-span-2" : ""}`}>
          <h3 className="text-[16px] font-bold text-gray-900 mb-4">Live Fleet Map</h3>
          <FleetMap buses={filteredBuses} onBusClick={handleBusClick} selectedBusId={selectedBus?.id} />
        </div>
        {selectedBus && <BusDetailPanel bus={selectedBus} onClose={() => setSelectedBus(null)} />}
      </div>

      {/* Status Filter */}
      <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
        {[
          { label: "All Buses", value: null },
          { label: "Active", value: "active" },
          { label: "Idle", value: "idle" },
          { label: "Maintenance", value: "maintenance" },
        ].map((filter) => (
          <button
            key={String(filter.value)}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              filterStatus === filter.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Bus List */}
      <div className="rb-card-flat overflow-hidden">
        <div className="overflow-x-auto">
          <table className="rb-table">
            <thead>
              <tr>
                <th>Bus ID</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Location</th>
                <th>Speed</th>
                <th>Parcels</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.map((bus) => (
                <tr key={bus.id} onClick={() => setSelectedBus(bus)} className="cursor-pointer">
                  <td className="font-semibold" style={{ color: "#D82C2C" }}>{bus.busNumber}</td>
                  <td>
                    <span className="px-2 py-1 rounded-lg text-[12px] font-medium" style={{ background: "rgba(216,44,44,0.06)", color: "#D82C2C" }}>
                      {bus.route}
                    </span>
                  </td>
                  <td className="text-gray-700">{bus.driver}</td>
                  <td><StatusBadge status={bus.status} /></td>
                  <td className="text-gray-500">{bus.lastLocation}</td>
                  <td className="font-medium text-gray-900">{bus.speed} km/h</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-[13px]">{bus.parcelsOnboard}</span>
                      <div className="w-14 rounded-full h-1.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(bus.parcelsOnboard / bus.capacity) * 100}%`, background: "#D82C2C" }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trip History */}
      <div className="rb-card-flat overflow-hidden">
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D82C2C, #E74C3C)", boxShadow: "0 2px 8px rgba(216,44,44,0.3)" }}>
              <History className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">Trip History</h3>
              <p className="text-[13px] text-gray-500">Past trips with route replay and stop details</p>
            </div>
          </div>
          <button
            onClick={() => setShowTripHistory(!showTripHistory)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
              showTripHistory
                ? "text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            style={showTripHistory ? { background: "#D82C2C", boxShadow: "0 2px 8px rgba(216,44,44,0.3)" } : { background: "rgba(0,0,0,0.04)" }}
          >
            {showTripHistory ? "Hide Trips" : "Show Trip History"}
          </button>
        </div>

        {showTripHistory && (
          <>
            {selectedTrip && (
              <div className="p-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <TripHistoryPlayer trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
              </div>
            )}

            {/* Trip Filters */}
            <div className="flex gap-1 p-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
                {[
                  { label: "All Trips", value: "all" as const },
                  { label: "Completed", value: "completed" as const },
                  { label: "Delayed", value: "delayed" as const },
                  { label: "In Progress", value: "in_progress" as const },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setTripFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                      tripFilter === filter.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip List */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredTrips.map((trip) => (
                <button
                  key={trip.tripId}
                  onClick={() => setSelectedTrip(trip)}
                  className={`w-full text-left p-4 transition-all duration-150 flex items-center gap-4 ${
                    selectedTrip?.tripId === trip.tripId ? "bg-red-50/50" : "hover:bg-black/[0.02]"
                  }`}
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.03)",
                    borderLeft: selectedTrip?.tripId === trip.tripId ? "3px solid #D82C2C" : "3px solid transparent",
                  }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    trip.status === "completed" ? "bg-green-500" : trip.status === "delayed" ? "bg-red-500" : "bg-blue-500"
                  }`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-[13px] text-gray-900">{trip.route}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        trip.status === "completed" ? "bg-green-50 text-green-600" :
                        trip.status === "delayed" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-600"
                      }`}>
                        {trip.status === "in_progress" ? "In Progress" : trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {trip.busNumber} &middot; {trip.driverName} &middot; {trip.totalDistance} km
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-medium text-gray-700">{formatTripTime(trip.startTime)}</p>
                    <p className="text-[11px] text-gray-400 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTripDuration(trip.startTime, trip.endTime || trip.etaOriginal)}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
