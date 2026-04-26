"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BusLiveData, MockLiveTracking, getLiveTracking } from "@/lib/mock-live-tracking";

interface DashboardFleetMapProps {
  onBusSelect?: (bus: BusLiveData | null) => void;
}

const statusColors: Record<string, string> = {
  on_route: "#22c55e",
  idle: "#6b7280",
  delayed: "#ef4444",
  maintenance: "#f97316",
};

const statusLabels: Record<string, string> = {
  on_route: "On Route",
  idle: "Idle",
  delayed: "Delayed",
  maintenance: "Maintenance",
};

function createBusIcon(status: string, isSelected: boolean): L.DivIcon {
  const color = statusColors[status] || "#6b7280";
  const size = isSelected ? 36 : 26;
  const borderWidth = isSelected ? 3 : 2;
  const pulseSize = isSelected ? 48 : 38;

  return L.divIcon({
    className: "custom-bus-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: ${isSelected ? 1000 : 100};
        transition: all 0.3s ease;
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
        ${status === "on_route" ? `
          <div style="
            position: absolute;
            width: ${pulseSize}px;
            height: ${pulseSize}px;
            border-radius: 50%;
            border: 2px solid ${color};
            opacity: 0.4;
            animation: pulse 2s ease-out infinite;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
          "></div>
        ` : ""}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function DashboardFleetMap({ onBusSelect }: DashboardFleetMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [buses, setBuses] = useState<BusLiveData[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, onRoute: 0, idle: 0, delayed: 0, maintenance: 0, totalParcels: 0, avgSpeed: 0 });

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Add attribution in bottom-right
    L.control.attribution({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Add pulse animation style
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
      }
      .custom-bus-marker { background: none !important; border: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      mapRef.current = null;
      style.remove();
    };
  }, []);

  // Subscribe to live tracking updates
  useEffect(() => {
    const tracker = getLiveTracking();
    const unsubscribe = tracker.subscribe((updatedBuses) => {
      setBuses(updatedBuses);
      setStats(tracker.getStats());
    });

    return () => unsubscribe();
  }, []);

  // Update markers when buses change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    buses.forEach((bus) => {
      const existingMarker = markersRef.current.get(bus.busId);

      if (existingMarker) {
        // Smoothly update position
        existingMarker.setLatLng([bus.latitude, bus.longitude]);
        existingMarker.setIcon(createBusIcon(bus.status, bus.busId === selectedBus));

        // Update popup content
        existingMarker.setPopupContent(createPopupContent(bus));
      } else {
        // Create new marker
        const marker = L.marker([bus.latitude, bus.longitude], {
          icon: createBusIcon(bus.status, bus.busId === selectedBus),
        });

        marker.bindPopup(createPopupContent(bus), {
          maxWidth: 280,
          className: "custom-popup",
        });

        marker.on("click", () => {
          setSelectedBus(bus.busId);
          onBusSelect?.(bus);
        });

        marker.addTo(map);
        markersRef.current.set(bus.busId, marker);
      }
    });
  }, [buses, selectedBus, onBusSelect]);

  const createPopupContent = (bus: BusLiveData): string => {
    const statusColor = statusColors[bus.status] || "#6b7280";
    return `
      <div style="font-family: system-ui; min-width: 220px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 14px;">${bus.busNumber}</strong>
          <span style="
            background: ${statusColor}20;
            color: ${statusColor};
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
          ">${statusLabels[bus.status]}</span>
        </div>
        <div style="font-size: 12px; color: #6b7280; line-height: 1.8;">
          <div><strong>Route:</strong> ${bus.currentRoute}</div>
          <div><strong>Driver:</strong> ${bus.driverName}</div>
          <div><strong>Speed:</strong> ${bus.speed.toFixed(0)} km/h</div>
          <div><strong>Parcels:</strong> ${bus.parcelsLoaded}</div>
          <div><strong>Fuel:</strong> ${bus.fuelLevel.toFixed(0)}%</div>
          <div><strong>ETA:</strong> ${bus.eta}</div>
        </div>
      </div>
    `;
  };

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="w-full h-[400px] rounded-lg overflow-hidden" />

      {/* Live stats overlay */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-gray-800">Live Tracking</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">On Route: <strong className="text-gray-900">{stats.onRoute}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-600">Idle: <strong className="text-gray-900">{stats.idle}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Delayed: <strong className="text-gray-900">{stats.delayed}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-gray-600">Maint: <strong className="text-gray-900">{stats.maintenance}</strong></span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-1.5 text-xs text-gray-500">
          {stats.totalParcels} parcels | Avg {stats.avgSpeed.toFixed(0)} km/h
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg px-3 py-2">
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[key] }} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
