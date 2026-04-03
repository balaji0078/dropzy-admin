"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI, usersAPI } from "./api";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  profile_image_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-load session from stored token
  useEffect(() => {
    const savedToken = localStorage.getItem("accessToken");
    if (savedToken) {
      setToken(savedToken);
      usersAPI
        .getProfile(savedToken)
        .then((res) => {
          const userData = res.data || res.user || res;
          if (userData?.role === "admin") {
            setUser(userData);
          } else {
            // Not admin — clear tokens
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setToken(null);
          }
        })
        .catch(() => {
          // Token expired or invalid — clear everything
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    let res: any;

    try {
      res = await authAPI.login(email, password);
    } catch (err: any) {
      // Network or server errors
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        throw new Error("Cannot reach the server. Is the backend running?");
      }
      throw err;
    }

    // Handle different response structures from Go backend
    const data = res.data || res;
    const accessToken = data.access_token || data.accessToken || data.token;
    const refreshToken = data.refresh_token || data.refreshToken;
    const userData = data.user || data;

    if (!accessToken) {
      throw new Error("No access token received from server");
    }

    // Enforce admin-only access
    if (userData.role && userData.role !== "admin") {
      throw new Error("Access denied. Admin role required.");
    }

    // Persist tokens
    localStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
