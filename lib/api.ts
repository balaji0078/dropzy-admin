const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://18.60.129.43:8080/api/v1";

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ───
export const authAPI = {
  login: (email: string, password: string) =>
    request<any>("/auth/login", { method: "POST", body: { email, password } }),

  refreshToken: (refreshToken: string) =>
    request<any>("/auth/refresh-token", { method: "POST", body: { refresh_token: refreshToken } }),
};

// ─── Orders ───
export const ordersAPI = {
  list: (token: string, page = 1, limit = 10) =>
    request<any>(`/orders?page=${page}&limit=${limit}`, { token }),

  getById: (token: string, id: string) =>
    request<any>(`/orders/${id}`, { token }),

  updateStatus: (token: string, id: string, status: string, notes?: string) =>
    request<any>(`/orders/${id}`, { method: "PUT", token, body: { status, notes } }),

  cancel: (token: string, id: string) =>
    request<any>(`/orders/${id}/cancel`, { method: "PATCH", token }),
};

// ─── Drivers ───
export const driversAPI = {
  getProfile: (token: string) =>
    request<any>("/drivers/profile", { token }),

  getNearby: (token: string, lat: number, lng: number, radius = 10, limit = 50) =>
    request<any>(`/drivers/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}&limit=${limit}`, { token }),

  getStats: (token: string, id: string) =>
    request<any>(`/drivers/${id}/stats`, { token }),

  updateLocation: (token: string, lat: number, lng: number) =>
    request<any>("/drivers/location", { method: "PATCH", token, body: { latitude: lat, longitude: lng } }),

  toggleAvailability: (token: string, status: string) =>
    request<any>("/drivers/availability", { method: "PATCH", token, body: { status } }),
};

// ─── Payments ───
export const paymentsAPI = {
  create: (token: string, orderId: string, method: string) =>
    request<any>("/payments", { method: "POST", token, body: { order_id: orderId, method } }),

  getById: (token: string, id: string) =>
    request<any>(`/payments/${id}`, { token }),

  refund: (token: string, id: string, amount: number, reason: string) =>
    request<any>(`/payments/${id}/refund`, { method: "POST", token, body: { amount, reason } }),
};

// ─── Notifications ───
export const notificationsAPI = {
  list: (token: string, page = 1, limit = 10) =>
    request<any>(`/notifications?page=${page}&limit=${limit}`, { token }),

  unreadCount: (token: string) =>
    request<any>("/notifications/unread-count", { token }),

  markRead: (token: string, id: string) =>
    request<any>(`/notifications/${id}/read`, { method: "PATCH", token }),
};

// ─── Pricing ───
export const pricingAPI = {
  getEstimate: (body: any) =>
    request<any>("/pricing/estimate", { method: "POST", body }),

  getRules: (token: string) =>
    request<any>("/pricing/rules", { token }),

  createRule: (token: string, body: any) =>
    request<any>("/pricing/rules", { method: "POST", token, body }),

  updateRule: (token: string, id: string, body: any) =>
    request<any>(`/pricing/rules/${id}`, { method: "PUT", token, body }),
};

// ─── Reviews ───
export const reviewsAPI = {
  getByOrder: (token: string, orderId: string) =>
    request<any>(`/reviews?order_id=${orderId}`, { token }),

  getDriverRating: (token: string, driverId: string) =>
    request<any>(`/reviews/driver/${driverId}`, { token }),

  getUserReviews: (token: string, userId: string, page = 1, limit = 10) =>
    request<any>(`/reviews/users/${userId}?page=${page}&limit=${limit}`, { token }),
};

// ─── Users ───
export const usersAPI = {
  getProfile: (token: string) =>
    request<any>("/users/profile", { token }),

  getById: (token: string, id: string) =>
    request<any>(`/users/${id}`, { token }),

  updateProfile: (token: string, body: any) =>
    request<any>("/users/profile", { method: "PUT", token, body }),
};

// ─── Tracking ───
export const trackingAPI = {
  getOrderTracking: (token: string, orderId: string) =>
    request<any>(`/tracking/order/${orderId}`, { token }),

  updateLocation: (token: string, lat: number, lng: number) =>
    request<any>("/tracking/location", { method: "POST", token, body: { latitude: lat, longitude: lng } }),
};

// ─── Health ───
export const healthAPI = {
  check: () => request<any>("/health"),
};
