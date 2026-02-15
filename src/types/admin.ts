export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ProductStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cod' | 'orange_money' | 'afrimoney' | 'qmoney' | 'paystack';
export type PaymentStatus = 'pending' | 'initialized' | 'paid' | 'failed';

export interface OrderTrackingEvent {
  id: string;
  status: string;
  title: string;
  message: string;
  location?: string;
  source?: string;
  eventAt: string;
}

export interface AdminTrackingUpdatePayload {
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  note?: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: { productName: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  createdAt: string;
  shippingAddress: string;
  cargoType?: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  trackingUrl?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  lastTrackingUpdate?: string;
  trackingEvents?: OrderTrackingEvent[];
}

export interface PendingProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  sellerName: string;
  sellerEmail: string;
  description: string;
  image: string;
  status: ProductStatus;
  submittedAt: string;
}

export interface ProductManagementItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  category: string;
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  freeShipping?: boolean;
  badge?: string | null;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  status: "active" | "inactive";
  sellerName?: string | null;
  sellerEmail?: string | null;
  country?: string;
  lastRestocked: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  lastRestocked: string;
  category: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  image?: string;
}

export interface EmailHistoryItem {
  id: string;
  to: string;
  subject: string;
  template: string;
  sentAt: string;
  status: "Sent" | "Resent" | "Failed";
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; sales: number }[];
  topCategories: { name: string; revenue: number }[];
}
