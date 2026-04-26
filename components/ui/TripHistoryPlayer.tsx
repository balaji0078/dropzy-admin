"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripHistory } from "@/lib/mock-live-tracking";
import {
  Play, Pause, SkipBack, SkipForward, Clock, MapPin,
  Gauge, Package, ChevronRight, RotateCcw, FastForward,
} from "lucide-react";

interface TripHistoryPlayerProps {
  trip: TripHistory;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  completed: "#22c55e",
  delayed: "#ef4444",
  in_progress: "#3b82f6",
};

function formatDateTime(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function formatTime12(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDuration(start: string, end: string): string {
  if (!start || !end) return "--";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}

export default function TripHistoryPlayer({ trip, onClose }: TripHistoryPlayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const progressLineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const points = trip.trackPoints;
  const totalPoints = points.length;

  const currentPoint = points[currentIndex] || points[0];
  const progress = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [trip.trackPoints[0]?.lat || 20, trip.trackPoints[0]?.lng || 78],
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      .trip-bus-marker { background: none !important; border: none !important; }
      .trip-bus-marker { transition: transform 0.15s linear !important; }
      .trip-stop-marker { background: none !important; border: none !important; }
    `;
    style.id = "trip-player-styles";
    document.head.appendChild(style);

    // Draw full route polyline (gray dashed)
    if (points.length > 1) {
      const routeCoords = points.map((p) => [p.lat, p.lng] as [number, number]);
      routeLineRef.current = L.polyline(routeCoords, {
        color: "#94a3b8",
        weight: 3,
        dashArray: "8, 8",
        opacity: 0.6,
      }).addTo(map);

      // Progress line (blue solid)
      progressLineRef.current = L.polyline([], {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      // Fit map to route bounds
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
    }

    // Add start marker
    const startIcon = L.divIcon({
      className: "trip-stop-marker",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([points[0].lat, points[0].lng], { icon: startIcon })
      .bindPopup(`<strong>Start:</strong> ${trip.fromCity}<br/>${formatDateTime(trip.startTime)}`)
      .addTo(map);

    // Add end marker
    const endIcon = L.divIcon({
      className: "trip-stop-marker",
      html: `<div style="width:24px;height:24px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const lastPt = points[points.length - 1];
    L.marker([lastPt.lat, lastPt.lng], { icon: endIcon })
      .bindPopup(`<strong>End:</strong> ${trip.toCity}<br/>${trip.endTime ? formatDateTime(trip.endTime) : "In Progress"}`)
      .addTo(map);

    // Add stop markers
    trip.stops.forEach((stop, idx) => {
      const stopIcon = L.divIcon({
        className: "trip-stop-marker",
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#f59e0b;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:9px;font-weight:700;color:white;">${idx + 1}</span>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .bindPopup(`
          <div style="font-family:system-ui;min-width:180px;">
            <strong>${stop.city}</strong><br/>
            <span style="font-size:12px;color:#6b7280;">
              Arrived: ${formatTime12(stop.arrivalTime)}<br/>
              Departed: ${formatTime12(stop.departureTime)}<br/>
              Stopped: ${stop.duration} min<br/>
              Loaded: ${stop.parcelsLoaded} | Unloaded: ${stop.parcelsUnloaded}
            </span>
          </div>
        `)
        .addTo(map);
      stopMarkersRef.current.push(marker);
    });

    // Create bus marker
    const busIcon = L.divIcon({
      className: "trip-bus-marker",
      html: `<div style="width:30px;height:30px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4S4 2.5 4 6v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    busMarkerRef.current = L.marker([points[0].lat, points[0].lng], { icon: busIcon, zIndexOffset: 1000 })
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      const s = document.getElementById("trip-player-styles");
      if (s) s.remove();
    };
  }, [trip]);

  // Update bus position and progress line when currentIndex changes
  useEffect(() => {
    if (!busMarkerRef.current || !progressLineRef.current) return;

    const pt = points[currentIndex];
    if (pt) {
      busMarkerRef.current.setLatLng([pt.lat, pt.lng]);
      // Update progress line
      const progressCoords = points.slice(0, currentIndex + 1).map((p) => [p.lat, p.lng] as [number, number]);
      progressLineRef.current.setLatLngs(progressCoords);
    }
  }, [currentIndex, points]);

  // Playback control
  useEffect(() => {
    if (isPlaying) {
      const interval = Math.max(30, 150 / playbackSpeed);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalPoints - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, totalPoints]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    setCurrentIndex(idx);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 5;
      if (prev === 5) return 10;
      return 1;
    });
  }, []);

  // Speed graph data (simple bar visualization)
  const speedBars = useMemo(() => {
    const barCount = 60;
    const step = Math.max(1, Math.floor(points.length / barCount));
    const bars: { speed: number; isCurrent: boolean }[] = [];
    for (let i = 0; i < points.length; i += step) {
      bars.push({
        speed: points[i].speed,
        isCurrent: Math.abs(i - currentIndex) < step,
      });
    }
    return bars;
  }, [points, currentIndex]);

  const maxBarSpeed = Math.max(...speedBars.map((b) => b.speed), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: statusColors[trip.status] }} />
          <div>
            <h3 className="font-semibold text-gray-900">{trip.route}</h3>
            <p className="text-xs text-gray-500">{trip.tripId} &middot; {trip.busNumber} &middot; {trip.driverName}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded hover:bg-gray-100">
          Close
        </button>
      </div>

      {/* Map */}
      <div ref={mapContainerRef} className="w-full h-[400px]" />

      {/* Playback Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {/* Timeline slider */}
        <div className="mb-3">
          <input
            type="range"
            min={0}
            max={totalPoints - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime12(trip.startTime)}</span>
            <span className="font-medium text-gray-700">{currentPoint ? formatTime12(currentPoint.timestamp) : "--"}</span>
            <span>{trip.endTime ? formatTime12(trip.endTime) : "In Progress"}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" title="Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 10))}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" title="Back 10"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-brand-600 text-white hover:bg-brand-700 shadow-md"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(totalPoints - 1, currentIndex + 10))}
              className="p-2 rounded-lg hover:bg-gray-200 text-gray-600" title="Forward 10"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={cycleSpeed}
              className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Current stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Gauge className="w-3.5 h-3.5" />
              <span className="font-medium">{currentPoint ? Math.round(currentPoint.speed) : 0} km/h</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Graph */}
      <div className="px-4 pb-3 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">Speed Profile</p>
        <div className="flex items-end gap-[1px] h-12">
          {speedBars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm"
              style={{
                height: `${(bar.speed / maxBarSpeed) * 100}%`,
                minHeight: bar.speed > 0 ? "2px" : "1px",
                backgroundColor: bar.isCurrent
                  ? "#3b82f6"
                  : bar.speed === 0
                  ? "#fbbf24"
                  : "#86efac",
              }}
            />
          ))}
        </div>
      </div>

      {/* Trip Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-t border-gray-200">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Start</p>
          <p className="font-semibold text-sm text-gray-900">{trip.fromCity}</p>
          <p className="text-xs text-gray-600">{formatDateTime(trip.startTime)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">End</p>
          <p className="font-semibold text-sm text-gray-900">{trip.toCity}</p>
          <p className="text-xs text-gray-600">{trip.endTime ? formatDateTime(trip.endTime) : "In Progress"}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">ETA vs Actual</p>
          <p className="font-semibold text-sm text-gray-900">{formatTime12(trip.etaOriginal)}</p>
          <p className={`text-xs ${trip.status === "delayed" ? "text-red-600" : "text-green-600"}`}>
            {trip.endTime ? `Actual: ${formatTime12(trip.endTime)}` : "In Progress"}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Trip Stats</p>
          <p className="font-semibold text-sm text-gray-900">{trip.totalDistance} km</p>
          <p className="text-xs text-gray-600">
            Avg {trip.avgSpeed} km/h &middot; Max {trip.maxSpeed} km/h
          </p>
        </div>
      </div>

      {/* Stops Timeline */}
      {trip.stops.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-3">Stops ({trip.stops.length})</h4>
          <div className="space-y-2">
            {trip.stops.map((stop, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-700">
                    {idx + 1}
                  </div>
                  {idx < trip.stops.length - 1 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{stop.city}</p>
                  <p className="text-xs text-gray-500">
                    {formatTime12(stop.arrivalTime)} → {formatTime12(stop.departureTime)} &middot; {stop.duration} min stop
                  </p>
                  <p className="text-xs text-gray-400">
                    +{stop.parcelsLoaded} loaded, -{stop.parcelsUnloaded} unloaded
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration footer */}
      <div className="flex items-center justify-between p-3 bg-gray-100 border-t border-gray-200 text-xs text-gray-500">
        <span>Total Duration: {formatDuration(trip.startTime, trip.endTime || trip.etaOriginal)}</span>
        <span>{trip.totalParcels} parcels &middot; {trip.stops.length} stops</span>
      </div>
    </div>
  );
}
