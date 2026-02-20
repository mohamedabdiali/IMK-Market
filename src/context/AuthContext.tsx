import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

// ============================================
// TYPES
// ============================================

interface Permission {
  resource: string;
  action: string;
}

interface User {
  userId: string;
  email: string;
  username?: string;
  name?: string;
  phone?: string;
  tenantId?: string;
  roles: string[];
  permissions: Permission[];
  isSuperAdmin: boolean;
  mustResetPassword?: boolean;
  disabled?: boolean;
  sellerProfile?: {
    id: string;
    businessName: string;
    businessType?: "seller" | "supplier" | "manufacturer";
    status: string;
  };
  // Legacy fields for backward compatibility
  role?: "admin" | "user";
  source?: "admin" | "tracking" | "customer" | "seller" | "super-admin";
  trackingOrderId?: string;
  trackingNumber?: string;
}

interface AuthResponse {
  token: string;
  user: User;
  sellerProfile?: User["sellerProfile"];
  message?: string;
  status?: string;
  csrfToken?: string;
}

interface SellerRegistrationPayload {
  email: string;
  password: string;
  name: string;
  phone: string;
  businessName: string;
  businessType: "seller" | "supplier" | "manufacturer";
  ownerName: string;
  businessAddress: string;
  productCategory: string;
  description: string;
  tradeLicense?: string;
  emiratesId?: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    iban?: string;
    swiftCode?: string;
  };
}

interface SellerRegistrationResponse {
  message: string;
  status: string;
  userId: string;
  sellerId: string;
}

interface ApiErrorData {
  status?: string;
  reason?: string;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; mustReset?: boolean }>;
  loginSuperAdmin: (email: string, password: string) => Promise<{ success: boolean; mustReset?: boolean }>;
  loginSeller: (email: string, password: string) => Promise<{ success: boolean; mustReset?: boolean }>;
  loginSellerWithGoogle: (credential: string) => Promise<{ success: boolean; mustReset?: boolean; status?: string; message?: string }>;
  loginCustomer: (phone: string, password: string) => Promise<{ success: boolean; mustReset?: boolean }>;
  registerCustomer: (payload: { name?: string; email?: string; phone: string; password: string }) => Promise<boolean>;
  registerSeller: (payload: SellerRegistrationPayload) => Promise<{ success: boolean; message?: string; status?: string }>;
  loginAsTrackingCustomer: (orderId: string, trackingNumber: string) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (...roleNames: string[]) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSeller: boolean;
  isManager: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "auth_user";
const TOKEN_KEY = "auth_token";
const CSRF_KEY = "csrf_token";

// ============================================
// STORAGE HELPERS
// ============================================

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
    // Ignore storage write failures
  }
};

const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage write failures
  }
};

const getApiErrorData = (error: unknown): ApiErrorData | undefined => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return undefined;
  }
  const response = (error as { response?: { data?: ApiErrorData } }).response;
  return response?.data;
};

// ============================================
// AUTH PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const applySession = (nextUser: User, nextToken: string | null, nextCsrf?: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextCsrf !== undefined) {
      setCsrfToken(nextCsrf);
    }
    safeSetItem(STORAGE_KEY, JSON.stringify(nextUser));
    if (nextToken) {
      safeSetItem(TOKEN_KEY, nextToken);
    } else {
      safeRemoveItem(TOKEN_KEY);
    }
    if (nextCsrf) {
      safeSetItem(CSRF_KEY, nextCsrf);
    } else if (nextCsrf === null) {
      safeRemoveItem(CSRF_KEY);
    }
  };

  // Load session from storage on mount
  useEffect(() => {
    const storedUser = safeGetItem(STORAGE_KEY);
    const storedToken = safeGetItem(TOKEN_KEY);
    const storedCsrf = safeGetItem(CSRF_KEY);
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
    if (storedCsrf) {
      setCsrfToken(storedCsrf);
    }
  }, []);

  // ============================================
  // LOGIN METHODS
  // ============================================

  const loginSuperAdmin = async (email: string, password: string): Promise<{ success: boolean; mustReset?: boolean }> => {
    try {
      const result = await api.post("/auth/super-admin/login", { email, password }) as AuthResponse;
      const newUser: User = {
        ...result.user,
        source: "super-admin",
        role: "admin", // Legacy compatibility
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return { success: true, mustReset: Boolean(result.user.mustResetPassword) };
    } catch (error) {
      console.error("Super admin login failed:", error);
      return { success: false };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; mustReset?: boolean }> => {
    try {
      const result = await api.post("/auth/admin/login", { email, password }) as AuthResponse;
      const newUser: User = {
        ...result.user,
        source: "admin",
        role: "admin", // Legacy compatibility
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return { success: true, mustReset: Boolean(result.user.mustResetPassword) };
    } catch (error) {
      console.error("Admin login failed:", error);
      return { success: false };
    }
  };

  const loginSeller = async (email: string, password: string): Promise<{ success: boolean; mustReset?: boolean }> => {
    try {
      const result = await api.post("/auth/seller/login", { email, password }) as AuthResponse;
      const newUser: User = {
        ...result.user,
        sellerProfile: result.sellerProfile,
        source: "seller",
        role: "user", // Legacy compatibility
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return { success: true, mustReset: Boolean(result.user.mustResetPassword) };
    } catch (error: unknown) {
      console.error("Seller login failed:", error);
      const errorData = getApiErrorData(error);
      // Handle specific seller statuses
      if (errorData?.status) {
        throw error; // Re-throw to handle in UI
      }
      return { success: false };
    }
  };

  const loginSellerWithGoogle = async (
    credential: string,
  ): Promise<{ success: boolean; mustReset?: boolean; status?: string; message?: string }> => {
    try {
      const result = await api.post("/auth/seller/google", { credential }) as AuthResponse;
      const newUser: User = {
        ...result.user,
        sellerProfile: result.sellerProfile,
        source: "seller",
        role: "user",
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return { success: true, mustReset: Boolean(result.user.mustResetPassword) };
    } catch (error: unknown) {
      console.error("Seller Google login failed:", error);
      const errorData = getApiErrorData(error);
      return {
        success: false,
        status: errorData?.status,
        message: errorData?.error || errorData?.reason,
      };
    }
  };

  const loginCustomer = async (phone: string, password: string): Promise<{ success: boolean; mustReset?: boolean }> => {
    try {
      const result = await api.post("/auth/customer/login", { phone, password }) as AuthResponse;
      const newUser: User = {
        ...result.user,
        source: "customer",
        role: "user", // Legacy compatibility
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return { success: true, mustReset: Boolean(result.user.mustResetPassword) };
    } catch (error) {
      console.error("Customer login failed:", error);
      return { success: false };
    }
  };

  // ============================================
  // REGISTRATION METHODS
  // ============================================

  const registerCustomer = async (payload: {
    name?: string;
    email?: string;
    phone: string;
    password: string;
  }): Promise<boolean> => {
    try {
      const result = await api.post("/auth/customer/register", payload) as AuthResponse;
      const newUser: User = {
        ...result.user,
        source: "customer",
        role: "user", // Legacy compatibility
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return true;
    } catch (error) {
      console.error("Customer registration failed:", error);
      return false;
    }
  };

  const registerSeller = async (payload: SellerRegistrationPayload): Promise<{ success: boolean; message?: string; status?: string }> => {
    try {
      const result = await api.post("/auth/seller/register", payload) as SellerRegistrationResponse;
      return {
        success: true,
        message: result.message,
        status: result.status,
      };
    } catch (error: unknown) {
      console.error("Seller registration failed:", error);
      const errorData = getApiErrorData(error);
      return {
        success: false,
        message: errorData?.error || "Registration failed",
      };
    }
  };

  // ============================================
  // OTHER AUTH METHODS
  // ============================================

  const loginAsTrackingCustomer = (orderId: string, trackingNumber: string) => {
    const normalizedOrderId = orderId.trim().toUpperCase();
    const normalizedTracking = trackingNumber.trim().toUpperCase();
    const trackingUser: User = {
      userId: `tracking-${normalizedOrderId}`,
      email: `${normalizedOrderId.toLowerCase()}@tracking.local`,
      roles: ["Customer"],
      permissions: [],
      isSuperAdmin: false,
      role: "user",
      source: "tracking",
      trackingOrderId: normalizedOrderId,
      trackingNumber: normalizedTracking,
    };
    applySession(trackingUser, null, null);
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;
    try {
      const result = await api.post("/auth/refresh") as AuthResponse;
      const newUser: User = {
        ...result.user,
        source: user?.source,
        role: user?.role,
      };
      applySession(newUser, result.token, result.csrfToken ?? null);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  };

  const logout = () => {
    api.post("/auth/logout").catch(() => undefined);
    setUser(null);
    setToken(null);
    setCsrfToken(null);
    safeRemoveItem(STORAGE_KEY);
    safeRemoveItem(TOKEN_KEY);
    safeRemoveItem(CSRF_KEY);
  };

  // ============================================
  // PERMISSION HELPERS
  // ============================================

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.permissions.some((p) => p.resource === resource && p.action === action);
  };

  const hasRole = (...roleNames: string[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.roles.some((role) => roleNames.includes(role));
  };

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  const isAdmin = user?.role === "admin" || hasRole("Manager", "Super Admin");
  const isSuperAdmin = user?.isSuperAdmin || false;
  const isSeller = hasRole("Seller");
  const isManager = hasRole("Manager");
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginSuperAdmin,
        loginSeller,
        loginSellerWithGoogle,
        loginCustomer,
        registerCustomer,
        registerSeller,
        loginAsTrackingCustomer,
        logout,
        refreshToken,
        hasPermission,
        hasRole,
        isAdmin,
        isSuperAdmin,
        isSeller,
        isManager,
        isAuthenticated,
      }}
    >
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
