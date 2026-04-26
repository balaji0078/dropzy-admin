"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { formatDate } from "@/lib/utils";
import { Search, Filter, X, MapPin, Phone, Mail, Package, Scale, Clock, Plus, ChevronDown } from "lucide-react";
import { INDIA_PINCODES, INDIA_STATES, getCityCode, searchPincodes } from "@/lib/india-pincodes";
import type { IndianLocation } from "@/lib/india-pincodes";

// Apple design tokens
const APPLE_BLUE = "#007AFF";
const APPLE_GREEN = "#34C759";
const APPLE_ORANGE = "#FF9500";
const APPLE_PURPLE = "#5856D6";

const PARCEL_STATUSES = [
  { id: "all", label: "All" },
  { id: "booked", label: "Booked" },
  { id: "accepted", label: "Accepted" },
  { id: "in_transit", label: "In Transit" },
  { id: "arrived_at_office", label: "Arrived at Office" },
  { id: "ready_for_pickup", label: "Ready for Pickup" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

const PARCEL_PHASES = [
  "booked",
  "accepted",
  "in_transit",
  "arrived_at_office",
  "ready_for_pickup",
  "delivered",
];

// All-India pincodes database - 500+ entries covering all 28 states + 8 UTs
const INDIAN_LOCATIONS = INDIA_PINCODES;

const MOCK_PARCELS = [
  {
    id: "DPZ-2026-00001",
    trackingId: "DPZ-2026-00001",
    sender: { name: "Rajesh Kumar", city: "Hyderabad", district: "Hyderabad", pincode: "500001", phone: "+91-9876543210", email: "rajesh@example.com", address: "123 Main St" },
    receiver: { name: "Priya Singh", city: "Mumbai", district: "Mumbai City", pincode: "400001", phone: "+91-9876543211", email: "priya@example.com", address: "456 Park Ave" },
    route: "HYD-500001 → MUM-400001",
    packageType: "Electronics",
    weight: 2.5,
    dimensions: "20x15x10 cm",
    value: 15000,
    ewayBill: "12345678901234",
    status: "in_transit",
    bookedDate: "2026-04-20",
    timeline: [
      { phase: "booked", timestamp: "2026-04-20 10:30" },
      { phase: "accepted", timestamp: "2026-04-20 11:15" },
      { phase: "in_transit", timestamp: "2026-04-21 08:00" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-20 10:35" },
      { type: "WhatsApp", message: "Your parcel is in transit", timestamp: "2026-04-21 08:05" },
    ],
  },
  {
    id: "DPZ-2026-00002",
    trackingId: "DPZ-2026-00002",
    sender: { name: "Amit Patel", city: "Bangalore", district: "Bangalore Urban", pincode: "560001", phone: "+91-9876543212", email: "amit@example.com", address: "789 Tech Park" },
    receiver: { name: "Neha Gupta", city: "Delhi", district: "New Delhi", pincode: "110001", phone: "+91-9876543213", email: "neha@example.com", address: "101 Business Plaza" },
    route: "BLR-560001 → DEL-110001",
    packageType: "Documents",
    weight: 0.5,
    dimensions: "30x20x5 cm",
    value: 5000,
    ewayBill: "12345678901235",
    status: "accepted",
    bookedDate: "2026-04-25",
    timeline: [
      { phase: "booked", timestamp: "2026-04-25 14:00" },
      { phase: "accepted", timestamp: "2026-04-25 15:30" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-25 14:05" },
    ],
  },
  {
    id: "DPZ-2026-00003",
    trackingId: "DPZ-2026-00003",
    sender: { name: "Sanjay Reddy", city: "Velachery", district: "Chennai", pincode: "600042", phone: "+91-9876543214", email: "sanjay@example.com", address: "202 Tech Drive" },
    receiver: { name: "Kavya Sharma", city: "Coimbatore", district: "Coimbatore", pincode: "641001", phone: "+91-9876543215", email: "kavya@example.com", address: "303 Business Street" },
    route: "CHE-600042 → CBE-641001",
    packageType: "Clothing",
    weight: 1.2,
    dimensions: "25x20x15 cm",
    value: 3500,
    ewayBill: "12345678901236",
    status: "delivered",
    bookedDate: "2026-04-18",
    timeline: [
      { phase: "booked", timestamp: "2026-04-18 09:00" },
      { phase: "accepted", timestamp: "2026-04-18 10:00" },
      { phase: "in_transit", timestamp: "2026-04-19 08:00" },
      { phase: "arrived_at_office", timestamp: "2026-04-24 15:00" },
      { phase: "ready_for_pickup", timestamp: "2026-04-24 16:30" },
      { phase: "delivered", timestamp: "2026-04-25 18:00" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-18 09:05" },
      { type: "WhatsApp", message: "Your parcel is in transit", timestamp: "2026-04-19 08:10" },
      { type: "SMS", message: "Your parcel arrived at office", timestamp: "2026-04-24 15:10" },
      { type: "SMS", message: "Ready for pickup", timestamp: "2026-04-24 16:35" },
      { type: "WhatsApp", message: "Your parcel has been delivered", timestamp: "2026-04-25 18:05" },
    ],
  },
  {
    id: "DPZ-2026-00004",
    trackingId: "DPZ-2026-00004",
    sender: { name: "Deepak Verma", city: "Mumbai", district: "Mumbai City", pincode: "400001", phone: "+91-9876543216", email: "deepak@example.com", address: "404 Market Complex" },
    receiver: { name: "Anjali Joshi", city: "Bangalore", district: "Bangalore Urban", pincode: "560001", phone: "+91-9876543217", email: "anjali@example.com", address: "505 Commerce Center" },
    route: "MUM-400001 → BLR-560001",
    packageType: "Furniture",
    weight: 5.0,
    dimensions: "100x50x50 cm",
    value: 25000,
    ewayBill: "12345678901237",
    status: "ready_for_pickup",
    bookedDate: "2026-04-22",
    timeline: [
      { phase: "booked", timestamp: "2026-04-22 11:00" },
      { phase: "accepted", timestamp: "2026-04-22 12:00" },
      { phase: "in_transit", timestamp: "2026-04-23 09:00" },
      { phase: "arrived_at_office", timestamp: "2026-04-24 18:00" },
      { phase: "ready_for_pickup", timestamp: "2026-04-25 10:00" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-22 11:05" },
      { type: "WhatsApp", message: "Your parcel is in transit", timestamp: "2026-04-23 09:10" },
      { type: "SMS", message: "Ready for pickup", timestamp: "2026-04-25 10:05" },
    ],
  },
  {
    id: "DPZ-2026-00005",
    trackingId: "DPZ-2026-00005",
    sender: { name: "Vikram Singh", city: "Kolkata", district: "South 24 Parganas", pincode: "700001", phone: "+91-9876543218", email: "vikram@example.com", address: "606 Shopping Mall" },
    receiver: { name: "Pooja Mishra", city: "Ahmedabad", district: "Ahmedabad", pincode: "380001", phone: "+91-9876543219", email: "pooja@example.com", address: "707 Trade Center" },
    route: "KOL-700001 → AHM-380001",
    packageType: "Books",
    weight: 3.0,
    dimensions: "40x30x20 cm",
    value: 8500,
    ewayBill: "12345678901238",
    status: "arrived_at_office",
    bookedDate: "2026-04-23",
    timeline: [
      { phase: "booked", timestamp: "2026-04-23 13:00" },
      { phase: "accepted", timestamp: "2026-04-23 14:15" },
      { phase: "in_transit", timestamp: "2026-04-24 09:00" },
      { phase: "arrived_at_office", timestamp: "2026-04-25 16:30" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-23 13:05" },
      { type: "WhatsApp", message: "Your parcel is in transit", timestamp: "2026-04-24 09:10" },
      { type: "SMS", message: "Your parcel arrived at office", timestamp: "2026-04-25 16:35" },
    ],
  },
  {
    id: "DPZ-2026-00006",
    trackingId: "DPZ-2026-00006",
    sender: { name: "Akshay Desai", city: "Hyderabad", district: "Hyderabad", pincode: "500001", phone: "+91-9876543220", email: "akshay@example.com", address: "808 Plaza Tower" },
    receiver: { name: "Divya Iyer", city: "Mumbai", district: "Mumbai City", pincode: "400001", phone: "+91-9876543221", email: "divya@example.com", address: "909 High Street" },
    route: "HYD-500001 → MUM-400001",
    packageType: "Cosmetics",
    weight: 0.8,
    dimensions: "15x12x10 cm",
    value: 2500,
    ewayBill: "12345678901239",
    status: "in_transit",
    bookedDate: "2026-04-26",
    timeline: [
      { phase: "booked", timestamp: "2026-04-26 08:00" },
      { phase: "accepted", timestamp: "2026-04-26 09:30" },
      { phase: "in_transit", timestamp: "2026-04-26 10:00" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-26 08:05" },
      { type: "WhatsApp", message: "Your parcel is in transit", timestamp: "2026-04-26 10:05" },
    ],
  },
  {
    id: "DPZ-2026-00007",
    trackingId: "DPZ-2026-00007",
    sender: { name: "Suresh Nair", city: "Bangalore", district: "Bangalore Urban", pincode: "560001", phone: "+91-9876543222", email: "suresh@example.com", address: "1010 Silk Street" },
    receiver: { name: "Meera Dutta", city: "Delhi", district: "New Delhi", pincode: "110001", phone: "+91-9876543223", email: "meera@example.com", address: "1111 Innovation Drive" },
    route: "BLR-560001 → DEL-110001",
    packageType: "Toys",
    weight: 2.0,
    dimensions: "35x25x20 cm",
    value: 4500,
    ewayBill: "12345678901240",
    status: "booked",
    bookedDate: "2026-04-26",
    timeline: [
      { phase: "booked", timestamp: "2026-04-26 15:00" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-26 15:05" },
    ],
  },
  {
    id: "DPZ-2026-00008",
    trackingId: "DPZ-2026-00008",
    sender: { name: "Harish Kulkarni", city: "Madurai", district: "Madurai", pincode: "625001", phone: "+91-9876543224", email: "harish@example.com", address: "1212 Craft Lane" },
    receiver: { name: "Sneha Rao", city: "Tirunelveli", district: "Tirunelveli", pincode: "627001", phone: "+91-9876543225", email: "sneha@example.com", address: "1313 Design Street" },
    route: "MDU-625001 → TNV-627001",
    packageType: "Art Supplies",
    weight: 1.5,
    dimensions: "30x25x15 cm",
    value: 3000,
    ewayBill: "12345678901241",
    status: "accepted",
    bookedDate: "2026-04-26",
    timeline: [
      { phase: "booked", timestamp: "2026-04-26 12:00" },
      { phase: "accepted", timestamp: "2026-04-26 13:30" },
    ],
    communications: [
      { type: "SMS", message: "Your parcel has been booked", timestamp: "2026-04-26 12:05" },
    ],
  },
];

// Generate additional mock parcels to reach 50
const generateMockParcels = () => {
  const senderNames = ["Rajesh", "Amit", "Sanjay", "Deepak", "Vikram", "Akshay", "Suresh", "Harish", "Ramesh", "Naveen"];
  const receiverNames = ["Priya", "Neha", "Kavya", "Anjali", "Pooja", "Divya", "Meera", "Sneha", "Anjali", "Ritika"];
  const packageTypes = ["Electronics", "Documents", "Clothing", "Furniture", "Books", "Cosmetics", "Toys", "Art Supplies", "Gifts", "Food"];
  const statuses = ["booked", "accepted", "in_transit", "arrived_at_office", "ready_for_pickup", "delivered"];

  const parcels = [...MOCK_PARCELS];

  for (let i = 8; i < 50; i++) {
    const senderLocation = INDIAN_LOCATIONS[Math.floor(Math.random() * INDIAN_LOCATIONS.length)];
    const receiverLocation = INDIAN_LOCATIONS[Math.floor(Math.random() * INDIAN_LOCATIONS.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const senderName = senderNames[Math.floor(Math.random() * senderNames.length)];
    const receiverName = receiverNames[Math.floor(Math.random() * receiverNames.length)];

    parcels.push({
      id: `DPZ-2026-${String(i + 1).padStart(5, "0")}`,
      trackingId: `DPZ-2026-${String(i + 1).padStart(5, "0")}`,
      sender: {
        name: `${senderName} ${["Kumar", "Patel", "Singh", "Sharma", "Verma"][i % 5]}`,
        city: senderLocation.city,
        district: senderLocation.district,
        pincode: senderLocation.pincode,
        phone: `+91-${9800000000 + i}`,
        email: `sender${i}@example.com`,
        address: `${100 + i} Address Street`,
      },
      receiver: {
        name: `${receiverName} ${["Gupta", "Iyer", "Nair", "Dutta", "Saxena"][i % 5]}`,
        city: receiverLocation.city,
        district: receiverLocation.district,
        pincode: receiverLocation.pincode,
        phone: `+91-${9900000000 + i}`,
        email: `receiver${i}@example.com`,
        address: `${200 + i} Recipient Avenue`,
      },
      route: `${getCityCode(senderLocation.city)}-${senderLocation.pincode} → ${getCityCode(receiverLocation.city)}-${receiverLocation.pincode}`,
      packageType: packageTypes[i % packageTypes.length],
      weight: parseFloat((Math.random() * 10).toFixed(2)),
      dimensions: `${20 + i % 30}x${15 + i % 20}x${10 + i % 15} cm`,
      value: Math.floor(1000 + Math.random() * 30000),
      ewayBill: `${123456789012 + i}`,
      status: status,
      bookedDate: `2026-${String((Math.floor(i / 8) % 4) + 2).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      timeline: [
        { phase: "booked", timestamp: "2026-04-20 10:30" },
        { phase: "accepted", timestamp: "2026-04-20 11:15" },
      ],
      communications: [],
    });
  }

  return parcels;
};

const allParcels = generateMockParcels();

interface ParcelDetailModalProps {
  parcel: (typeof allParcels)[0] | null;
  onClose: () => void;
}

function ParcelDetailModal({ parcel, onClose }: ParcelDetailModalProps) {
  if (!parcel) return null;

  return (
    <Modal open={!!parcel} onClose={onClose} title={parcel?.trackingId || "Parcel Details"}>
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-bold text-gray-900">{parcel.trackingId}</h2>
          <button onClick={onClose} className="p-1 hover:opacity-70 rounded-xl transition-opacity">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sender & Receiver */}
          <div className="grid grid-cols-2 gap-6">
            <div className="glass-card-static p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3 text-[13px]">Sender</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium text-gray-900">{parcel.sender.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">City:</span>
                  <span className="text-gray-900">{parcel.sender.city}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Pincode:</span>
                  <span className="text-gray-900">{parcel.sender.pincode}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">District:</span>
                  <span className="text-gray-900">{parcel.sender.district}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900">{parcel.sender.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{parcel.sender.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="text-gray-900">{parcel.sender.address}</span>
                </div>
              </div>
            </div>

            <div className="glass-card-static p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3 text-[13px]">Receiver</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium text-gray-900">{parcel.receiver.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">City:</span>
                  <span className="text-gray-900">{parcel.receiver.city}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Pincode:</span>
                  <span className="text-gray-900">{parcel.receiver.pincode}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">District:</span>
                  <span className="text-gray-900">{parcel.receiver.district}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-gray-900">{parcel.receiver.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{parcel.receiver.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="text-gray-900">{parcel.receiver.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="glass-card-static p-4 rounded-xl" style={{ borderBottom: "1px solid rgba(0,122,255,0.12)" }}>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-[13px]">
              <Package className="w-4 h-4" style={{ color: APPLE_BLUE }} />
              Package Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-gray-500 text-[12px]">Type:</span>
                <p className="font-medium text-gray-900">{parcel.packageType}</p>
              </div>
              <div>
                <span className="text-gray-500 text-[12px]">Weight:</span>
                <p className="font-medium text-gray-900">{parcel.weight} kg</p>
              </div>
              <div>
                <span className="text-gray-500 text-[12px]">Dimensions:</span>
                <p className="font-medium text-gray-900">{parcel.dimensions}</p>
              </div>
              <div>
                <span className="text-gray-500 text-[12px]">Value:</span>
                <p className="font-medium text-gray-900">₹{parcel.value.toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 text-[12px]">E-way Bill:</span>
                <p className="font-medium text-gray-900">{parcel.ewayBill}</p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-[13px]">
              <Clock className="w-4 h-4" style={{ color: APPLE_BLUE }} />
              Delivery Timeline
            </h3>
            <div className="relative">
              {PARCEL_PHASES.map((phase, index) => {
                const timelineEntry = parcel.timeline.find((t) => t.phase === phase);
                const isCompleted = parcel.timeline.some((t) => t.phase === phase);
                const phaseLabel = phase
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");

                return (
                  <div key={phase} className="flex gap-4 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          backgroundColor: isCompleted ? APPLE_GREEN : "rgba(0,0,0,0.08)",
                          color: isCompleted ? "white" : "rgba(0,0,0,0.4)",
                        }}
                      >
                        {index + 1}
                      </div>
                      {index < PARCEL_PHASES.length - 1 && (
                        <div
                          className="w-0.5 h-12"
                          style={{
                            backgroundColor: isCompleted ? APPLE_GREEN : "rgba(0,0,0,0.08)",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-medium text-gray-900 text-[13px]">{phaseLabel}</p>
                      {timelineEntry && (
                        <p className="text-[12px] text-gray-500">{timelineEntry.timestamp}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Communications Log */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-[13px]">Communications</h3>
            <div className="space-y-3">
              {parcel.communications.length > 0 ? (
                parcel.communications.map((comm, idx) => (
                  <div key={idx} className="glass-card-static p-3 rounded-lg" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 text-[13px]">{comm.type}</span>
                      <span className="text-[11px] text-gray-500">{comm.timestamp}</span>
                    </div>
                    <p className="text-gray-700 text-[13px]">{comm.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-[13px]">No communications yet</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 apple-btn apple-btn-primary py-2 rounded-xl font-medium text-[13px]"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

// Build dropdown options from pincodes
const stateOptions = INDIA_STATES.map((s) => ({ label: s, value: s }));

const pincodeOptions = INDIA_PINCODES.map((loc) => ({
  label: `${loc.city} - ${loc.pincode}`,
  value: `${loc.city}|${loc.pincode}`,
  sublabel: `${loc.district}, ${loc.state}`,
}));

const getDistrictOptions = (state: string) => {
  if (!state) return [];
  const districts = Array.from(
    new Set(INDIA_PINCODES.filter((l) => l.state === state).map((l) => l.district))
  ).sort();
  return districts.map((d) => ({ label: d, value: d }));
};

const getPincodeOptionsForFilters = (state: string, district: string) => {
  let locs = INDIA_PINCODES;
  if (state) locs = locs.filter((l) => l.state === state);
  if (district) locs = locs.filter((l) => l.district === district);
  return locs.map((l) => ({
    label: `${l.city} - ${l.pincode}`,
    value: l.pincode,
    sublabel: `${l.district}, ${l.state}`,
  }));
};

export default function ParcelsPage() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedParcel, setSelectedParcel] = useState<(typeof allParcels)[0] | null>(null);

  // Filter dropdowns state
  const [filterState, setFilterState] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterPincode, setFilterPincode] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // New Parcel modal state
  const [showNewParcel, setShowNewParcel] = useState(false);
  const [newParcelPickup, setNewParcelPickup] = useState("");
  const [newParcelDestination, setNewParcelDestination] = useState("");

  // Reset district when state changes
  const handleStateChange = useCallback((val: string) => {
    setFilterState(val);
    setFilterDistrict("");
    setFilterPincode("");
  }, []);

  const handleDistrictChange = useCallback((val: string) => {
    setFilterDistrict(val);
    setFilterPincode("");
  }, []);

  const districtOptions = useMemo(() => getDistrictOptions(filterState), [filterState]);
  const filterPincodeOptions = useMemo(() => getPincodeOptionsForFilters(filterState, filterDistrict), [filterState, filterDistrict]);

  const activeFilterCount = [filterState, filterDistrict, filterPincode].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterState("");
    setFilterDistrict("");
    setFilterPincode("");
  };

  const filteredParcels = useMemo(() => {
    return allParcels.filter((parcel) => {
      const matchesStatus = selectedStatus === "all" || parcel.status === selectedStatus;
      const matchesSearch =
        searchQuery === "" ||
        parcel.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.receiver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.sender.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.receiver.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.sender.pincode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.receiver.pincode.toLowerCase().includes(searchQuery.toLowerCase());

      // Location filters - match on either sender or receiver
      const matchesState = !filterState || (() => {
        const senderLoc = INDIA_PINCODES.find((l) => l.pincode === parcel.sender.pincode);
        const receiverLoc = INDIA_PINCODES.find((l) => l.pincode === parcel.receiver.pincode);
        return senderLoc?.state === filterState || receiverLoc?.state === filterState;
      })();

      const matchesDistrict = !filterDistrict || (() => {
        return parcel.sender.district === filterDistrict || parcel.receiver.district === filterDistrict;
      })();

      const matchesPincode = !filterPincode ||
        parcel.sender.pincode === filterPincode ||
        parcel.receiver.pincode === filterPincode;

      return matchesStatus && matchesSearch && matchesState && matchesDistrict && matchesPincode;
    });
  }, [searchQuery, selectedStatus, filterState, filterDistrict, filterPincode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Parcel Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage parcel lifecycle and track deliveries</p>
        </div>
        <button
          onClick={() => setShowNewParcel(true)}
          className="flex items-center gap-2 px-4 py-2 apple-btn apple-btn-primary rounded-xl font-medium text-[13px] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Parcel
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="glass-card-static p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking ID, sender/receiver name, city, or pincode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="apple-input w-full pl-10 pr-4 py-2 text-[13px]"
              style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "text-white"
                : "text-gray-700 hover:opacity-80"
            }`}
            style={{
              backgroundColor: showFilters || activeFilterCount > 0 ? APPLE_BLUE : "rgba(0,0,0,0.04)",
              borderColor: showFilters || activeFilterCount > 0 ? APPLE_BLUE : "transparent",
            }}
          >
            <Filter className="w-4 h-4" />
            Location Filters
            {activeFilterCount > 0 && (
              <span className="text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: APPLE_BLUE }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Location Filter Dropdowns */}
        {showFilters && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-medium text-gray-700">Filter by Location</h4>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-[12px] hover:opacity-70 font-medium transition-opacity"
                  style={{ color: APPLE_BLUE }}
                >
                  Clear all filters
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SearchableDropdown
                options={stateOptions}
                value={filterState}
                onChange={handleStateChange}
                placeholder="Filter by State..."
              />
              <SearchableDropdown
                options={districtOptions}
                value={filterDistrict}
                onChange={handleDistrictChange}
                placeholder={filterState ? "Filter by District..." : "Select state first..."}
              />
              <SearchableDropdown
                options={filterPincodeOptions}
                value={filterPincode}
                onChange={setFilterPincode}
                placeholder="Filter by Pincode..."
              />
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1 mt-4 p-1 rounded-xl" style={{ background: "rgba(0,0,0,0.04)" }}>
          {PARCEL_STATUSES.map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                selectedStatus === status.id
                  ? "bg-white text-gray-900"
                  : "text-gray-500 hover:opacity-80"
              }`}
              style={{
                boxShadow: selectedStatus === status.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {status.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="mt-4 text-[13px] text-gray-600">
          Showing {filteredParcels.length} parcels {selectedStatus !== "all" && `with status "${selectedStatus}"`}
          {activeFilterCount > 0 && " (location filters active)"}
        </div>
      </div>

      {/* Parcels Table */}
      <div className="glass-card-static rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full apple-table">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }} className="bg-transparent">
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Tracking ID</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Pickup City</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Destination</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Route</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Package Type</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Weight</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-gray-600 uppercase tracking-wider">Booked Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredParcels.map((parcel) => (
                <tr
                  key={parcel.id}
                  onClick={() => setSelectedParcel(parcel)}
                  className="cursor-pointer transition-colors hover:opacity-75"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}
                >
                  <td className="py-3 px-4 text-[13px] font-medium" style={{ color: APPLE_BLUE }}>{parcel.trackingId}</td>
                  <td className="py-3 px-4 text-[13px] text-gray-900">{parcel.sender.city} - {parcel.sender.pincode}</td>
                  <td className="py-3 px-4 text-[13px] text-gray-900">{parcel.receiver.city} - {parcel.receiver.pincode}</td>
                  <td className="py-3 px-4 text-[13px] text-gray-600">{parcel.route}</td>
                  <td className="py-3 px-4 text-[13px] text-gray-600">{parcel.packageType}</td>
                  <td className="py-3 px-4 text-[13px] text-gray-600">{parcel.weight} kg</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={parcel.status} />
                  </td>
                  <td className="py-3 px-4 text-[13px] text-gray-600">{formatDate(parcel.bookedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParcels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-[15px] font-medium">No parcels found</p>
            <p className="text-[13px]">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Parcel Detail Modal */}
      <ParcelDetailModal parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />

      {/* New Parcel Modal */}
      <Modal open={showNewParcel} onClose={() => setShowNewParcel(false)} title="Book New Parcel">
        <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] font-bold text-gray-900">Book New Parcel</h2>
            <button onClick={() => setShowNewParcel(false)} className="p-1 hover:opacity-70 rounded-xl transition-opacity">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Pickup Location */}
            <div className="glass-card-static p-4 rounded-xl" style={{ borderBottom: "1px solid rgba(0,122,255,0.12)" }}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-[13px]">
                <MapPin className="w-4 h-4" style={{ color: APPLE_GREEN }} />
                Pickup Location
              </h3>
              <SearchableDropdown
                options={pincodeOptions}
                value={newParcelPickup}
                onChange={setNewParcelPickup}
                placeholder="Search city or pincode..."
                label="City & Pincode"
              />
              {newParcelPickup && (() => {
                const [city, pin] = newParcelPickup.split("|");
                const loc = INDIA_PINCODES.find((l) => l.pincode === pin && l.city === city);
                return loc ? (
                  <div className="mt-2 text-[11px] text-gray-500 bg-white rounded-lg p-2">
                    {loc.city}, {loc.district}, {loc.state} — {loc.pincode}
                  </div>
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Sender Name</label>
                  <input type="text" placeholder="Full name" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" placeholder="+91-XXXXXXXXXX" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Address</label>
                <input type="text" placeholder="Full address" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
              </div>
            </div>

            {/* Destination */}
            <div className="glass-card-static p-4 rounded-xl" style={{ borderBottom: "1px solid rgba(0,122,255,0.12)" }}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-[13px]">
                <MapPin className="w-4 h-4" style={{ color: APPLE_BLUE }} />
                Destination
              </h3>
              <SearchableDropdown
                options={pincodeOptions}
                value={newParcelDestination}
                onChange={setNewParcelDestination}
                placeholder="Search city or pincode..."
                label="City & Pincode"
              />
              {newParcelDestination && (() => {
                const [city, pin] = newParcelDestination.split("|");
                const loc = INDIA_PINCODES.find((l) => l.pincode === pin && l.city === city);
                return loc ? (
                  <div className="mt-2 text-[11px] text-gray-500 bg-white rounded-lg p-2">
                    {loc.city}, {loc.district}, {loc.state} — {loc.pincode}
                  </div>
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Receiver Name</label>
                  <input type="text" placeholder="Full name" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Phone</label>
                  <input type="text" placeholder="+91-XXXXXXXXXX" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Address</label>
                <input type="text" placeholder="Full address" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
              </div>
            </div>

            {/* Package Details */}
            <div className="glass-card-static p-4 rounded-xl" style={{ background: "rgba(0,0,0,0.02)" }}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-[13px]">
                <Package className="w-4 h-4" />
                Package Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Package Type</label>
                  <select className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <option value="">Select type...</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Documents">Documents</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Books">Books</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Toys">Toys</option>
                    <option value="Food">Food</option>
                    <option value="Gifts">Gifts</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" placeholder="0.0" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Dimensions (cm)</label>
                  <input type="text" placeholder="L x W x H" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Declared Value (₹)</label>
                  <input type="number" placeholder="0" className="apple-input w-full px-3 py-2 text-[13px]" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }} />
                </div>
              </div>
            </div>

            {/* Route Preview */}
            {newParcelPickup && newParcelDestination && (() => {
              const [pCity, pPin] = newParcelPickup.split("|");
              const [dCity, dPin] = newParcelDestination.split("|");
              return (
                <div className="glass-card-static p-4 rounded-xl" style={{ background: "rgba(88,86,214,0.06)" }}>
                  <h3 className="font-semibold text-gray-900 mb-2 text-[13px]">Route Preview</h3>
                  <div className="flex items-center gap-3 text-[13px]">
                    <span className="text-white px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: APPLE_GREEN }}>{pCity} ({pPin})</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-white px-2 py-1 rounded-lg font-medium" style={{ backgroundColor: APPLE_BLUE }}>{dCity} ({dPin})</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
                    Route code: {getCityCode(pCity)}-{pPin} → {getCityCode(dCity)}-{dPin}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowNewParcel(false)}
              className="flex-1 py-2 apple-btn apple-btn-secondary rounded-xl font-medium text-[13px]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Parcel booked successfully! (Demo mode)");
                setShowNewParcel(false);
                setNewParcelPickup("");
                setNewParcelDestination("");
              }}
              className="flex-1 py-2 apple-btn apple-btn-primary rounded-xl font-medium text-[13px]"
            >
              Book Parcel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
