// Mock Live Tracking Service
// Simulates real-time bus GPS updates with road-based routing via OSRM

export interface BusLiveData {
  busId: string;
  busNumber: string;
  driverName: string;
  phone: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading: number; // degrees
  status: "on_route" | "idle" | "delayed" | "maintenance";
  currentRoute: string;
  fromCity: string;
  toCity: string;
  parcelsLoaded: number;
  fuelLevel: number; // percentage
  lastUpdated: Date;
  eta: string;
}

// Route definitions with start/end points
interface RouteDefinition {
  from: { name: string; lat: number; lng: number };
  to: { name: string; lat: number; lng: number };
  // Road geometry points fetched from OSRM (populated at runtime)
  roadPoints: { lat: number; lng: number }[];
}

// Realistic Indian bus routes
const BUS_ROUTES: RouteDefinition[] = [
  {
    from: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    to: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    roadPoints: [],
  },
  {
    from: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    to: { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    roadPoints: [],
  },
  {
    from: { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    to: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    roadPoints: [],
  },
  {
    from: { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    to: { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
    roadPoints: [],
  },
  {
    from: { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    to: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    roadPoints: [],
  },
  {
    from: { name: "Mumbai", lat: 18.9388, lng: 72.8354 },
    to: { name: "Pune", lat: 18.5204, lng: 73.8567 },
    roadPoints: [],
  },
  {
    from: { name: "Delhi", lat: 28.6139, lng: 77.2090 },
    to: { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    roadPoints: [],
  },
  {
    from: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    to: { name: "Mysore", lat: 12.2958, lng: 76.6394 },
    roadPoints: [],
  },
  {
    from: { name: "Salem", lat: 11.6643, lng: 78.1460 },
    to: { name: "Erode", lat: 11.3410, lng: 77.7172 },
    roadPoints: [],
  },
  {
    from: { name: "Trichy", lat: 10.7905, lng: 78.7047 },
    to: { name: "Thanjavur", lat: 10.7870, lng: 79.1378 },
    roadPoints: [],
  },
  {
    from: { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    to: { name: "Patna", lat: 25.6093, lng: 85.1376 },
    roadPoints: [],
  },
  {
    from: { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    to: { name: "Varanasi", lat: 25.3176, lng: 82.9739 },
    roadPoints: [],
  },
  {
    from: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    to: { name: "Surat", lat: 21.1702, lng: 72.8311 },
    roadPoints: [],
  },
  {
    from: { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
    to: { name: "Indore", lat: 22.7196, lng: 75.8577 },
    roadPoints: [],
  },
  {
    from: { name: "Raipur", lat: 21.2514, lng: 81.6296 },
    to: { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
    roadPoints: [],
  },
];

const DRIVER_NAMES = [
  "Murugan S", "Ravi Kumar", "Suresh B", "Ganesh M", "Karthik R",
  "Arjun P", "Venkat S", "Mohan K", "Rajesh T", "Dinesh V",
  "Prakash N", "Senthil M", "Arun D", "Manoj K", "Vijay S",
  "Ramesh G", "Kumar P", "Sathish R", "Naveen L", "Gopal V",
];

// Fetch road geometry from OSRM for a route
async function fetchRoadGeometry(
  fromLat: number, fromLng: number, toLat: number, toLng: number
): Promise<{ lat: number; lng: number }[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?geometries=geojson&overview=full`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM error: ${response.status}`);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates;
      // OSRM returns [lng, lat] — convert to { lat, lng }
      // Sample every Nth point to keep ~200 points per route for smooth animation
      const step = Math.max(1, Math.floor(coords.length / 200));
      const points: { lat: number; lng: number }[] = [];
      for (let i = 0; i < coords.length; i += step) {
        points.push({ lat: coords[i][1], lng: coords[i][0] });
      }
      // Always include the last point
      const last = coords[coords.length - 1];
      if (points[points.length - 1].lat !== last[1] || points[points.length - 1].lng !== last[0]) {
        points.push({ lat: last[1], lng: last[0] });
      }
      return points;
    }
  } catch (err) {
    console.warn("OSRM fetch failed, using fallback straight line:", err);
  }
  // Fallback: generate straight-line interpolation
  return generateStraightLinePoints(fromLat, fromLng, toLat, toLng);
}

// Fallback: straight-line interpolation with ~20 points
function generateStraightLinePoints(
  fromLat: number, fromLng: number, toLat: number, toLng: number
): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: fromLat + (toLat - fromLat) * t,
      lng: fromLng + (toLng - fromLng) * t,
    });
  }
  return points;
}

// Track each bus's position along its route
interface BusRouteProgress {
  routeIndex: number; // which route this bus is on
  pointIndex: number; // current position along roadPoints
  direction: 1 | -1;  // 1 = forward, -1 = returning
}

// Generate initial bus fleet
const generateBusFleet = (routeProgress: Map<string, BusRouteProgress>): BusLiveData[] => {
  const buses: BusLiveData[] = [];
  const statuses: BusLiveData["status"][] = ["on_route", "on_route", "on_route", "on_route", "idle", "delayed", "on_route", "maintenance"];

  for (let i = 0; i < 20; i++) {
    const routeIdx = i % BUS_ROUTES.length;
    const route = BUS_ROUTES[routeIdx];
    const status = statuses[i % statuses.length];
    const busId = `BUS-${String(i + 1).padStart(3, "0")}`;

    // Start at a random point along the route
    const roadPoints = route.roadPoints;
    const startIdx = roadPoints.length > 0
      ? Math.floor(Math.random() * roadPoints.length)
      : 0;

    routeProgress.set(busId, {
      routeIndex: routeIdx,
      pointIndex: startIdx,
      direction: 1,
    });

    const point = roadPoints.length > 0
      ? roadPoints[startIdx]
      : { lat: route.from.lat, lng: route.from.lng };

    buses.push({
      busId,
      busNumber: `TN ${["01", "09", "22", "33", "45", "58", "63", "72", "38", "43", "11", "07", "55", "28", "66", "77", "19", "31", "14", "50"][i]} N ${1000 + i * 111}`,
      driverName: DRIVER_NAMES[i % DRIVER_NAMES.length],
      phone: `+91-${9800000000 + i * 7}`,
      latitude: point.lat,
      longitude: point.lng,
      speed: status === "on_route" ? 40 + Math.random() * 40 : status === "delayed" ? 10 + Math.random() * 20 : 0,
      heading: Math.random() * 360,
      status,
      currentRoute: `${route.from.name} → ${route.to.name}`,
      fromCity: route.from.name,
      toCity: route.to.name,
      parcelsLoaded: Math.floor(Math.random() * 50) + 10,
      fuelLevel: Math.floor(Math.random() * 60) + 40,
      lastUpdated: new Date(),
      eta: status === "on_route"
        ? `${Math.floor(Math.random() * 5) + 1}h ${Math.floor(Math.random() * 59)}m`
        : status === "delayed"
        ? `${Math.floor(Math.random() * 3) + 6}h ${Math.floor(Math.random() * 59)}m`
        : "--",
    });
  }

  return buses;
};

// Move bus along road geometry points
const moveBusAlongRoad = (
  bus: BusLiveData,
  progress: BusRouteProgress,
  routeProgress: Map<string, BusRouteProgress>
): BusLiveData => {
  if (bus.status === "idle" || bus.status === "maintenance") {
    return { ...bus, lastUpdated: new Date() };
  }

  const route = BUS_ROUTES[progress.routeIndex];
  const points = route.roadPoints;
  if (points.length < 2) return { ...bus, lastUpdated: new Date() };

  // Advance by exactly 1 point per update for smooth movement
  const stepSize = 1;
  let newIdx = progress.pointIndex + progress.direction * stepSize;
  let newDirection = progress.direction;

  // Bounce at ends of route
  if (newIdx >= points.length) {
    newIdx = points.length - 1;
    newDirection = -1;
  } else if (newIdx < 0) {
    newIdx = 0;
    newDirection = 1;
  }

  // Update progress
  routeProgress.set(bus.busId, {
    ...progress,
    pointIndex: newIdx,
    direction: newDirection,
  });

  const newPoint = points[newIdx];
  const prevPoint = points[Math.max(0, newIdx - newDirection)];

  // Calculate heading from prev to current point
  const dlat = newPoint.lat - prevPoint.lat;
  const dlng = newPoint.lng - prevPoint.lng;
  let heading = Math.atan2(dlng, dlat) * (180 / Math.PI);
  if (heading < 0) heading += 360;

  // Calculate ETA based on remaining points
  const remainingPoints = newDirection === 1
    ? points.length - 1 - newIdx
    : newIdx;
  const etaMinutes = Math.floor(remainingPoints * 1.5); // ~1.5 min per road segment
  const etaHours = Math.floor(etaMinutes / 60);
  const etaMins = etaMinutes % 60;
  const etaStr = etaHours > 0 ? `${etaHours}h ${etaMins}m` : `${etaMins}m`;

  return {
    ...bus,
    latitude: newPoint.lat,
    longitude: newPoint.lng,
    speed: bus.status === "on_route"
      ? 40 + Math.random() * 40
      : 10 + Math.random() * 20,
    heading,
    fuelLevel: Math.max(10, bus.fuelLevel - Math.random() * 0.1),
    lastUpdated: new Date(),
    eta: etaStr,
  };
};

// LiveTracking class - manages simulated real-time updates
export class MockLiveTracking {
  private buses: BusLiveData[] = [];
  private routeProgress: Map<string, BusRouteProgress> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(buses: BusLiveData[]) => void> = new Set();
  private initialized = false;

  constructor() {
    this.initializeRoutes();
  }

  private async initializeRoutes() {
    // Fetch OSRM road geometry for all routes in parallel
    const fetchPromises = BUS_ROUTES.map(async (route) => {
      if (route.roadPoints.length === 0) {
        route.roadPoints = await fetchRoadGeometry(
          route.from.lat, route.from.lng,
          route.to.lat, route.to.lng
        );
      }
    });

    await Promise.all(fetchPromises);

    // Generate bus fleet now that we have road geometry
    this.buses = generateBusFleet(this.routeProgress);
    this.initialized = true;

    // Notify all waiting listeners with initial data
    this.listeners.forEach((cb) => cb([...this.buses]));

    // Start movement if there are listeners
    if (this.listeners.size > 0 && !this.intervalId) {
      this.startMovement();
    }
  }

  // Subscribe to updates
  subscribe(callback: (buses: BusLiveData[]) => void): () => void {
    this.listeners.add(callback);

    // Send initial data immediately if already loaded
    if (this.initialized) {
      callback([...this.buses]);
      if (!this.intervalId) {
        this.startMovement();
      }
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private startMovement() {
    this.intervalId = setInterval(() => {
      // Move all buses along their road routes
      this.buses = this.buses.map((bus) => {
        const progress = this.routeProgress.get(bus.busId);
        if (!progress) return { ...bus, lastUpdated: new Date() };
        return moveBusAlongRoad(bus, progress, this.routeProgress);
      });

      // Randomly change a bus status occasionally
      if (Math.random() < 0.05) {
        const idx = Math.floor(Math.random() * this.buses.length);
        const statuses: BusLiveData["status"][] = ["on_route", "idle", "delayed"];
        this.buses[idx] = {
          ...this.buses[idx],
          status: statuses[Math.floor(Math.random() * statuses.length)],
        };
      }

      // Notify all listeners
      this.listeners.forEach((cb) => cb([...this.buses]));
    }, 3000); // Update every 3 seconds
  }

  private stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Get current snapshot
  getBuses(): BusLiveData[] {
    return [...this.buses];
  }

  // Get stats
  getStats() {
    const total = this.buses.length;
    const onRoute = this.buses.filter((b) => b.status === "on_route").length;
    const idle = this.buses.filter((b) => b.status === "idle").length;
    const delayed = this.buses.filter((b) => b.status === "delayed").length;
    const maintenance = this.buses.filter((b) => b.status === "maintenance").length;
    const totalParcels = this.buses.reduce((sum, b) => sum + b.parcelsLoaded, 0);
    const movingBuses = this.buses.filter((b) => b.speed > 0);
    const avgSpeed = movingBuses.length > 0
      ? movingBuses.reduce((sum, b) => sum + b.speed, 0) / movingBuses.length
      : 0;

    return { total, onRoute, idle, delayed, maintenance, totalParcels, avgSpeed };
  }
}

// === Trip History Types & Generator ===

export interface TripStop {
  city: string;
  lat: number;
  lng: number;
  arrivalTime: string;  // ISO time
  departureTime: string;
  duration: number; // minutes stopped
  parcelsLoaded: number;
  parcelsUnloaded: number;
}

export interface TripHistoryPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: string; // ISO time
  heading: number;
}

export interface TripHistory {
  tripId: string;
  busId: string;
  busNumber: string;
  driverName: string;
  route: string;
  fromCity: string;
  toCity: string;
  startTime: string;
  endTime: string;
  etaOriginal: string; // original ETA
  actualArrival: string;
  totalDistance: number; // km
  avgSpeed: number;
  maxSpeed: number;
  totalParcels: number;
  stops: TripStop[];
  trackPoints: TripHistoryPoint[];
  status: "completed" | "in_progress" | "delayed";
}

// Helper to format time
function formatTime(date: Date): string {
  return date.toISOString();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3600000);
}

// City stop names for intermediate stops
const STOP_NAMES: Record<string, string[]> = {
  "Chennai → Bangalore": ["Kanchipuram", "Vellore", "Krishnagiri", "Hosur"],
  "Chennai → Madurai": ["Chengalpattu", "Villupuram", "Trichy", "Dindigul"],
  "Coimbatore → Chennai": ["Erode", "Salem", "Dharmapuri", "Vellore"],
  "Madurai → Tirunelveli": ["Virudhunagar", "Kovilpatti", "Tenkasi"],
  "Hyderabad → Chennai": ["Nalgonda", "Suryapet", "Vijayawada", "Nellore"],
  "Mumbai → Pune": ["Panvel", "Lonavala", "Khandala"],
  "Delhi → Jaipur": ["Gurgaon", "Neemrana", "Behror", "Shahpura"],
  "Bangalore → Mysore": ["Ramanagara", "Channapatna", "Mandya", "Srirangapatna"],
  "Salem → Erode": ["Edappadi", "Sankagiri"],
  "Trichy → Thanjavur": ["Lalgudi", "Papanasam"],
  "Kolkata → Patna": ["Asansol", "Dhanbad", "Gaya", "Aurangabad"],
  "Lucknow → Varanasi": ["Sultanpur", "Jaunpur", "Azamgarh"],
  "Ahmedabad → Surat": ["Anand", "Vadodara", "Bharuch"],
  "Bhopal → Indore": ["Sehore", "Dewas", "Ujjain"],
  "Raipur → Nagpur": ["Durg", "Rajnandgaon", "Gondia"],
};

// Generate mock trip history for a route
function generateTripHistory(
  tripIdx: number,
  route: RouteDefinition,
  daysAgo: number
): TripHistory {
  const routeName = `${route.from.name} → ${route.to.name}`;
  const busIdx = tripIdx % 20;
  const driverIdx = tripIdx % DRIVER_NAMES.length;

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - daysAgo);
  baseDate.setHours(5 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);

  const startTime = new Date(baseDate);

  // Route distance estimation (rough km based on lat/lng distance)
  const dlat = route.to.lat - route.from.lat;
  const dlng = route.to.lng - route.from.lng;
  const roughDist = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // degree to km
  const totalDistance = Math.round(roughDist * (1 + Math.random() * 0.2));

  // Trip duration based on avg 45 km/h
  const baseDuration = (totalDistance / 45) * 60; // minutes
  const totalDuration = baseDuration + Math.floor(Math.random() * 60); // add some variance
  const endTime = addMinutes(startTime, totalDuration);

  // ETA was estimated at start
  const etaDuration = baseDuration + Math.floor(Math.random() * 30);
  const etaTime = addMinutes(startTime, etaDuration);

  // Determine if delayed
  const isDelayed = endTime.getTime() > etaTime.getTime() + 30 * 60000;
  const isCompleted = daysAgo > 0 || Math.random() > 0.3;

  // Generate stops
  const stopNames = STOP_NAMES[routeName] || ["Midpoint Stop"];
  const stops: TripStop[] = [];
  const stopCount = Math.min(stopNames.length, 2 + Math.floor(Math.random() * 3));
  const stopInterval = totalDuration / (stopCount + 1);

  for (let i = 0; i < stopCount; i++) {
    const arrivalMin = stopInterval * (i + 1) - 5;
    const stopDuration = 10 + Math.floor(Math.random() * 20); // 10-30 min stop
    const arrivalTime = addMinutes(startTime, arrivalMin);
    const departureTime = addMinutes(arrivalTime, stopDuration);

    // Interpolate position
    const t = (i + 1) / (stopCount + 1);
    const lat = route.from.lat + (route.to.lat - route.from.lat) * t + (Math.random() - 0.5) * 0.05;
    const lng = route.from.lng + (route.to.lng - route.from.lng) * t + (Math.random() - 0.5) * 0.05;

    stops.push({
      city: stopNames[i % stopNames.length],
      lat, lng,
      arrivalTime: formatTime(arrivalTime),
      departureTime: formatTime(departureTime),
      duration: stopDuration,
      parcelsLoaded: Math.floor(Math.random() * 10),
      parcelsUnloaded: Math.floor(Math.random() * 15) + 5,
    });
  }

  // Generate track points from road geometry
  const points = route.roadPoints.length > 0 ? route.roadPoints : [
    { lat: route.from.lat, lng: route.from.lng },
    { lat: route.to.lat, lng: route.to.lng },
  ];
  const trackPoints: TripHistoryPoint[] = [];
  const timePerPoint = totalDuration / points.length;

  for (let i = 0; i < points.length; i++) {
    const pointTime = addMinutes(startTime, timePerPoint * i);
    const nextPt = points[Math.min(i + 1, points.length - 1)];
    const heading = Math.atan2(nextPt.lng - points[i].lng, nextPt.lat - points[i].lat) * (180 / Math.PI);

    // Check if near a stop - speed = 0
    const isNearStop = stops.some((s) => {
      const stopTime = new Date(s.arrivalTime).getTime();
      const depTime = new Date(s.departureTime).getTime();
      return pointTime.getTime() >= stopTime && pointTime.getTime() <= depTime;
    });

    trackPoints.push({
      lat: points[i].lat,
      lng: points[i].lng,
      speed: isNearStop ? 0 : 30 + Math.random() * 50,
      timestamp: formatTime(pointTime),
      heading: heading >= 0 ? heading : heading + 360,
    });
  }

  const speeds = trackPoints.filter((p) => p.speed > 0).map((p) => p.speed);
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

  return {
    tripId: `TRIP-${String(tripIdx + 1).padStart(4, "0")}`,
    busId: `BUS-${String(busIdx + 1).padStart(3, "0")}`,
    busNumber: `TN ${["01", "09", "22", "33", "45", "58", "63", "72", "38", "43", "11", "07", "55", "28", "66", "77", "19", "31", "14", "50"][busIdx]} N ${1000 + busIdx * 111}`,
    driverName: DRIVER_NAMES[driverIdx],
    route: routeName,
    fromCity: route.from.name,
    toCity: route.to.name,
    startTime: formatTime(startTime),
    endTime: isCompleted ? formatTime(endTime) : "",
    etaOriginal: formatTime(etaTime),
    actualArrival: isCompleted ? formatTime(endTime) : "",
    totalDistance,
    avgSpeed: Math.round(avgSpeed),
    maxSpeed: Math.round(maxSpeed),
    totalParcels: 20 + Math.floor(Math.random() * 40),
    stops,
    trackPoints,
    status: isCompleted ? (isDelayed ? "delayed" : "completed") : "in_progress",
  };
}

// Generate trip history for all routes over the past 7 days
function generateAllTripHistory(): TripHistory[] {
  const trips: TripHistory[] = [];
  let tripIdx = 0;

  // Generate 3-5 trips per route over past 7 days
  for (let day = 0; day < 7; day++) {
    for (let r = 0; r < BUS_ROUTES.length; r++) {
      // Not every route runs every day
      if (Math.random() > 0.6) continue;
      trips.push(generateTripHistory(tripIdx++, BUS_ROUTES[r], day));
    }
  }

  // Sort by start time descending (most recent first)
  trips.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  return trips;
}

// Singleton instance
let instance: MockLiveTracking | null = null;
export const getLiveTracking = (): MockLiveTracking => {
  if (!instance) {
    instance = new MockLiveTracking();
  }
  return instance;
};

// Trip history singleton
let tripHistoryCache: TripHistory[] | null = null;
export const getTripHistory = (): TripHistory[] => {
  if (!tripHistoryCache) {
    tripHistoryCache = generateAllTripHistory();
  }
  return tripHistoryCache;
};

export const getTripById = (tripId: string): TripHistory | undefined => {
  return getTripHistory().find((t) => t.tripId === tripId);
};

export const getTripsForBus = (busId: string): TripHistory[] => {
  return getTripHistory().filter((t) => t.busId === busId);
};
