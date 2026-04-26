"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/ui/StatsCard";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { Truck, MapPin, User, Gauge, Box, X, Navigation, Activity } from "lucide-react";

const FleetMap = dynamic(() => import("@/components/ui/FleetMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

const MOCK_BUSES = [
  {
    id: "BUS-001",
    busNumber: "KA-05-AB-1001",
    route: "HYD → MUM",
    driver: "Ramesh Kumar",
    driverPhone: "+91-9876543001",
    status: "active",
    lastLocation: "Telangana",
    latitude: 17.36,
    longitude: 78.47,
    speed: 68,
    parcelsOnboard: 24,
    capacity: 50,
    registrationDate: "2024-01-15",
  },
  {
    id: "BUS-002",
    busNumber: "MH-02-CD-2001",
    route: "MUM → BLR",
    driver: "Priya Sharma",
    driverPhone: "+91-9876543002",
    status: "active",
    lastLocation: "Maharashtra",
    latitude: 19.07,
    longitude: 72.88,
    speed: 72,
    parcelsOnboard: 31,
    capacity: 50,
    registrationDate: "2024-02-20",
  },
  {
    id: "BUS-003",
    busNumber: "DL-01-EF-3001",
    route: "DEL → KOL",
    driver: "Arun Verma",
    driverPhone: "+91-9876543003",
    status: "active",
    lastLocation: "Delhi",
    latitude: 28.70,
    longitude: 77.10,
    speed: 65,
    parcelsOnboard: 28,
    capacity: 50,
    registrationDate: "2024-03-10",
  },
  {
    id: "BUS-004",
    busNumber: "KA-07-GH-4001",
    route: "BLR → CHE",
    driver: "Deepak Reddy",
    driverPhone: "+91-9876543004",
    status: "active",
    lastLocation: "Karnataka",
    latitude: 12.97,
    longitude: 77.59,
    speed: 58,
    parcelsOnboard: 19,
    capacity: 50,
    registrationDate: "2024-04-05",
  },
  {
    id: "BUS-005",
    busNumber: "TN-09-IJ-5001",
    route: "CHE → PUN",
    driver: "Kavya Iyer",
    driverPhone: "+91-9876543005",
    status: "active",
    lastLocation: "Tamil Nadu",
    latitude: 13.08,
    longitude: 80.27,
    speed: 70,
    parcelsOnboard: 35,
    capacity: 50,
    registrationDate: "2024-05-12",
  },
  {
    id: "BUS-006",
    busNumber: "MH-03-KL-6001",
    route: "PUN → AHM",
    driver: "Sanjana Singh",
    driverPhone: "+91-9876543006",
    status: "idle",
    lastLocation: "Pune",
    latitude: 18.52,
    longitude: 73.85,
    speed: 0,
    parcelsOnboard: 12,
    capacity: 50,
    registrationDate: "2024-06-18",
  },
  {
    id: "BUS-007",
    busNumber: "WB-11-MN-7001",
    route: "KOL → HYD",
    driver: "Jyoti Dutta",
    driverPhone: "+91-9876543007",
    status: "active",
    lastLocation: "West Bengal",
    latitude: 22.57,
    longitude: 88.36,
    speed: 62,
    parcelsOnboard: 26,
    capacity: 50,
    registrationDate: "2024-07-22",
  },
  {
    id: "BUS-008",
    busNumber: "GJ-08-OP-8001",
    route: "AHM → MUM",
    driver: "Vikas Patel",
    driverPhone: "+91-9876543008",
    status: "active",
    lastLocation: "Gujarat",
    latitude: 23.02,
    longitude: 72.57,
    speed: 66,
    parcelsOnboard: 29,
    capacity: 50,
    registrationDate: "2024-08-08",
  },
  {
    id: "BUS-009",
    busNumber: "KA-06-QR-9001",
    route: "BLR → HYD",
    driver: "Suresh Nair",
    driverPhone: "+91-9876543009",
    status: "maintenance",
    lastLocation: "Karnataka (Depot)",
    latitude: 12.97,
    longitude: 77.59,
    speed: 0,
    parcelsOnboard: 0,
    capacity: 50,
    registrationDate: "2023-12-01",
  },
  {
    id: "BUS-010",
    busNumber: "MH-04-ST-10001",
    route: "MUM → DEL",
    driver: "Rohan Sharma",
    driverPhone: "+91-9876543010",
    status: "active",
    lastLocation: "Maharashtra",
    latitude: 19.07,
    longitude: 72.88,
    speed: 69,
    parcelsOnboard: 33,
    capacity: 50,
    registrationDate: "2024-09-14",
  },
];

// Generate more buses to reach 35 total
const generateMockBuses = () => {
  const buses = [...MOCK_BUSES];
  const routes = [
    "HYD → MUM",
    "MUM → BLR",
    "BLR → DEL",
    "CHE → PUN",
    "KOL → AHM",
    "DEL → HYD",
    "PUN → MUM",
    "AHM → BLR",
  ];
  const driverNames = ["Ramesh", "Priya", "Arun", "Deepak", "Kavya", "Sanjana", "Jyoti", "Vikas"];
  const lastNames = ["Kumar", "Sharma", "Verma", "Reddy", "Iyer", "Singh", "Dutta", "Patel"];
  const statuses = ["active", "idle", "active", "active", "active", "idle", "active", "maintenance"];

  for (let i = 10; i < 35; i++) {
    const route = routes[i % routes.length];
    const firstName = driverNames[i % driverNames.length];
    const lastName = lastNames[i % lastNames.length];
    const status = statuses[(i + 2) % statuses.length];
    const stateCode = ["KA", "MH", "DL", "TN", "KA", "WB", "GJ", "TS"][i % 8];

    buses.push({
      id: `BUS-${String(i + 1).padStart(3, "0")}`,
      busNumber: `${stateCode}-${String((i % 15) + 1).padStart(2, "0")}-UV-${String(i + 1001).padStart(4, "0")}`,
      route: route,
      driver: `${firstName} ${lastName}`,
      driverPhone: `+91-${9800000000 + i}`,
      status: status,
      lastLocation: ["Telangana", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "West Bengal", "Gujarat"][i % 7],
      latitude: 12 + Math.random() * 16,
      longitude: 72 + Math.random() * 16,
      speed: status === "active" ? Math.floor(55 + Math.random() * 30) : 0,
      parcelsOnboard: status === "active" ? Math.floor(10 + Math.random() * 35) : Math.floor(Math.random() * 5),
      capacity: 50,
      registrationDate: `202${Math.floor(i / 10)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
    });
  }

  return buses;
};

const allBuses = generateMockBuses();

interface BusDetailPanelProps {
  bus: (typeof allBuses)[0] | null;
  onClose: () => void;
}

function BusDetailPanel({ bus, onClose }: BusDetailPanelProps) {
  if (!bus) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-xl border-l border-gray-200 z-40 flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">{bus.busNumber}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Bus Status</h3>
            <StatusBadge status={bus.status} />
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Current Route:</span>
              <p className="font-medium text-gray-900">{bus.route}</p>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <p className="font-medium text-gray-900">{bus.lastLocation}</p>
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Driver Information
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium text-gray-900">{bus.driver}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <p className="font-medium text-gray-900">{bus.driverPhone}</p>
            </div>
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            GPS Coordinates
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Latitude:</span>
              <p className="font-mono text-gray-900">{bus.latitude.toFixed(4)}</p>
            </div>
            <div>
              <span className="text-gray-500">Longitude:</span>
              <p className="font-mono text-gray-900">{bus.longitude.toFixed(4)}</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Performance Metrics
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Speed:</span>
                <span className="font-medium text-gray-900">{bus.speed} km/h</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${(bus.speed / 120) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Capacity Used:</span>
                <span className="font-medium text-gray-900">{bus.parcelsOnboard}/{bus.capacity}</span>
              </div>
              <div className="w-full bg-gray-300 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${(bus.parcelsOnboard / bus.capacity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Parcels Manifest */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Box className="w-4 h-4" />
            Parcels Onboard
          </h3>
          <div className="text-3xl font-bold text-brand-600 mb-2">{bus.parcelsOnboard}</div>
          <div className="text-sm text-gray-600">
            {bus.capacity - bus.parcelsOnboard} {bus.capacity - bus.parcelsOnboard === 1 ? "space" : "spaces"} remaining
          </div>
        </div>

        {/* Registration Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Registration</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Bus ID:</span>
              <p className="font-mono text-gray-900">{bus.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Registered Date:</span>
              <p className="text-gray-900">{bus.registrationDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FleetPage() {
  const { token } = useAuth();
  const [selectedBus, setSelectedBus] = useState<(typeof allBuses)[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const activeBuses = allBuses.filter((b) => b.status === "active").length;
  const idleBuses = allBuses.filter((b) => b.status === "idle").length;
  const maintenanceBuses = allBuses.filter((b) => b.status === "maintenance").length;

  const filteredBuses = filterStatus ? allBuses.filter((b) => b.status === filterStatus) : allBuses;

  const handleBusClick = useCallback((bus: (typeof allBuses)[0]) => {
    setSelectedBus(bus);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor bus locations and parcel status in real-time</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Buses"
          value={allBuses.length.toString()}
          change={5.2}
          icon={Truck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Active"
          value={activeBuses.toString()}
          change={8.5}
          icon={Activity}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
        <StatsCard
          title="On Route"
          value={(activeBuses - 2).toString()}
          change={3.2}
          icon={MapPin}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Maintenance"
          value={maintenanceBuses.toString()}
          change={-2.1}
          icon={Truck}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      {/* Live Map Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Live Fleet Map</h3>
        <FleetMap
          buses={filteredBuses}
          onBusClick={handleBusClick}
          selectedBusId={selectedBus?.id}
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {[
          { label: "All Buses", value: null },
          { label: "Active", value: "active" },
          { label: "Idle", value: "idle" },
          { label: "Maintenance", value: "maintenance" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === filter.value
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Bus List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Bus ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Route</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Driver</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Last Location</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Speed</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Parcels</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.map((bus) => (
                <tr
                  key={bus.id}
                  onClick={() => setSelectedBus(bus)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-brand-600">{bus.busNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{bus.route}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{bus.driver}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={bus.status} />
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{bus.lastLocation}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{bus.speed} km/h</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{bus.parcelsOnboard}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${(bus.parcelsOnboard / bus.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bus Detail Panel */}
      {selectedBus && <BusDetailPanel bus={selectedBus} onClose={() => setSelectedBus(null)} />}
    </div>
  );
}
