import { OrderStatus, PaymentStatus } from "@/types/admin";

export interface TrackingEvent {
  id: string;
  status: string;
  title: string;
  message: string;
  location?: string | null;
  source?: string;
  eventAt: string;
  createdAt?: string;
}

export interface OrderTrackingDetails {
  id: string;
  orderTrackingId?: string;
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  approvedToProceed?: boolean;
  total: number;
  cargoType?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  currentLocation?: string | null;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  lastTrackingUpdate?: string | null;
  createdAt: string;
  updatedAt?: string;
  progress: number;
  items: { productName: string; quantity: number; price: number }[];
  events: TrackingEvent[];
  support?: {
    email?: string;
    phone?: string;
  };
}
