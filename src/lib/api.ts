import type { AdminTrackingUpdatePayload } from "@/types/admin";
import type { OrderTrackingDetails } from "@/types/tracking";

const resolveApiBase = () => {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) return configured;
  if (typeof window === "undefined") return "/api";
  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  const isNative = capacitor?.isNativePlatform ? capacitor.isNativePlatform() : Boolean(capacitor);
  if (isNative) {
    const host = /Android/i.test(navigator.userAgent) ? "10.0.2.2" : "localhost";
    return `http://${host}:5050/api`;
  }
  return "/api";
};

const API_BASE = resolveApiBase();
const CSRF_KEY = "csrf_token";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (options?.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const csrfToken = typeof window !== "undefined" ? localStorage.getItem(CSRF_KEY) : null;
    if (csrfToken && !headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", csrfToken);
    }
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  if (!res.ok) {
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text ? { error: text } : null;
    }
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : undefined) ||
      (data && typeof data === "object" && "message" in data && typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : undefined) ||
      text ||
      `Request failed: ${res.status}`;
    const error = new Error(message) as Error & { response?: { status: number; data: unknown } };
    error.response = { status: res.status, data };
    throw error;
  }
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  getProducts: (params?: { category?: string; sort?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.q) query.set("q", params.q);
    const suffix = query.toString() ? `?${query}` : "";
    return apiFetch(`/products${suffix}`);
  },
  getProduct: (id: string) => apiFetch(`/products/${id}`),
  getCategories: () => apiFetch("/categories"),
  getFlashDeals: () => apiFetch("/flash-deals"),
  getFlashAds: () => apiFetch("/flash-ads"),
  submitSellerProduct: (payload: unknown) =>
    apiFetch("/pending-products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createOrder: (payload: unknown) =>
    apiFetch("/orders", { method: "POST", body: JSON.stringify(payload) }),
  trackOrder: (params: { orderTrackingId?: string; orderId?: string; trackingNumber?: string; email?: string; phone?: string }) => {
    const query = new URLSearchParams();
    if (params.orderTrackingId) query.set("orderTrackingId", params.orderTrackingId);
    if (params.orderId) query.set("orderId", params.orderId);
    if (params.trackingNumber) query.set("trackingNumber", params.trackingNumber);
    if (params.email) query.set("email", params.email);
    if (params.phone) query.set("phone", params.phone);
    const suffix = query.toString() ? `?${query}` : "";
    return apiFetch<OrderTrackingDetails>(`/orders/track${suffix}`);
  },
  initiatePayment: (payload: unknown) =>
    apiFetch("/payments/initiate", { method: "POST", body: JSON.stringify(payload) }),
  getPaymentStatus: (id: string) => apiFetch(`/payments/${id}`),
  uploadPaymentProof: (id: string, payload: { proofImage?: string; proofVideo?: string }) =>
    apiFetch(`/payments/${id}/proof`, { method: "PATCH", body: JSON.stringify(payload) }),
  customerRegister: (payload: { name?: string; email?: string; phone: string; password: string }) =>
    apiFetch("/auth/customer/register", { method: "POST", body: JSON.stringify(payload) }),
  customerLogin: (payload: { phone: string; password: string }) =>
    apiFetch("/auth/customer/login", { method: "POST", body: JSON.stringify(payload) }),
  adminLogin: (payload: { email: string; password: string }) =>
    apiFetch("/auth/admin/login", { method: "POST", body: JSON.stringify(payload) }),
  getAdminOrders: (token: string) =>
    apiFetch("/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateOrderStatus: (token: string, id: string, status: string) =>
    apiFetch(`/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
  updateOrderTracking: (token: string, id: string, payload: AdminTrackingUpdatePayload) =>
    apiFetch(`/admin/orders/${id}/tracking`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  approveOrderPayment: (token: string, id: string) =>
    apiFetch(`/admin/orders/${id}/approve-payment`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
  createSellerProduct: (token: string, payload: unknown) =>
    apiFetch("/seller/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  getAdminAnalytics: (token: string) =>
    apiFetch("/admin/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getPendingProducts: (token: string) =>
    apiFetch("/admin/pending-products", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  approvePendingProduct: (token: string, id: string) =>
    apiFetch(`/admin/pending-products/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
  rejectPendingProduct: (token: string, id: string) =>
    apiFetch(`/admin/pending-products/${id}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAdminProducts: (token: string) =>
    apiFetch("/admin/products", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  createAdminProduct: (token: string, payload: unknown) =>
    apiFetch("/admin/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  updateAdminProduct: (token: string, id: string, payload: unknown) =>
    apiFetch(`/admin/products/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  deleteAdminProduct: (token: string, id: string) =>
    apiFetch(`/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  getInventory: (token: string) =>
    apiFetch("/admin/inventory", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateInventoryStock: (token: string, id: string, stock: number) =>
    apiFetch(`/admin/inventory/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock }),
    }),
  getCategoriesAdmin: (token: string) =>
    apiFetch("/admin/categories", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getFlashDealsAdmin: (token: string) =>
    apiFetch("/admin/flash-deals", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateFlashDealsAdmin: (token: string, payload: unknown) =>
    apiFetch("/admin/flash-deals", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  getFlashAdsAdmin: (token: string) =>
    apiFetch("/admin/flash-ads", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateFlashAdsAdmin: (token: string, payload: unknown) =>
    apiFetch("/admin/flash-ads", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  createCategoryAdmin: (token: string, payload: unknown) =>
    apiFetch("/admin/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  updateCategoryAdmin: (token: string, id: string, payload: unknown) =>
    apiFetch(`/admin/categories/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  deleteCategoryAdmin: (token: string, id: string) =>
    apiFetch(`/admin/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  getEmailHistory: (token: string) =>
    apiFetch("/admin/email-history", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  sendTestEmail: (token: string, to?: string) =>
    apiFetch("/admin/email/send-test", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to }),
    }),
  sendLowStockAlerts: (token: string) =>
    apiFetch("/admin/email/low-stock-alerts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ============================================
  // GENERIC API METHODS
  // ============================================
  get: (path: string, token?: string) =>
    apiFetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  post: (path: string, payload?: unknown, token?: string) =>
    apiFetch(path, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  patch: (path: string, payload?: unknown, token?: string) =>
    apiFetch(path, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  put: (path: string, payload?: unknown, token?: string) =>
    apiFetch(path, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: payload ? JSON.stringify(payload) : undefined,
    }),
  delete: (path: string, token?: string) =>
    apiFetch(path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
