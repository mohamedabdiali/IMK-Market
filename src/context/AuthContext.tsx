import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  email: string;
  role: "admin" | "user";
  source?: "admin" | "tracking";
  trackingOrderId?: string;
  trackingNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsTrackingCustomer: (orderId: string, trackingNumber: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

const safeGetItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures (private mode / blocked storage).
  }
};

const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage write failures (private mode / blocked storage).
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = safeGetItem(STORAGE_KEY);
    const storedToken = safeGetItem(TOKEN_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        safeRemoveItem(STORAGE_KEY);
      }
    }
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.adminLogin({ email, password });
      const newUser: User = { email: result.email, role: result.role, source: "admin" };
      setUser(newUser);
      setToken(result.token);
      safeSetItem(STORAGE_KEY, JSON.stringify(newUser));
      safeSetItem(TOKEN_KEY, result.token);
      return true;
    } catch {
      return false;
    }
  };

  const loginAsTrackingCustomer = (orderId: string, trackingNumber: string) => {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const normalizedTracking = trackingNumber.trim().toUpperCase();
    const trackingUser: User = {
      email: `${normalizedOrderId.toLowerCase()}@tracking.local`,
      role: "user",
      source: "tracking",
      trackingOrderId: normalizedOrderId,
      trackingNumber: normalizedTracking,
    };
    setUser(trackingUser);
    setToken(null);
    safeSetItem(STORAGE_KEY, JSON.stringify(trackingUser));
    safeRemoveItem(TOKEN_KEY);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    safeRemoveItem(STORAGE_KEY);
    safeRemoveItem(TOKEN_KEY);
  };

  const isAdmin = user?.role === "admin";
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider value={{ user, token, login, loginAsTrackingCustomer, logout, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
