"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authAPI, usersAPI } from "./api";
import { CORE_API } from "./config";
import { coreAuth, coreSession, hasPortalRole, isNetworkError, PORTAL_ROLES, STAFF_ONLY_COPY, SESSION_ENDED_COPY } from "./core-api";
import type { Me, Role } from "./core-types";

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
  /** Legacy bearer token (always null in core mode — core tokens live only in lib/core-api.ts). */
  token: string | null;
  loading: boolean;
  /** Legacy email/password login (flag off). */
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Core mode: the signed-in staff member and their roles. */
  me: Me | null;
  roles: Role[];
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  me: null,
  roles: [],
  hasRole: () => false,
});

function userFromMe(me: Me): User {
  const name = (me.name || "").trim();
  const [first, ...rest] = name ? name.split(/\s+/) : ["Staff"];
  return { id: me.id, first_name: first, last_name: rest.join(" "), email: me.email || me.phone, role: me.primaryRole || me.roles[0]?.role || "", phone: me.phone };
}

function portalRoles(me: Me | null): Role[] {
  if (!me) return [];
  return Array.from(new Set(me.roles.map((g) => g.role).filter((r) => PORTAL_ROLES.includes(r))));
}

// ───────────────────────────── core mode provider ─────────────────────────────
function CoreAuthProvider({ children }: { children: ReactNode }) {
  // Initialised from the module singleton so route changes (which remount this provider) never flash or refetch.
  const [me, setMe] = useState<Me | null>(() => (coreSession.accessToken ? coreSession.me : null));
  const [loading, setLoading] = useState<boolean>(() => !(coreSession.accessToken && coreSession.me));

  useEffect(() => coreSession.subscribe(() => setMe(coreSession.accessToken ? coreSession.me : null)), []);

  useEffect(() => {
    if (coreSession.accessToken && coreSession.me) return;
    let cancelled = false;
    (async () => {
      if (!coreSession.hasHint() && !coreSession.accessToken) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const restored = await coreAuth.restore();
        if (cancelled) return;
        if (restored && !hasPortalRole(restored)) {
          await coreAuth.logout(STAFF_ONLY_COPY);
          setMe(null);
        } else {
          if (!restored) {
            const hadSession = coreSession.hasHint();
            coreSession.clear();
            if (hadSession) coreSession.setFlash(SESSION_ENDED_COPY);
          }
          setMe(restored);
        }
      } catch (e) {
        // Network failure: keep the hint so a later reload can retry; the layout shows the login page.
        if (!isNetworkError(e)) coreSession.clear();
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(() => {
    coreAuth.logout().finally(() => {
      window.location.href = "/login";
    });
  }, []);

  const roles = portalRoles(me);
  const value: AuthContextType = {
    user: me ? userFromMe(me) : null,
    token: null,
    loading,
    login: async () => {
      throw new Error("Email/password login is disabled when NEXT_PUBLIC_CORE_API=true.");
    },
    logout,
    me,
    roles,
    hasRole: (...r: Role[]) => roles.some((x) => r.includes(x)),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ───────────────────────────── legacy provider (unchanged behaviour) ─────────────────────────────
function LegacyAuthProvider({ children }: { children: ReactNode }) {
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
    <AuthContext.Provider value={{ user, token, loading, login, logout, me: null, roles: [], hasRole: () => false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return CORE_API ? <CoreAuthProvider>{children}</CoreAuthProvider> : <LegacyAuthProvider>{children}</LegacyAuthProvider>;
}

export const useAuth = () => useContext(AuthContext);
