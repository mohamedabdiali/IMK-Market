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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_KEY, result.token);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackingUser));
    localStorage.removeItem(TOKEN_KEY);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
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
