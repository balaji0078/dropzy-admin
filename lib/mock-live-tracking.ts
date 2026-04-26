// Mock Live Tracking Service
// Simulates real-time bus GPS updates using setInterval (no actual WebSocket needed)

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

// Realistic Indian bus routes with waypoints
const BUS_ROUTES: {
  from: { name: string; lat: number; lng: number };
  to: { name: string; lat: number; lng: number };
  waypoints: { lat: number; lng: number }[];
}[] = [
  {
    from: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    to: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    waypoints: [
      { lat: 13.0, lng: 80.0 }, { lat: 12.95, lng: 79.6 }, { lat: 12.92, lng: 79.2 },
      { lat: 12.90, lng: 78.8 }, { lat: 12.93, lng: 78.4 }, { lat: 12.95, lng: 78.0 },
      { lat: 12.97, lng: 77.8 },
    ],
  },
  {
    from: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    to: { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    waypoints: [
      { lat: 12.7, lng: 80.0 }, { lat: 12.3, lng: 79.7 }, { lat: 11.9, lng: 79.3 },
      { lat: 11.4, lng: 79.0 }, { lat: 10.9, lng: 78.7 }, { lat: 10.4, lng: 78.4 },
    ],
  },
  {
    from: { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    to: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    waypoints: [
      { lat: 11.2, lng: 77.3 }, { lat: 11.5, lng: 77.7 }, { lat: 11.8, lng: 78.2 },
      { lat: 12.1, lng: 78.7 }, { lat: 12.4, lng: 79.2 }, { lat: 12.7, lng: 79.7 },
    ],
  },
  {
    from: { name: "Madurai", lat: 9.9252, lng: 78.1198 },
    to: { name: "Tirunelveli", lat: 8.7139, lng: 77.7567 },
    waypoints: [
      { lat: 9.7, lng: 78.0 }, { lat: 9.5, lng: 77.95 }, { lat: 9.3, lng: 77.9 },
      { lat: 9.1, lng: 77.85 }, { lat: 8.9, lng: 77.8 },
    ],
  },
  {
    from: { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    to: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    waypoints: [
      { lat: 16.9, lng: 78.6 }, { lat: 16.3, lng: 78.8 }, { lat: 15.7, lng: 79.1 },
      { lat: 15.1, lng: 79.4 }, { lat: 14.5, lng: 79.7 }, { lat: 13.9, lng: 80.0 },
      { lat: 13.5, lng: 80.1 },
    ],
  },
  {
    from: { name: "Mumbai", lat: 18.9388, lng: 72.8354 },
    to: { name: "Pune", lat: 18.5204, lng: 73.8567 },
    waypoints: [
      { lat: 18.85, lng: 73.0 }, { lat: 18.75, lng: 73.2 }, { lat: 18.65, lng: 73.4 },
      { lat: 18.55, lng: 73.6 },
    ],
  },
  {
    from: { name: "Delhi", lat: 28.6139, lng: 77.2090 },
    to: { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
    waypoints: [
      { lat: 28.3, lng: 77.0 }, { lat: 28.0, lng: 76.8 }, { lat: 27.7, lng: 76.5 },
      { lat: 27.4, lng: 76.2 }, { lat: 27.1, lng: 76.0 },
    ],
  },
  {
    from: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
    to: { name: "Mysore", lat: 12.2958, lng: 76.6394 },
    waypoints: [
      { lat: 12.85, lng: 77.4 }, { lat: 12.7, lng: 77.2 }, { lat: 12.55, lng: 77.0 },
      { lat: 12.4, lng: 76.8 },
    ],
  },
  {
    from: { name: "Salem", lat: 11.6643, lng: 78.1460 },
    to: { name: "Erode", lat: 11.3410, lng: 77.7172 },
    waypoints: [
      { lat: 11.55, lng: 78.0 }, { lat: 11.45, lng: 77.85 },
    ],
  },
  {
    from: { name: "Trichy", lat: 10.7905, lng: 78.7047 },
    to: { name: "Thanjavur", lat: 10.7870, lng: 79.1378 },
    waypoints: [
      { lat: 10.79, lng: 78.85 }, { lat: 10.79, lng: 79.0 },
    ],
  },
  {
    from: { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    to: { name: "Patna", lat: 25.6093, lng: 85.1376 },
    waypoints: [
      { lat: 23.0, lng: 88.0 }, { lat: 23.5, lng: 87.5 }, { lat: 24.0, lng: 87.0 },
      { lat: 24.5, lng: 86.5 }, { lat: 25.0, lng: 85.8 },
    ],
  },
  {
    from: { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
    to: { name: "Varanasi", lat: 25.3176, lng: 82.9739 },
    waypoints: [
      { lat: 26.6, lng: 81.3 }, { lat: 26.3, lng: 81.7 }, { lat: 26.0, lng: 82.1 },
      { lat: 25.7, lng: 82.5 },
    ],
  },
  {
    from: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
    to: { name: "Surat", lat: 21.1702, lng: 72.8311 },
    waypoints: [
      { lat: 22.6, lng: 72.6 }, { lat: 22.2, lng: 72.7 }, { lat: 21.8, lng: 72.75 },
      { lat: 21.4, lng: 72.8 },
    ],
  },
  {
    from: { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
    to: { name: "Indore", lat: 22.7196, lng: 75.8577 },
    waypoints: [
      { lat: 23.15, lng: 77.1 }, { lat: 23.0, lng: 76.8 }, { lat: 22.9, lng: 76.4 },
      { lat: 22.8, lng: 76.1 },
    ],
  },
  {
    from: { name: "Raipur", lat: 21.2514, lng: 81.6296 },
    to: { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
    waypoints: [
      { lat: 21.2, lng: 81.1 }, { lat: 21.18, lng: 80.5 }, { lat: 21.16, lng: 79.9 },
      { lat: 21.15, lng: 79.3 },
    ],
  },
];

const DRIVER_NAMES = [
  "Murugan S", "Ravi Kumar", "Suresh B", "Ganesh M", "Karthik R",
  "Arjun P", "Venkat S", "Mohan K", "Rajesh T", "Dinesh V",
  "Prakash N", "Senthil M", "Arun D", "Manoj K", "Vijay S",
  "Ramesh G", "Kumar P", "Sathish R", "Naveen L", "Gopal V",
];

// Generate initial bus fleet
const generateBusFleet = (): BusLiveData[] => {
  const buses: BusLiveData[] = [];
  const statuses: BusLiveData["status"][] = ["on_route", "on_route", "on_route", "on_route", "idle", "delayed", "on_route", "maintenance"];

  for (let i = 0; i < 20; i++) {
    const route = BUS_ROUTES[i % BUS_ROUTES.length];
    const status = statuses[i % statuses.length];
    const progress = Math.random(); // 0 to 1 along route
    const totalPoints = [route.from, ...route.waypoints, route.to];
    const pointIndex = Math.floor(progress * (totalPoints.length - 1));
    const point = totalPoints[Math.min(pointIndex, totalPoints.length - 1)];

    // Add small random offset for realism
    const lat = point.lat + (Math.random() - 0.5) * 0.1;
    const lng = point.lng + (Math.random() - 0.5) * 0.1;

    buses.push({
      busId: `BUS-${String(i + 1).padStart(3, "0")}`,
      busNumber: `TN ${["01", "09", "22", "33", "45", "58", "63", "72", "38", "43", "11", "07", "55", "28", "66", "77", "19", "31", "14", "50"][i]} N ${1000 + i * 111}`,
      driverName: DRIVER_NAMES[i % DRIVER_NAMES.length],
      phone: `+91-${9800000000 + i * 7}`,
      latitude: lat,
      longitude: lng,
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

// Simulate bus movement along route
const moveBus = (bus: BusLiveData): BusLiveData => {
  if (bus.status === "idle" || bus.status === "maintenance") {
    return { ...bus, lastUpdated: new Date() };
  }

  const route = BUS_ROUTES.find(r => `${r.from.name} → ${r.to.name}` === bus.currentRoute);
  if (!route) return { ...bus, lastUpdated: new Date() };

  const speedFactor = bus.status === "delayed" ? 0.0003 : 0.001;
  const totalPoints = [route.from, ...route.waypoints, route.to];

  // Find closest waypoint
  let closestIdx = 0;
  let minDist = Infinity;
  totalPoints.forEach((pt, idx) => {
    const dist = Math.sqrt(Math.pow(pt.lat - bus.latitude, 2) + Math.pow(pt.lng - bus.longitude, 2));
    if (dist < minDist) { minDist = dist; closestIdx = idx; }
  });

  // Move toward next waypoint
  const nextIdx = Math.min(closestIdx + 1, totalPoints.length - 1);
  const target = totalPoints[nextIdx];
  const dlat = target.lat - bus.latitude;
  const dlng = target.lng - bus.longitude;
  const dist = Math.sqrt(dlat * dlat + dlng * dlng);

  let newLat = bus.latitude;
  let newLng = bus.longitude;

  if (dist > 0.05) {
    newLat += (dlat / dist) * speedFactor * (1 + Math.random() * 0.5);
    newLng += (dlng / dist) * speedFactor * (1 + Math.random() * 0.5);
  } else if (nextIdx < totalPoints.length - 1) {
    // Reached waypoint, add small jitter
    newLat += (Math.random() - 0.5) * 0.005;
    newLng += (Math.random() - 0.5) * 0.005;
  }

  // Calculate heading
  const heading = Math.atan2(dlng, dlat) * (180 / Math.PI);

  return {
    ...bus,
    latitude: newLat,
    longitude: newLng,
    speed: bus.status === "on_route"
      ? 40 + Math.random() * 40
      : 10 + Math.random() * 20,
    heading: heading >= 0 ? heading : heading + 360,
    fuelLevel: Math.max(10, bus.fuelLevel - Math.random() * 0.1),
    lastUpdated: new Date(),
  };
};

// LiveTracking class - manages simulated real-time updates
export class MockLiveTracking {
  private buses: BusLiveData[];
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<(buses: BusLiveData[]) => void> = new Set();

  constructor() {
    this.buses = generateBusFleet();
  }

  // Subscribe to updates
  subscribe(callback: (buses: BusLiveData[]) => void): () => void {
    this.listeners.add(callback);
    // Send initial data immediately
    callback([...this.buses]);

    // Start updates if not running
    if (!this.intervalId) {
      this.start();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  private start() {
    this.intervalId = setInterval(() => {
      // Update all bus positions
      this.buses = this.buses.map(bus => moveBus(bus));

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
      this.listeners.forEach(cb => cb([...this.buses]));
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
    const onRoute = this.buses.filter(b => b.status === "on_route").length;
    const idle = this.buses.filter(b => b.status === "idle").length;
    const delayed = this.buses.filter(b => b.status === "delayed").length;
    const maintenance = this.buses.filter(b => b.status === "maintenance").length;
    const totalParcels = this.buses.reduce((sum, b) => sum + b.parcelsLoaded, 0);
    const avgSpeed = this.buses.filter(b => b.speed > 0).reduce((sum, b) => sum + b.speed, 0) /
      Math.max(1, this.buses.filter(b => b.speed > 0).length);

    return { total, onRoute, idle, delayed, maintenance, totalParcels, avgSpeed };
  }
}

// Singleton instance
let instance: MockLiveTracking | null = null;
export const getLiveTracking = (): MockLiveTracking => {
  if (!instance) {
    instance = new MockLiveTracking();
  }
  return instance;
};
