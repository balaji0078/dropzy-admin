"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Bus {
  id: string;
  busNumber: string;
  route: string;
  driver: string;
  driverPhone: string;
  status: string;
  lastLocation: string;
  latitude: number;
  longitude: number;
  speed: number;
  parcelsOnboard: number;
  capacity: number;
  registrationDate: string;
}

interface FleetMapProps {
  buses: Bus[];
  onBusClick: (bus: Bus) => void;
  selectedBusId?: string | null;
}

const statusColors: Record<string, string> = {
  active: "#22c55e",
  idle: "#6b7280",
  maintenance: "#f97316",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  idle: "Idle",
  maintenance: "Maintenance",
};

function createBusIcon(status: string, isSelected: boolean): L.DivIcon {
  const color = statusColors[status] || "#6b7280";
  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: "custom-bus-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
        ${isSelected ? "transform: scale(1.2); z-index: 1000;" : ""}
      ">
        <svg width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M16 6v6"/>
          <path d="M2 12h20"/>
          <path d="M17.5 18H19a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1.5"/>
          <circle cx="8" cy="18" r="2"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function FleetMap({ buses, onBusClick, selectedBusId }: FleetMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const existingMarkers = markersRef.current;

    existingMarkers.forEach((marker) => marker.remove());
    existingMarkers.clear();

    buses.forEach((bus) => {
      const isSelected = bus.id === selectedBusId;
      const icon = createBusIcon(bus.status, isSelected);

      const marker = L.marker([bus.latitude, bus.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family: system-ui; min-width: 180px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e3a5f;">${bus.busNumber}</div>
            <div style="display: grid; gap: 4px; font-size: 12px; color: #374151;">
              <div><span style="color: #6b7280;">Route:</span> ${bus.route}</div>
              <div><span style="color: #6b7280;">Driver:</span> ${bus.driver}</div>
              <div><span style="color: #6b7280;">Speed:</span> ${bus.speed} km/h</div>
              <div><span style="color: #6b7280;">Parcels:</span> ${bus.parcelsOnboard}/${bus.capacity}</div>
              <div style="margin-top: 4px;">
                <span style="
                  display: inline-block;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 500;
                  color: white;
                  background: ${statusColors[bus.status] || "#6b7280"};
                ">${statusLabels[bus.status] || bus.status}</span>
              </div>
            </div>
          </div>`,
          { closeButton: true, className: "bus-popup" }
        );

      marker.on("click", () => {
        onBusClick(bus);
      });

      existingMarkers.set(bus.id, marker);
    });
  }, [buses, selectedBusId, mapReady, onBusClick]);

  useEffect(() => {
    if (!mapRef.current || !selectedBusId) return;
    const marker = markersRef.current.get(selectedBusId);
    if (marker) {
      const latlng = marker.getLatLng();
      mapRef.current.flyTo(latlng, 8, { duration: 1 });
      marker.openPopup();
    }
  }, [selectedBusId]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-lg border border-gray-200 shadow-sm z-[1000]">
        <p className="text-xs font-semibold text-gray-700 mb-2">Fleet Status</p>
        <div className="space-y-1.5">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ background: color }}
              />
              <span className="text-xs text-gray-600 capitalize">{status}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {buses.filter((b) => b.status === status).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bus count overlay */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-lg border border-gray-200 shadow-sm z-[1000]">
        <p className="text-sm font-bold text-gray-900">{buses.length} Buses</p>
        <p className="text-xs text-gray-500">Live tracking</p>
      </div>
    </div>
  );
}
