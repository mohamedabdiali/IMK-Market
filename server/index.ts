import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import prisma from "./prisma.js";
import { EmailService } from "./email.js";

// Startup validation for critical configuration
if (!process.env.DATABASE_URL) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is not set.");
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    process.exit(1);
  }
}

const app = express();
type RequestWithRawBody = express.Request & { rawBody?: Buffer };

// Trust proxy (needed when behind reverse proxies/load balancers)
app.set("trust proxy", true);

// Security middleware
app.use(helmet());

// CORS - restrict allowed origins via ALLOWED_ORIGINS env var in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:8080", "http://localhost:5173"];

const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0 && vercelOrigin) {
  allowedOrigins.push(vercelOrigin);
}

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  console.error("CRITICAL: Set ALLOWED_ORIGINS in production to restrict CORS.");
  process.exit(1);
}
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Capture raw body for webhook signature verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req: RequestWithRawBody, _res, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use(apiLimiter);

// Stricter rate limit for admin login attempts
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later.",
});

const customerAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts. Please try again later.",
});

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "info@imkmarket.com";
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || "+232-76-123-456";
const BRAND_NAME = "IMK-MARKET";
const PAYMENT_CURRENCY = (process.env.PAYMENT_CURRENCY || "SLE") as "SLE" | "SLL" | "USD";
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "dev-webhook-secret";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || "Le";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" }) : null;

// Security checks: fail fast in production when critical secrets are not set
const isProduction = process.env.NODE_ENV === "production";
const usingDefaultJwt = JWT_SECRET === "change-me-in-prod";
const usingDefaultWebhook = PAYMENT_WEBHOOK_SECRET === "dev-webhook-secret";
if (isProduction && (usingDefaultJwt || usingDefaultWebhook)) {
  console.error("CRITICAL: Missing or insecure secrets for production environment.");
  if (usingDefaultJwt) console.error("JWT_SECRET is using a development default.");
  if (usingDefaultWebhook) console.error("PAYMENT_WEBHOOK_SECRET is using a development default.");
  console.error("Set secure environment variables and restart the server.");
  process.exit(1);
}

// Enforce HTTPS in production
if (isProduction) {
  app.use((req, res, next) => {
    const proto = (req.headers["x-forwarded-proto"] || "").toString();
    if (req.secure || proto === "https") return next();
    // redirect to HTTPS
    if (req.headers.host) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    return next();
  });
}

function formatMoney(amount: number) {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}
const emailService = new EmailService(BRAND_NAME, SUPPORT_EMAIL, SUPPORT_PHONE);

// ============================================
// IMPORT NEW RBAC ROUTES
// ============================================
import authRoutes from "./routes/auth.js";
import superAdminRoutes from "./routes/super-admin.js";
import sellerRoutes from "./routes/sellers.js";
import notificationRoutes from "./routes/notifications.js";

// ============================================
// MOUNT NEW ROUTES
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/notifications", notificationRoutes);


function createOrderId() {
  return `ORD-${nanoid(6).toUpperCase()}`;
}

function createPaymentId() {
  return `PAY-${nanoid(8).toUpperCase()}`;
}

function createPaymentReference(paymentId: string) {
  return `IMK-${paymentId.replace("PAY-", "")}`;
}

function createTrackingNumber() {
  return `TRK-${nanoid(10).toUpperCase()}`;
}

const DEFAULT_FLASH_DEALS = {
  title: "Flash Deals",
  subtitle: "Limited time offers - up to 30% off.",
  endsAt: null as string | null,
  productIds: [] as string[],
  cards: [] as Array<{
    id: string;
    title: string;
    subtitle?: string;
    badge?: string;
    price?: string;
    cta?: string;
    mediaType: "image" | "video";
    mediaUrl: string;
    animation?: "none" | "pulse" | "float" | "zoom";
  }>,
};

const flashDealCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badge: z.string().optional(),
  price: z.string().optional(),
  cta: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().optional(),
  animation: z.enum(["none", "pulse", "float", "zoom"]).optional(),
});

const normalizeFlashDealCards = (cards: unknown) => {
  if (!Array.isArray(cards)) return [] as typeof DEFAULT_FLASH_DEALS.cards;
  return cards
    .map((entry) => {
      const parsed = flashDealCardSchema.safeParse(entry ?? {});
      if (!parsed.success) return null;
      const mediaUrl = parsed.data.mediaUrl?.trim();
      if (!mediaUrl) return null;
      const id = parsed.data.id?.trim() || `promo-${nanoid(6)}`;
      return {
        id,
        title: parsed.data.title?.trim() || "Flash Deal",
        subtitle: parsed.data.subtitle?.trim() || "",
        badge: parsed.data.badge?.trim() || "",
        price: parsed.data.price?.trim() || "",
        cta: parsed.data.cta?.trim() || "",
        mediaType: parsed.data.mediaType === "video" ? "video" : "image",
        mediaUrl,
        animation: parsed.data.animation || "none",
      };
    })
    .filter(Boolean) as typeof DEFAULT_FLASH_DEALS.cards;
};

const normalizeFlashDeals = (value: unknown) => {
  const parsed = z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      endsAt: z.string().nullable().optional(),
      productIds: z.array(z.string()).optional(),
      cards: z.array(z.unknown()).optional(),
    })
    .safeParse(value ?? {});

  if (!parsed.success) return { ...DEFAULT_FLASH_DEALS };

  const title = parsed.data.title?.trim() || DEFAULT_FLASH_DEALS.title;
  const subtitle = parsed.data.subtitle?.trim() || DEFAULT_FLASH_DEALS.subtitle;
  const endsAt = parsed.data.endsAt
    ? Number.isNaN(new Date(parsed.data.endsAt).getTime())
      ? null
      : new Date(parsed.data.endsAt).toISOString()
    : null;
  const productIds = Array.from(
    new Set((parsed.data.productIds ?? []).map((id) => id.trim()).filter(Boolean))
  );
  const cards = normalizeFlashDealCards(parsed.data.cards).slice(0, 12);

  return {
    title,
    subtitle,
    endsAt,
    productIds,
    cards,
  };
};

const fetchFlashDealsSetting = async () => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "flash_deals" } });
  return normalizeFlashDeals(setting?.value);
};

const DEFAULT_FLASH_ADS = {
  ads: [] as Array<{
    id: string;
    slot: "left" | "right";
    title?: string;
    subtitle?: string;
    text?: string;
    badge?: string;
    cta?: string;
    mediaType: "image" | "video";
    mediaUrl: string;
    animation?: "none" | "pulse" | "float" | "zoom";
  }>,
};

const flashAdSchema = z.object({
  id: z.string().optional(),
  slot: z.enum(["left", "right"]).optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  text: z.string().optional(),
  badge: z.string().optional(),
  cta: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  mediaUrl: z.string().optional(),
  animation: z.enum(["none", "pulse", "float", "zoom"]).optional(),
});

const normalizeFlashAds = (value: unknown) => {
  if (!value || typeof value !== "object") return { ...DEFAULT_FLASH_ADS };
  const rawAds = Array.isArray((value as { ads?: unknown[] }).ads) ? (value as { ads?: unknown[] }).ads : [];
  const ads = rawAds
    .map((entry) => {
      const parsed = flashAdSchema.safeParse(entry ?? {});
      if (!parsed.success) return null;
      const mediaUrl = parsed.data.mediaUrl?.trim();
      if (!mediaUrl) return null;
      const slot = parsed.data.slot === "right" ? "right" : "left";
      return {
        id: parsed.data.id?.trim() || `ad-${nanoid(6)}`,
        slot,
        title: parsed.data.title?.trim() || "",
        subtitle: parsed.data.subtitle?.trim() || "",
        text: parsed.data.text?.trim() || "",
        badge: parsed.data.badge?.trim() || "",
        cta: parsed.data.cta?.trim() || "",
        mediaType: parsed.data.mediaType === "video" ? "video" : "image",
        mediaUrl,
        animation: parsed.data.animation || "none",
      };
    })
    .filter(Boolean) as typeof DEFAULT_FLASH_ADS.ads;
  return { ads };
};

const fetchFlashAdsSetting = async () => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "flash_ads" } });
  return normalizeFlashAds(setting?.value);
};

const CATEGORY_MEDIA_KEY = "category_media";

type CategoryMediaMap = Record<string, { video?: string }>;

const normalizeCategoryMediaMap = (value: unknown): CategoryMediaMap => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: CategoryMediaMap = {};
  for (const [key, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const media = entry as { video?: unknown };
    if (typeof media.video === "string" && media.video.trim().length) {
      result[key] = { video: media.video };
    }
  }
  return result;
};

const fetchCategoryMediaSetting = async () => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: CATEGORY_MEDIA_KEY } });
  return normalizeCategoryMediaMap(setting?.value);
};

const saveCategoryMediaSetting = async (map: CategoryMediaMap) => {
  await prisma.systemSetting.upsert({
    where: { key: CATEGORY_MEDIA_KEY },
    update: { value: map },
    create: { key: CATEGORY_MEDIA_KEY, value: map },
  });
};

const updateCategoryMediaSetting = async (categoryId: string, payload: { video?: string | null }) => {
  const current = await fetchCategoryMediaSetting();
  const existing = current[categoryId] || {};
  const next = { ...current };
  if (payload.video === null || payload.video === undefined || payload.video.trim().length === 0) {
    const { video: _removed, ...rest } = existing;
    if (Object.keys(rest).length === 0) {
      delete next[categoryId];
    } else {
      next[categoryId] = rest;
    }
  } else {
    next[categoryId] = { ...existing, video: payload.video };
  }
  await saveCategoryMediaSetting(next);
  return next;
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
const PAYMENT_METHODS = ["cod", "orange_money", "afrimoney", "qmoney", "paystack", "stripe"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const TRACKING_EVENT_CONTENT: Record<OrderStatus, { title: string; message: string }> = {
  pending: {
    title: "Order Confirmed",
    message: "Your order has been received and is waiting for processing.",
  },
  processing: {
    title: "Order Processing",
    message: "Your items are being prepared for dispatch.",
  },
  shipped: {
    title: "Order Shipped",
    message: "Your package is in transit.",
  },
  delivered: {
    title: "Order Delivered",
    message: "Your order has been delivered successfully.",
  },
  cancelled: {
    title: "Order Cancelled",
    message: "This order was cancelled.",
  },
};

const TRACKING_LOCATION_BY_STATUS: Record<OrderStatus, string> = {
  pending: "Order desk",
  processing: "Warehouse",
  shipped: "Transit hub",
  delivered: "Delivery destination",
  cancelled: "Order desk",
};

const CARGO_ESTIMATE_DAYS: Record<string, number> = {
  air: 3,
  land: 7,
  sea: 18,
};

const DEFAULT_TENANT_NAME = process.env.PUBLIC_TENANT_NAME || "IMK-Market";
let cachedDefaultTenantId: string | null = null;
async function getDefaultTenantId() {
  if (cachedDefaultTenantId !== null) return cachedDefaultTenantId;
  try {
    const tenant = await prisma.tenant.findUnique({ where: { name: DEFAULT_TENANT_NAME } });
    cachedDefaultTenantId = tenant?.id ?? null;
  } catch (e) {
    cachedDefaultTenantId = null;
  }
  return cachedDefaultTenantId;
}

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

function resolvePaymentMethod(value?: string | null): PaymentMethod {
  if (value && isPaymentMethod(value)) return value;
  return "cod";
}

function normalizeOptionalText(value?: string | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizePhone(value?: string | null) {
  if (!value) return "";
  return value.replace(/[^\d+]/g, "");
}

function normalizeCustomerPhone(value?: string | null) {
  const normalized = normalizePhone(value);
  if (!normalized) return "";
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

function customerPhoneToEmail(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  return `phone-${digits}@customer.local`;
}

function isValidImageMedia(value: string) {
  return value.startsWith("data:image/") || /^https?:\/\//i.test(value);
}

function isValidVideoMedia(value: string) {
  return value.startsWith("data:video/") || /^https?:\/\//i.test(value);
}

function resolveEstimatedDelivery(cargoType?: string | null, from = new Date()) {
  const key = (cargoType || "").toLowerCase();
  const days = CARGO_ESTIMATE_DAYS[key] ?? 6;
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date;
}

function resolveStatusLocation(
  status: OrderStatus,
  shippingAddress: string,
  explicitLocation?: string | null
) {
  const provided = normalizeOptionalText(explicitLocation);
  if (provided) return provided;
  if (status === "delivered") return shippingAddress;
  return TRACKING_LOCATION_BY_STATUS[status];
}

const orderItemSchema = z.object({
  productId: z.union([z.string(), z.number()]).optional(),
  productName: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
});
type OrderItemPayload = z.infer<typeof orderItemSchema>;

const storedPaymentItemsSchema = z.object({
  orderItems: z.array(orderItemSchema).min(1),
  proofImage: z.string().optional(),
  proofVideo: z.string().optional(),
  proofSubmittedAt: z.string().optional(),
  proofApprovedAt: z.string().optional(),
});

type StoredPaymentItems = z.infer<typeof storedPaymentItemsSchema>;

function parseStoredPaymentItems(value: unknown): StoredPaymentItems {
  const direct = z.array(orderItemSchema).safeParse(value);
  if (direct.success) {
    return { orderItems: direct.data };
  }
  const wrapped = storedPaymentItemsSchema.safeParse(value);
  if (wrapped.success) return wrapped.data;
  return { orderItems: [] };
}

function buildStoredPaymentItems(data: StoredPaymentItems): Prisma.InputJsonValue {
  const payload: Record<string, unknown> = {
    orderItems: data.orderItems,
  };
  if (data.proofImage) payload.proofImage = data.proofImage;
  if (data.proofVideo) payload.proofVideo = data.proofVideo;
  if (data.proofSubmittedAt) payload.proofSubmittedAt = data.proofSubmittedAt;
  if (data.proofApprovedAt) payload.proofApprovedAt = data.proofApprovedAt;
  return payload as Prisma.InputJsonValue;
}

function parseOrderItems(value: unknown): OrderItemPayload[] {
  return parseStoredPaymentItems(value).orderItems;
}

function resolveOrderTrackingId(order: { trackingNumber: string | null; id: string }) {
  return order.trackingNumber || order.id;
}

function canProceedWithOrder(order: { paymentMethod: string; paymentStatus: string }) {
  if (order.paymentMethod === "cod") return true;
  return order.paymentStatus === "paid";
}

function requiresManualProofApproval(paymentMethod: string) {
  return paymentMethod === "orange_money" || paymentMethod === "afrimoney" || paymentMethod === "qmoney";
}

async function appendTrackingEvent(payload: {
  orderId: string;
  status: OrderStatus;
  location?: string | null;
  note?: string;
  source?: "system" | "admin";
  eventAt?: Date;
}) {
  const content = TRACKING_EVENT_CONTENT[payload.status];
  const note = normalizeOptionalText(payload.note);
  const message = note ? `${content.message} ${note}` : content.message;
  await prisma.orderTrackingEvent.create({
    data: {
      orderId: payload.orderId,
      status: payload.status,
      title: content.title,
      message,
      location: normalizeOptionalText(payload.location) || undefined,
      source: payload.source || "system",
      eventAt: payload.eventAt || new Date(),
    },
  });
}

function buildTrackingPayload(order: {
  id: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  cargoType: string | null;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: string;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  currentLocation: string | null;
  estimatedDelivery: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  lastTrackingUpdate: Date | null;
  items: { productName: string; quantity: number; price: number }[];
  trackingEvents: {
    id: string;
    status: string;
    title: string;
    message: string;
    location: string | null;
    source: string;
    eventAt: Date;
    createdAt: Date;
  }[];
}) {
  const progressMap: Record<string, number> = {
    pending: 20,
    processing: 45,
    shipped: 75,
    delivered: 100,
    cancelled: 0,
  };
  const fallbackEvent = {
    id: `fallback-${order.id}`,
    status: order.status,
    title: TRACKING_EVENT_CONTENT[isOrderStatus(order.status) ? order.status : "pending"].title,
    message: TRACKING_EVENT_CONTENT[isOrderStatus(order.status) ? order.status : "pending"].message,
    location: order.currentLocation || TRACKING_LOCATION_BY_STATUS.pending,
    source: "system",
    eventAt: order.createdAt,
    createdAt: order.createdAt,
  };
  const trackingEvents = order.trackingEvents.length ? order.trackingEvents : [fallbackEvent];
  return {
    id: order.id,
    orderTrackingId: resolveOrderTrackingId(order),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    approvedToProceed: canProceedWithOrder(order),
    total: order.total,
    cargoType: order.cargoType,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    trackingUrl: order.trackingUrl,
    currentLocation: order.currentLocation,
    estimatedDelivery: order.estimatedDelivery,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    lastTrackingUpdate: order.lastTrackingUpdate,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    progress: progressMap[order.status] ?? 0,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
    })),
    events: trackingEvents.map((event) => ({
      id: event.id,
      status: event.status,
      title: event.title,
      message: event.message,
      location: event.location,
      source: event.source,
      eventAt: event.eventAt,
      createdAt: event.createdAt,
    })),
    support: {
      email: SUPPORT_EMAIL,
      phone: SUPPORT_PHONE,
    },
  };
}

async function createOrderRecord(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "initialized" | "paid" | "failed";
  paymentReference?: string;
  cargoType?: string;
  tenantId?: string;
  items: OrderItemPayload[];
}) {
  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = createOrderId();
  const createdAt = new Date();
  const estimatedDelivery = resolveEstimatedDelivery(payload.cargoType, createdAt);
  const currentLocation = resolveStatusLocation("pending", payload.shippingAddress);

  const order = await prisma.order.create({
    data: {
      id,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentStatus,
      paymentReference: payload.paymentReference,
      cargoType: payload.cargoType,
      trackingNumber: createTrackingNumber(),
      trackingCarrier: "IMK Logistics",
      currentLocation,
      estimatedDelivery,
      lastTrackingUpdate: createdAt,
      total,
      tenantId: payload.tenantId,
      items: {
        create: payload.items.map((item) => ({
          productId: item.productId?.toString(),
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      trackingEvents: {
        create: {
          status: "pending",
          title: TRACKING_EVENT_CONTENT.pending.title,
          message: TRACKING_EVENT_CONTENT.pending.message,
          location: currentLocation,
          source: "system",
          eventAt: createdAt,
        },
      },
    },
  });

  const orderSummary = payload.items[0];
  const email = emailService.orderConfirmationTemplate({
    id: order.id,
    customerName: payload.customerName,
    productName: orderSummary?.productName || "Order Items",
    quantity: orderSummary?.quantity || payload.items.length,
    price: formatMoney(total),
    date: order.createdAt.toISOString(),
    cargo: payload.cargoType,
    total: formatMoney(total),
  });

  await prisma.emailHistory.create({
    data: {
      to: payload.customerEmail,
      subject: email.subject,
      template: "orderConfirmation",
      status: "Sent",
    },
  });

  return {
    id: order.id,
    orderTrackingId: resolveOrderTrackingId(order),
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
  };
}

async function markOrderPaymentApproved(payload: {
  orderId: string;
  source: "system" | "admin";
  note: string;
}) {
  const order = await prisma.order.findUnique({ where: { id: payload.orderId } });
  if (!order) return null;

  const shouldMoveToProcessing = order.status === "pending";
  const shouldMarkPaid = order.paymentStatus !== "paid";
  if (!shouldMoveToProcessing && !shouldMarkPaid) {
    return order;
  }

  const nextStatus: OrderStatus = shouldMoveToProcessing ? "processing" : (isOrderStatus(order.status) ? order.status : "processing");
  const nextLocation = resolveStatusLocation(nextStatus, order.shippingAddress, order.currentLocation);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "paid",
      ...(shouldMoveToProcessing ? { status: "processing" } : {}),
      currentLocation: nextLocation,
      lastTrackingUpdate: new Date(),
    },
  });

  await prisma.orderTrackingEvent.create({
    data: {
      orderId: order.id,
      status: nextStatus,
      title: "Payment Approved",
      message: payload.note,
      location: nextLocation,
      source: payload.source,
      eventAt: new Date(),
    },
  });

  return updated;
}

async function ensureCategory(name: string) {
  let category = await prisma.category.findUnique({
    where: { name },
  });
  if (!category) {
    category = await prisma.category.create({
      data: { name },
    });
  }
  return category;
}

import { verifyToken, AuthRequest, requirePermission, getTenantFilter, notifyRole, notifySuperAdmins, createAuditLog } from "./auth-utils.js";

function requireAdmin(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  try {
    const user = verifyToken(token);
    if (user.disabled) {
      return res.status(403).json({ error: "Account disabled" });
    }
    if (user.mustResetPassword) {
      return res.status(403).json({ error: "Password reset required" });
    }
    // Allow if super admin or has Admin/Manager/Sales roles
    const legacyRole = (user as Partial<{ role: string }>).role;
    const hasAdminAccess = user.isSuperAdmin ||
      user.roles.some(role => ["Admin", "Manager", "Sales Associate"].includes(role)) ||
      legacyRole === "admin"; // Backward compatibility

    if (!hasAdminAccess) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/categories", async (_req, res) => {
  try {
    const tenantId = await getDefaultTenantId();
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    const products = await prisma.product.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: { categoryId: true },
    });
    const categoryMedia = await fetchCategoryMediaSetting();
    const productCounts = products.reduce<Record<string, number>>((acc, product) => {
      acc[product.categoryId] = (acc[product.categoryId] || 0) + 1;
      return acc;
    }, {});

    const result = categories.map((category) => ({
      id: category.id,
      name: category.name,
      image: category.image,
      video: categoryMedia[category.id]?.video,
      productCount: productCounts[category.id] || 0,
    }));

    res.json(result);
  } catch (e) {
    console.error("Fetch categories error", e);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/api/flash-deals", async (_req, res) => {
  try {
    const deals = await fetchFlashDealsSetting();
    res.json(deals);
  } catch (e) {
    console.error("Fetch flash deals error", e);
    res.status(500).json({ error: "Failed to fetch flash deals" });
  }
});

app.get("/api/flash-ads", async (_req, res) => {
  try {
    const ads = await fetchFlashAdsSetting();
    res.json(ads);
  } catch (e) {
    console.error("Fetch flash ads error", e);
    res.status(500).json({ error: "Failed to fetch flash ads" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category, q, sort } = req.query as { category?: string; q?: string; sort?: string };
    const tenantId = await getDefaultTenantId();
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    let result = await prisma.product.findMany({
      where: {
        status: "active",
        ...(tenantId ? { tenantId } : {}),
      },
    });
    if (category) {
      result = result.filter((product) => categoryMap.get(product.categoryId) === category);
    }
    if (q) {
      const query = q.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    if (!sort || sort === "newest") result.sort((a, b) => b.createdAt.toISOString().localeCompare(a.createdAt.toISOString()));

    res.json(
      result.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        images: product.images?.length ? product.images : [product.image],
        category: categoryMap.get(product.categoryId) || "Uncategorized",
        rating: product.rating,
        reviewCount: product.reviewCount,
        inStock: product.inStock,
        freeShipping: product.freeShipping,
        badge: product.badge,
      }))
    );
  } catch (e) {
    console.error("Fetch products error", e);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const tenantId = await getDefaultTenantId();
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        status: "active",
        ...(tenantId ? { tenantId } : {}),
      },
    });
    if (!product) {
      return res.status(404).json({ error: "Not found" });
    }
    const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
    res.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      images: product.images?.length ? product.images : [product.image],
      category: category?.name || "Uncategorized",
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock,
      freeShipping: product.freeShipping,
      badge: product.badge,
    });
  } catch (e) {
    console.error("Fetch product error", e);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/api/payments/initiate", async (req, res) => {
  const schema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(5),
    shippingAddress: z.string().min(5),
    paymentMethod: z.enum(["orange_money", "afrimoney", "qmoney", "paystack", "stripe"]),
    cargoType: z.string().optional(),
    paymentProofImage: z
      .string()
      .optional()
      .refine((value) => !value || isValidImageMedia(value), "Invalid proof image"),
    paymentProofVideo: z
      .string()
      .optional()
      .refine((value) => !value || isValidVideoMedia(value), "Invalid proof video"),
    items: z.array(orderItemSchema).min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod,
    items,
    cargoType,
    paymentProofImage,
    paymentProofVideo,
  } = parsed.data;
  const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const paymentId = createPaymentId();
  const reference = createPaymentReference(paymentId);
  const createdAt = new Date().toISOString();
  const jsonItems = items.map((item) => ({
    ...(item.productId !== undefined ? { productId: item.productId } : {}),
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
  }));
  const hasProof = Boolean(paymentProofImage || paymentProofVideo);
  const storedPaymentItems = buildStoredPaymentItems({
    orderItems: jsonItems,
    ...(paymentProofImage ? { proofImage: paymentProofImage } : {}),
    ...(paymentProofVideo ? { proofVideo: paymentProofVideo } : {}),
    ...(hasProof ? { proofSubmittedAt: createdAt } : {}),
  });

  try {
    const tenantId = await getDefaultTenantId();
    const created = await prisma.payment.create({
      data: {
        provider: paymentMethod,
        status: "pending",
        amount,
        currency: PAYMENT_CURRENCY,
        reference,
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        cargoType,
        items: storedPaymentItems,
      },
    });

    const provisionalOrder = await createOrderRecord({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      paymentStatus: "initialized",
      paymentReference: reference,
      cargoType,
      tenantId: tenantId || undefined,
      items,
    });

    const payment = await prisma.payment.update({
      where: { id: created.id },
      data: { orderId: provisionalOrder.id },
    });

    // If using Stripe, create a Checkout Session and return redirect URL
    if (paymentMethod === "stripe") {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }
      try {
        const currency = PAYMENT_CURRENCY === "USD" ? "usd" : "usd";
        const line_items = items.map((it) => ({
          price_data: {
            currency,
            product_data: { name: it.productName },
            unit_amount: Math.round(it.price * 100),
          },
          quantity: it.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items,
          success_url: process.env.PAYMENT_SUCCESS_URL || "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: process.env.PAYMENT_CANCEL_URL || "https://example.com/cancel",
          metadata: { paymentId: created.id },
        });

        // persist provider reference
        await prisma.payment.update({ where: { id: created.id }, data: { providerReference: session.id } });

        const instructions = ["You will be redirected to a secure card payment page."];
        return res.json({
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          reference,
          paymentMethod,
          instructions,
          paymentUrl: session.url,
          requiresRedirect: true,
          orderId: provisionalOrder.id,
          orderTrackingId: provisionalOrder.orderTrackingId,
          proofUploaded: Boolean(paymentProofImage || paymentProofVideo),
        });
      } catch (error: unknown) {
        console.error("Stripe session creation failed", error);
        return res.status(500).json({ error: "Payment initialization failed" });
      }
    }

    const instructions =
      paymentMethod === "paystack"
        ? [
          "You will be redirected to a secure card payment page.",
          "After payment, admin will confirm and approve your order for processing.",
        ]
        : [
          `Send ${formatMoney(amount)} to ${SUPPORT_PHONE} (${BRAND_NAME}).`,
          `Use reference: ${reference}.`,
          "Upload payment confirmation for admin approval.",
        ];

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      reference,
      paymentMethod,
      instructions,
      paymentUrl: paymentMethod === "paystack" ? null : null,
      requiresRedirect: paymentMethod === "paystack",
      orderId: provisionalOrder.id,
      orderTrackingId: provisionalOrder.orderTrackingId,
      proofUploaded: Boolean(paymentProofImage || paymentProofVideo),
    });
  } catch (e) {
    console.error("Initiate payment error", e);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

app.get("/api/payments/:id", async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: "Not found" });
    const orderTracking = payment.orderId
      ? await prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { id: true, trackingNumber: true, paymentStatus: true, status: true, paymentMethod: true },
      })
      : null;
    const storedPayment = parseStoredPaymentItems(payment.items);
    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
      paymentMethod: payment.paymentMethod,
      orderId: payment.orderId,
      orderTrackingId: orderTracking ? resolveOrderTrackingId(orderTracking) : payment.orderId || null,
      trackingNumber: orderTracking?.trackingNumber || null,
      providerReference: payment.providerReference,
      updatedAt: payment.updatedAt,
      items: payment.items || null,
      proofUploaded: Boolean(storedPayment.proofImage || storedPayment.proofVideo),
      paymentProofImage: storedPayment.proofImage || null,
      paymentProofVideo: storedPayment.proofVideo || null,
      paymentProofSubmittedAt: storedPayment.proofSubmittedAt || null,
      paymentProofApprovedAt: storedPayment.proofApprovedAt || null,
      orderStatus: orderTracking?.status || null,
      orderPaymentStatus: orderTracking?.paymentStatus || null,
      approvedToProceed: orderTracking
        ? canProceedWithOrder({ paymentMethod: orderTracking.paymentMethod, paymentStatus: orderTracking.paymentStatus })
        : false,
    });
  } catch (e) {
    console.error("Fetch payment error", e);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

app.patch("/api/payments/:id/proof", async (req, res) => {
  const schema = z
    .object({
      proofImage: z
        .string()
        .optional()
        .refine((value) => !value || isValidImageMedia(value), "Invalid proof image"),
      proofVideo: z
        .string()
        .optional()
        .refine((value) => !value || isValidVideoMedia(value), "Invalid proof video"),
    })
    .refine((data) => Boolean(data.proofImage || data.proofVideo), {
      message: "At least one proof file is required",
    });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: "Not found" });

    const parsedItems = parseStoredPaymentItems(payment.items);
    const submittedAt = new Date().toISOString();
    const nextItems = buildStoredPaymentItems({
      orderItems: parsedItems.orderItems,
      proofImage: parsed.data.proofImage || parsedItems.proofImage,
      proofVideo: parsed.data.proofVideo || parsedItems.proofVideo,
      proofSubmittedAt: submittedAt,
    });

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        items: nextItems,
        status: payment.status === "failed" ? "pending" : payment.status,
      },
    });

    if (payment.orderId) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "initialized",
          status: "pending",
          lastTrackingUpdate: new Date(),
        },
      });
    }

    const linkedOrder = updated.orderId
      ? await prisma.order.findUnique({ where: { id: updated.orderId }, select: { id: true, trackingNumber: true } })
      : null;

    res.json({
      id: updated.id,
      status: updated.status,
      proofUploaded: true,
      paymentProofSubmittedAt: submittedAt,
      orderId: updated.orderId,
      orderTrackingId: linkedOrder ? resolveOrderTrackingId(linkedOrder) : updated.orderId,
    });
  } catch (e) {
    console.error("Update payment proof error", e);
    res.status(500).json({ error: "Failed to update payment proof" });
  }
});

app.post("/api/payments/webhook/:provider", async (req, res) => {
  const providerParam = req.params.provider;

  // Stripe-specific webhook verification and handling
  if (providerParam === "stripe") {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook received but Stripe is not configured.");
      return res.status(500).json({ error: "Stripe not configured" });
    }
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });
    try {
      const rawBody = (req as RequestWithRawBody).rawBody;
      if (!rawBody) return res.status(400).json({ error: "Missing raw request body" });
      const event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.paymentId;
        if (!paymentId) return res.status(400).json({ error: "Missing payment metadata" });
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return res.status(404).json({ error: "Payment not found" });
        const storedPayment = parseStoredPaymentItems(payment.items);
        const approvedAt = new Date().toISOString();
        const shouldWriteItems =
          Boolean(storedPayment.proofImage || storedPayment.proofVideo) ||
          Boolean(storedPayment.proofSubmittedAt || storedPayment.proofApprovedAt);
        const nextPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            providerReference: session.id,
            ...(shouldWriteItems
              ? {
                items: buildStoredPaymentItems({
                  orderItems: storedPayment.orderItems,
                  ...(storedPayment.proofImage ? { proofImage: storedPayment.proofImage } : {}),
                  ...(storedPayment.proofVideo ? { proofVideo: storedPayment.proofVideo } : {}),
                  ...(storedPayment.proofSubmittedAt ? { proofSubmittedAt: storedPayment.proofSubmittedAt } : {}),
                  ...(storedPayment.proofImage || storedPayment.proofVideo ? { proofApprovedAt: approvedAt } : {}),
                }),
              }
              : {}),
          },
        });
        let orderId = nextPayment.orderId;
        if (!orderId) {
          const tenantId = await getDefaultTenantId();
          const order = await createOrderRecord({
            customerName: payment.customerName,
            customerEmail: payment.customerEmail,
            customerPhone: payment.customerPhone,
            shippingAddress: payment.shippingAddress,
            paymentMethod: resolvePaymentMethod(payment.paymentMethod),
            paymentStatus: "paid",
            paymentReference: payment.reference,
            cargoType: payment.cargoType || undefined,
            tenantId: tenantId || undefined,
            items: parseOrderItems(payment.items),
          });
          await prisma.payment.update({ where: { id: payment.id }, data: { orderId: order.id } });
          orderId = order.id;
        }
        if (orderId) {
          await markOrderPaymentApproved({
            orderId,
            source: "system",
            note: "Payment confirmed. Your order is now moving to processing.",
          });
        }
      }
      return res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Stripe webhook verification failed:", message);
      return res.status(400).json({ error: "Invalid signature" });
    }
  }

  // Generic provider webhook verification. Support HMAC-SHA256 verification using raw body when available.
  const headerSignature = (req.headers["x-webhook-signature"] || req.headers["x-paystack-signature"] || req.headers["x-webhook-secret"] || "") as string;
  let verified = false;
  if (PAYMENT_WEBHOOK_SECRET && headerSignature) {
    try {
      const rawBody = (req as RequestWithRawBody).rawBody;
      if (rawBody && rawBody.length) {
        const expected = crypto.createHmac("sha256", PAYMENT_WEBHOOK_SECRET).update(rawBody).digest("hex");
        if (headerSignature.includes(expected) || headerSignature === expected || headerSignature === `sha256=${expected}`) {
          verified = true;
        }
      }
      if (!verified && headerSignature === PAYMENT_WEBHOOK_SECRET) verified = true;
    } catch (e) {
      console.error("Webhook verification error", e);
    }
  }

  if (process.env.NODE_ENV === "production" && PAYMENT_WEBHOOK_SECRET && !verified) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { paymentId, status, providerReference } = req.body as {
    paymentId?: string;
    status?: "paid" | "failed";
    providerReference?: string;
  };

  if (!paymentId || !status) {
    return res.status(400).json({ error: "Missing paymentId or status" });
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).json({ error: "Not found" });

    const newStatus = status === "paid" ? "paid" : "failed";
    const storedPayment = parseStoredPaymentItems(payment.items);
    const approvedAt = new Date().toISOString();
    const shouldWriteItems =
      Boolean(storedPayment.proofImage || storedPayment.proofVideo) ||
      Boolean(storedPayment.proofSubmittedAt || storedPayment.proofApprovedAt);
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        providerReference: providerReference || payment.providerReference,
        ...(newStatus === "paid" && shouldWriteItems
          ? {
            items: buildStoredPaymentItems({
              orderItems: storedPayment.orderItems,
              ...(storedPayment.proofImage ? { proofImage: storedPayment.proofImage } : {}),
              ...(storedPayment.proofVideo ? { proofVideo: storedPayment.proofVideo } : {}),
              ...(storedPayment.proofSubmittedAt ? { proofSubmittedAt: storedPayment.proofSubmittedAt } : {}),
              ...(storedPayment.proofImage || storedPayment.proofVideo ? { proofApprovedAt: approvedAt } : {}),
            }),
          }
          : {}),
      },
    });

    if (newStatus === "paid") {
      let orderId = updatedPayment.orderId;
      if (!orderId) {
        const tenantId = await getDefaultTenantId();
        const order = await createOrderRecord({
          customerName: updatedPayment.customerName,
          customerEmail: updatedPayment.customerEmail,
          customerPhone: updatedPayment.customerPhone,
          shippingAddress: updatedPayment.shippingAddress,
          paymentMethod: resolvePaymentMethod(updatedPayment.paymentMethod),
          paymentStatus: "paid",
          paymentReference: updatedPayment.reference,
          cargoType: updatedPayment.cargoType || undefined,
          tenantId: tenantId || undefined,
          items: parseOrderItems(updatedPayment.items),
        });
        await prisma.payment.update({ where: { id: paymentId }, data: { orderId: order.id } });
        orderId = order.id;
      }
      if (orderId) {
        await markOrderPaymentApproved({
          orderId,
          source: "system",
          note: "Payment confirmed. Your order is now moving to processing.",
        });
      }
      return res.json({ success: true, id: paymentId, status: newStatus, orderId: orderId || null });
    }

    if (newStatus === "failed") {
      const tenantId = await getDefaultTenantId();
      await notifySuperAdmins({
        type: "payment_failed",
        title: "Payment Failed",
        message: `Payment ${paymentId} failed for ${updatedPayment.customerName}.`,
        data: { paymentId },
      });
      if (tenantId) {
        await notifyRole({
          roleName: "Manager",
          tenantId,
          type: "payment_failed",
          title: "Payment Failed",
          message: `Payment ${paymentId} failed for ${updatedPayment.customerName}.`,
          data: { paymentId },
        });
      }
    }

    res.json({ success: true, id: paymentId, status: newStatus, orderId: updatedPayment.orderId });
  } catch (e) {
    console.error("Webhook update error", e);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

app.post("/api/orders", async (req, res) => {
  const schema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(5),
    shippingAddress: z.string().min(5),
    paymentMethod: z.enum(["cod", "orange_money", "afrimoney", "qmoney", "paystack"]),
    paymentReference: z.string().min(2).optional(),
    cargoType: z.string().optional(),
    items: z.array(orderItemSchema).min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod,
    paymentReference,
    items,
    cargoType,
  } = parsed.data;

  if (paymentMethod !== "cod") {
    return res.status(400).json({ error: "Payment required. Use /api/payments/initiate for non-COD." });
  }

  try {
    const paymentStatus = "pending";
    const tenantId = await getDefaultTenantId();
    const order = await createOrderRecord({
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      paymentReference,
      cargoType,
      tenantId: tenantId || undefined,
      items,
    });
    await notifySuperAdmins({
      type: "new_order",
      title: "New Order",
      message: `New order ${order.id} placed by ${customerName}.`,
      data: { orderId: order.id },
    });
    if (tenantId) {
      await notifyRole({
        roleName: "Manager",
        tenantId,
        type: "new_order",
        title: "New Order",
        message: `New order ${order.id} placed by ${customerName}.`,
        data: { orderId: order.id },
      });
    }
    res.status(201).json(order);
  } catch (e) {
    console.error("Create order error", e);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get("/api/orders/track", async (req, res) => {
  const schema = z.object({
    orderTrackingId: z.string().min(4).optional(),
    orderId: z.string().min(4).optional(),
    trackingNumber: z.string().min(4).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
  });

  const parsed = schema.safeParse({
    orderTrackingId: typeof req.query.orderTrackingId === "string" ? req.query.orderTrackingId : undefined,
    orderId: typeof req.query.orderId === "string" ? req.query.orderId : undefined,
    trackingNumber: typeof req.query.trackingNumber === "string" ? req.query.trackingNumber : undefined,
    email: typeof req.query.email === "string" ? req.query.email : undefined,
    phone: typeof req.query.phone === "string" ? req.query.phone : undefined,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
  }

  const { orderTrackingId, orderId, trackingNumber, email, phone } = parsed.data;
  if (!orderTrackingId && !orderId && !trackingNumber) {
    return res.status(400).json({ error: "Provide orderTrackingId, orderId, or trackingNumber" });
  }

  const hasStrongReference = Boolean(orderTrackingId) || Boolean(orderId && trackingNumber);
  if (!hasStrongReference && !email && !phone) {
    return res.status(400).json({ error: "Provide email or phone for verification" });
  }

  try {
    const tenantId = await getDefaultTenantId();
    const tenantWhere = tenantId ? { tenantId } : {};
    const includePayload = {
      items: true,
      trackingEvents: { orderBy: { eventAt: "asc" as const } },
    };
    const order = orderTrackingId
      ? await prisma.order.findFirst({
        where: {
          OR: [{ id: orderTrackingId }, { trackingNumber: orderTrackingId }],
          ...tenantWhere,
        },
        include: includePayload,
      })
      : orderId
        ? await prisma.order.findFirst({
          where: { id: orderId, ...tenantWhere },
          include: includePayload,
        })
        : await prisma.order.findFirst({
          where: { trackingNumber: trackingNumber || undefined, ...tenantWhere },
          include: includePayload,
        });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderTrackingId) {
      const normalized = orderTrackingId.toLowerCase();
      const matchesTrackingId = order.id.toLowerCase() === normalized || order.trackingNumber?.toLowerCase() === normalized;
      if (!matchesTrackingId) return res.status(404).json({ error: "Order not found" });
    }
    if (orderId && order.id.toLowerCase() !== orderId.toLowerCase()) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (trackingNumber && order.trackingNumber?.toLowerCase() !== trackingNumber.toLowerCase()) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (hasStrongReference) {
      return res.json(buildTrackingPayload(order));
    }

    const emailMatches = email
      ? order.customerEmail.toLowerCase() === email.toLowerCase()
      : true;
    const phoneMatches = phone
      ? normalizePhone(order.customerPhone) === normalizePhone(phone)
      : true;

    if (!emailMatches || !phoneMatches) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(buildTrackingPayload(order));
  } catch (e) {
    console.error("Track order error", e);
    res.status(500).json({ error: "Failed to fetch tracking" });
  }
});

// Legacy auth routes removed (replaced by /api/auth)

app.get("/api/admin/analytics", requireAdmin, requirePermission("analytics", "view"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const orderWhere = tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {};
    const productWhere = tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {};
    const allOrders = await prisma.order.findMany({ where: orderWhere });
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = allOrders.length;
    const totalProducts = await prisma.product.count({ where: productWhere });
    const uniqueEmails = new Set(allOrders.map((o) => o.customerEmail));
    const totalCustomers = uniqueEmails.size;

    const ordersByStatus = (
      await Promise.all([
        { status: "pending", count: await prisma.order.count({ where: { ...orderWhere, status: "pending" } }) },
        { status: "processing", count: await prisma.order.count({ where: { ...orderWhere, status: "processing" } }) },
        { status: "shipped", count: await prisma.order.count({ where: { ...orderWhere, status: "shipped" } }) },
        { status: "delivered", count: await prisma.order.count({ where: { ...orderWhere, status: "delivered" } }) },
        { status: "cancelled", count: await prisma.order.count({ where: { ...orderWhere, status: "cancelled" } }) },
      ])
    ).map((item) => ({ status: item.status, count: item.count }));

    const revenueByMonth = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - idx));
      const month = date.toLocaleString("en-US", { month: "short" });
      const revenue = allOrders
        .filter((order) => new Date(order.createdAt).getMonth() === date.getMonth())
        .reduce((sum, order) => sum + order.total, 0);
      return { month, revenue };
    });

    const topProducts = (await prisma.product.findMany({ where: productWhere, take: 5 })).map((product, index) => ({
      name: product.name,
      sales: Math.max(10, product.reviewCount || 10 + index * 5),
    }));

    const allCategories = await prisma.category.findMany();
    const categoryRevenue = new Map<string, number>();
    const orderItems = await prisma.orderItem.findMany({
      where: tenantFilter.tenantId ? { order: { tenantId: tenantFilter.tenantId } } : undefined,
    });

    for (const item of orderItems) {
      if (!item.productId) continue;
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;
      const category = allCategories.find((c) => c.id === product.categoryId);
      const name = category?.name || "Uncategorized";
      categoryRevenue.set(name, (categoryRevenue.get(name) || 0) + item.price * item.quantity);
    }
    const topCategories = Array.from(categoryRevenue.entries()).map(([name, revenue]) => ({
      name,
      revenue,
    }));

    res.json({
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      revenueByMonth,
      ordersByStatus,
      topProducts,
      topCategories,
    });
  } catch (e) {
    console.error("Analytics error", e);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/admin/orders", requireAdmin, requirePermission("orders", "view"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const orders = await prisma.order.findMany({
      where: tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : undefined,
      include: { items: true, trackingEvents: { orderBy: { eventAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
    const orderIds = orders.map((order) => order.id);
    const payments = orderIds.length
      ? await prisma.payment.findMany({
        where: { orderId: { in: orderIds } },
        orderBy: { createdAt: "desc" },
      })
      : [];
    const paymentByOrderId = new Map<string, (typeof payments)[number]>();
    for (const payment of payments) {
      if (!payment.orderId) continue;
      if (!paymentByOrderId.has(payment.orderId)) {
        paymentByOrderId.set(payment.orderId, payment);
      }
    }

    const result = orders.map((order) => ({
      ...(function resolveOrderPaymentData() {
        const linkedPayment = paymentByOrderId.get(order.id);
        const paymentItems = linkedPayment
          ? parseStoredPaymentItems(linkedPayment.items)
          : { orderItems: [], proofImage: undefined, proofVideo: undefined, proofSubmittedAt: undefined, proofApprovedAt: undefined };
        return {
          paymentId: linkedPayment?.id || null,
          paymentProofImage: paymentItems.proofImage || null,
          paymentProofVideo: paymentItems.proofVideo || null,
          paymentProofSubmittedAt: paymentItems.proofSubmittedAt || null,
          paymentProofApprovedAt: paymentItems.proofApprovedAt || null,
        };
      })(),
      id: order.id,
      orderTrackingId: resolveOrderTrackingId(order),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      cargoType: order.cargoType,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      trackingUrl: order.trackingUrl,
      currentLocation: order.currentLocation,
      estimatedDelivery: order.estimatedDelivery,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      lastTrackingUpdate: order.lastTrackingUpdate,
      trackingEvents: order.trackingEvents.map((event) => ({
        id: event.id,
        status: event.status,
        title: event.title,
        message: event.message,
        location: event.location,
        source: event.source,
        eventAt: event.eventAt,
      })),
    }));

    res.json(result);
  } catch (e) {
    console.error("Fetch admin orders error", e);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/api/admin/orders/:id/approve-payment", requireAdmin, requirePermission("orders", "approve"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
    });
    if (!order) return res.status(404).json({ error: "Not found" });
    if (order.paymentMethod === "cod") {
      return res.status(400).json({ error: "COD orders do not require payment approval" });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) {
      return res.status(404).json({ error: "Linked payment record not found" });
    }

    const parsedItems = parseStoredPaymentItems(payment.items);
    if (requiresManualProofApproval(order.paymentMethod) && !parsedItems.proofImage && !parsedItems.proofVideo) {
      return res.status(400).json({ error: "Payment proof image or video is required before approval" });
    }

    const approvedAt = new Date().toISOString();
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        items: buildStoredPaymentItems({
          orderItems: parsedItems.orderItems,
          ...(parsedItems.proofImage ? { proofImage: parsedItems.proofImage } : {}),
          ...(parsedItems.proofVideo ? { proofVideo: parsedItems.proofVideo } : {}),
          ...(parsedItems.proofSubmittedAt ? { proofSubmittedAt: parsedItems.proofSubmittedAt } : {}),
          ...(parsedItems.proofImage || parsedItems.proofVideo ? { proofApprovedAt: approvedAt } : {}),
        }),
      },
    });

    const updatedOrder = await markOrderPaymentApproved({
      orderId: order.id,
      source: "admin",
      note: "Payment approved by admin. Your order is now moving to processing.",
    });
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });

    res.json({
      success: true,
      id: updatedOrder.id,
      orderTrackingId: resolveOrderTrackingId(updatedOrder),
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      paymentId: payment.id,
      paymentProofApprovedAt: parsedItems.proofImage || parsedItems.proofVideo ? approvedAt : null,
    });
  } catch (e) {
    console.error("Approve payment error", e);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

app.patch("/api/admin/orders/:id/status", requireAdmin, requirePermission("orders", "edit"), async (req, res) => {
  try {
    const schema = z.object({
      status: z.enum(ORDER_STATUSES),
      location: z.string().min(2).max(160).optional(),
      note: z.string().min(2).max(280).optional(),
      trackingNumber: z.string().min(3).max(80).optional(),
      trackingCarrier: z.string().min(2).max(80).optional(),
      trackingUrl: z.string().url().optional(),
      estimatedDelivery: z.string().datetime().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const { id } = req.params;
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
      include: { items: true },
    });
    if (!order) {
      return res.status(404).json({ error: "Not found" });
    }
    const status = parsed.data.status;
    const location = resolveStatusLocation(status, order.shippingAddress, parsed.data.location || order.currentLocation);
    const updateData: Prisma.OrderUpdateInput = {
      status,
      currentLocation: location,
      lastTrackingUpdate: new Date(),
    };
    if (parsed.data.trackingNumber) {
      updateData.trackingNumber = parsed.data.trackingNumber.toUpperCase();
    }
    if (parsed.data.trackingCarrier) {
      updateData.trackingCarrier = parsed.data.trackingCarrier;
    }
    if (parsed.data.trackingUrl) {
      updateData.trackingUrl = parsed.data.trackingUrl;
    }
    if (parsed.data.estimatedDelivery) {
      updateData.estimatedDelivery = new Date(parsed.data.estimatedDelivery);
    }
    if (status === "shipped") {
      if (!order.shippedAt) updateData.shippedAt = new Date();
      if (!order.trackingNumber && !parsed.data.trackingNumber) {
        updateData.trackingNumber = createTrackingNumber();
      }
      if (!order.trackingCarrier && !parsed.data.trackingCarrier) {
        updateData.trackingCarrier = "IMK Logistics";
      }
      if (!order.estimatedDelivery && !parsed.data.estimatedDelivery) {
        updateData.estimatedDelivery = resolveEstimatedDelivery(order.cargoType);
      }
    }
    if (status === "delivered") {
      updateData.deliveredAt = new Date();
      updateData.currentLocation = order.shippingAddress;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    await appendTrackingEvent({
      orderId: id,
      status,
      location: resolveStatusLocation(status, order.shippingAddress, updated.currentLocation || location),
      note: parsed.data.note,
      source: "admin",
    });

    if (order.customerEmail && (updated.status === "shipped" || updated.status === "delivered")) {
      const item = order.items[0];
      const template =
        updated.status === "shipped"
          ? emailService.orderShippedTemplate({
            id: order.id,
            customerName: order.customerName,
            productName: item?.productName || "Order Items",
            quantity: item?.quantity || 1,
            price: formatMoney(order.total),
            date: order.createdAt.toISOString(),
          })
          : emailService.orderDeliveredTemplate({
            id: order.id,
            customerName: order.customerName,
            productName: item?.productName || "Order Items",
            quantity: item?.quantity || 1,
            price: formatMoney(order.total),
            date: order.createdAt.toISOString(),
          });
      await prisma.emailHistory.create({
        data: emailService.createHistoryEntry(
          order.customerEmail,
          template.subject,
          updated.status === "shipped" ? "orderShipped" : "orderDelivered",
          "Sent"
        ),
      });
    }

    if (updated.status === "cancelled") {
      await notifySuperAdmins({
        type: "order_cancellation",
        title: "Order Cancelled",
        message: `Order ${order.id} was cancelled.`,
        data: { orderId: order.id },
      });
      if (order.tenantId) {
        await notifyRole({
          roleName: "Manager",
          tenantId: order.tenantId,
          type: "order_cancellation",
          title: "Order Cancelled",
          message: `Order ${order.id} was cancelled.`,
          data: { orderId: order.id },
        });
      }
    }

    res.json({
      id,
      status: parsed.data.status,
      trackingNumber: updated.trackingNumber,
      trackingCarrier: updated.trackingCarrier,
      currentLocation: updated.currentLocation,
      estimatedDelivery: updated.estimatedDelivery,
      lastTrackingUpdate: updated.lastTrackingUpdate,
    });
  } catch (e) {
    console.error("Update order status error", e);
    res.status(500).json({ error: "Failed to update order" });
  }
});

app.patch("/api/admin/orders/:id/tracking", requireAdmin, requirePermission("orders", "edit"), async (req, res) => {
  try {
    const schema = z.object({
      trackingNumber: z.string().min(3).max(80).optional(),
      trackingCarrier: z.string().min(2).max(80).optional(),
      trackingUrl: z.string().url().optional(),
      currentLocation: z.string().min(2).max(160).optional(),
      estimatedDelivery: z.string().datetime().optional(),
      note: z.string().min(2).max(280).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid tracking payload", details: parsed.error.flatten() });
    }

    const hasPayload = Object.values(parsed.data).some((value) => value !== undefined);
    if (!hasPayload) {
      return res.status(400).json({ error: "No tracking fields provided" });
    }

    const tenantFilter = getTenantFilter(req as AuthRequest);
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
    });
    if (!order) return res.status(404).json({ error: "Not found" });

    const updateData: Prisma.OrderUpdateInput = {
      lastTrackingUpdate: new Date(),
    };
    if (parsed.data.trackingNumber) updateData.trackingNumber = parsed.data.trackingNumber.toUpperCase();
    if (parsed.data.trackingCarrier) updateData.trackingCarrier = parsed.data.trackingCarrier;
    if (parsed.data.trackingUrl) updateData.trackingUrl = parsed.data.trackingUrl;
    if (parsed.data.currentLocation) updateData.currentLocation = parsed.data.currentLocation;
    if (parsed.data.estimatedDelivery) updateData.estimatedDelivery = new Date(parsed.data.estimatedDelivery);

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
    });

    const eventStatus: OrderStatus = isOrderStatus(order.status) ? order.status : "pending";
    const message = parsed.data.note || "Tracking details were updated by support.";
    await prisma.orderTrackingEvent.create({
      data: {
        orderId: order.id,
        status: eventStatus,
        title: "Tracking Updated",
        message,
        location: parsed.data.currentLocation || order.currentLocation || undefined,
        source: "admin",
      },
    });

    res.json({
      id: updated.id,
      trackingNumber: updated.trackingNumber,
      trackingCarrier: updated.trackingCarrier,
      trackingUrl: updated.trackingUrl,
      currentLocation: updated.currentLocation,
      estimatedDelivery: updated.estimatedDelivery,
      lastTrackingUpdate: updated.lastTrackingUpdate,
    });
  } catch (e) {
    console.error("Update tracking error", e);
    res.status(500).json({ error: "Failed to update tracking" });
  }
});

app.post("/api/pending-products", async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().trim().min(2).max(160),
      category: z.string().trim().min(2).max(120),
      price: z.coerce.number().positive().max(100000000),
      description: z.string().trim().min(8).max(4000),
      sellerName: z.string().trim().min(2).max(120),
      sellerEmail: z.string().trim().email().max(255),
      location: z.string().trim().min(2).max(120),
      phone: z.string().trim().min(6).max(40),
      image: z.string().trim().min(1),
      video: z.string().trim().min(1).optional().nullable(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    if (!isValidImageMedia(parsed.data.image)) {
      return res.status(400).json({ error: "Invalid payload", details: { fieldErrors: { image: ["A valid image is required"] } } });
    }
    if (parsed.data.video && !isValidVideoMedia(parsed.data.video)) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: { fieldErrors: { video: ["Video must be a valid URL or data URI"] } } });
    }

    const detailsBlock = [`Location: ${parsed.data.location}`, `Phone: ${parsed.data.phone}`];
    if (parsed.data.video) {
      detailsBlock.push("Video: uploaded");
    }
    const description = `${parsed.data.description}\n\n${detailsBlock.join("\n")}`;

    const pending = await prisma.pendingProduct.create({
      data: {
        name: parsed.data.name,
        price: parsed.data.price,
        category: parsed.data.category,
        sellerName: parsed.data.sellerName,
        sellerEmail: parsed.data.sellerEmail,
        description,
        image: parsed.data.image,
        status: "pending",
        submittedAt: new Date(),
      },
    });

    res.status(201).json({ id: pending.id, status: pending.status, submittedAt: pending.submittedAt });
  } catch (e) {
    console.error("Create pending product error", e);
    res.status(500).json({ error: "Failed to submit product" });
  }
});

app.get("/api/admin/pending-products", requireAdmin, requirePermission("products", "view"), async (req, res) => {
  try {
    const pending = await prisma.pendingProduct.findMany({
      orderBy: { submittedAt: "desc" },
    });
    res.json(pending);
  } catch (e) {
    console.error("Fetch pending products error", e);
    res.status(500).json({ error: "Failed to fetch pending products" });
  }
});

app.post("/api/admin/pending-products/:id/approve", requireAdmin, requirePermission("products", "approve"), async (req, res) => {
  try {
    const pending = await prisma.pendingProduct.findUnique({
      where: { id: req.params.id },
    });
    if (!pending) {
      return res.status(404).json({ error: "Not found" });
    }

    const category = await ensureCategory(pending.category);
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const tenantId = tenantFilter.tenantId ?? (await getDefaultTenantId());
    await prisma.product.create({
      data: {
        name: pending.name,
        description: pending.description,
        price: pending.price,
        image: pending.image,
        images: [pending.image],
        categoryId: category.id,
        rating: 4.5,
        reviewCount: 0,
        inStock: true,
        freeShipping: false,
        badge: "New",
        sku: `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
        stock: 20,
        lowStockThreshold: 10,
        lastRestocked: new Date(),
        sellerName: pending.sellerName,
        sellerEmail: pending.sellerEmail,
        tenantId: tenantId || undefined,
        country: "UAE",
        status: "active",
        createdAt: new Date(),
      },
    });

    await prisma.pendingProduct.update({
      where: { id: pending.id },
      data: { status: "approved" },
    });

    if (pending.sellerEmail) {
      const email = emailService.welcomeSellerTemplate(pending.sellerName);
      await prisma.emailHistory.create({
        data: emailService.createHistoryEntry(pending.sellerEmail, email.subject, "welcomeSeller", "Sent"),
      });
    }

    res.json({ id: pending.id, status: "approved" });
  } catch (e) {
    console.error("Approve product error", e);
    res.status(500).json({ error: "Failed to approve product" });
  }
});

app.post("/api/admin/pending-products/:id/reject", requireAdmin, requirePermission("products", "approve"), async (req, res) => {
  try {
    const pending = await prisma.pendingProduct.findUnique({
      where: { id: req.params.id },
    });
    if (!pending) {
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.pendingProduct.update({
      where: { id: pending.id },
      data: { status: "rejected" },
    });

    res.json({ id: pending.id, status: "rejected" });
  } catch (e) {
    console.error("Reject product error", e);
    res.status(500).json({ error: "Failed to reject product" });
  }
});

app.get("/api/admin/products", requireAdmin, requirePermission("products", "view"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const products = await prisma.product.findMany({
      where: tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : undefined,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      products.map((product) => ({
        ...product,
        image: product.images?.length ? product.images[0] : product.image,
        images: product.images?.length ? product.images : [product.image],
        sku: product.sku || `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
        stock: product.stock ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 10,
        lastRestocked: product.lastRestocked || product.createdAt,
        status: product.status || "active",
        category: product.category?.name || "Uncategorized",
      }))
    );
  } catch (e) {
    console.error("Fetch admin products error", e);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/admin/products", requireAdmin, requirePermission("products", "create"), async (req, res) => {
  const imageSchema = z.string().min(1).refine((val) => val.startsWith("data:") || val.startsWith("http"), {
    message: "Image must be a URL or data URI",
  });
  const imagesSchema = z.array(imageSchema).min(1).max(10);
  const schema = z
    .object({
      name: z.string().min(1),
      description: z.string().min(1),
      price: z.number().min(0),
      originalPrice: z.number().min(0).optional().nullable(),
      category: z.string().min(1),
      image: imageSchema.optional(),
      images: imagesSchema.optional(),
      rating: z.number().min(0).max(5).optional(),
      reviewCount: z.number().int().min(0).optional(),
      inStock: z.boolean().optional(),
      freeShipping: z.boolean().optional(),
      badge: z.string().min(1).optional().nullable(),
      sku: z.string().min(1).optional(),
      stock: z.number().int().min(0).optional(),
      lowStockThreshold: z.number().int().min(0).optional(),
      sellerName: z.string().optional().nullable(),
      sellerEmail: z.string().email().optional().nullable(),
      country: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
      tenantId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.images?.length && !data.image) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["images"], message: "At least one image is required" });
      }
    });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const category = await ensureCategory(parsed.data.category);
    const createdAt = new Date();
    const stock = parsed.data.stock ?? 0;
    const images = parsed.data.images ?? (parsed.data.image ? [parsed.data.image] : []);
    const sku = parsed.data.sku ?? `IMK-${Math.floor(Math.random() * 9000 + 1000)}`;
    const tenantId = tenantFilter.tenantId ?? parsed.data.tenantId;
    const product = await prisma.product.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        originalPrice: parsed.data.originalPrice ?? undefined,
        image: images[0],
        images,
        categoryId: category.id,
        rating: parsed.data.rating ?? 4.5,
        reviewCount: parsed.data.reviewCount ?? 0,
        inStock: parsed.data.inStock ?? stock > 0,
        freeShipping: parsed.data.freeShipping ?? false,
        badge: parsed.data.badge ?? "New",
        sku,
        stock,
        lowStockThreshold: parsed.data.lowStockThreshold ?? 10,
        lastRestocked: createdAt,
        sellerName: parsed.data.sellerName ?? undefined,
        sellerEmail: parsed.data.sellerEmail ?? undefined,
        tenantId: tenantId || undefined,
        country: parsed.data.country ?? undefined,
        status: parsed.data.status ?? "active",
        createdAt,
      },
    });
    res.status(201).json(product);
  } catch (e) {
    console.error("Create product error", e);
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, requirePermission("products", "edit"), async (req, res) => {
  const imageSchema = z.string().min(1).refine((val) => val.startsWith("data:") || val.startsWith("http"), {
    message: "Image must be a URL or data URI",
  });
  const imagesSchema = z.array(imageSchema).min(1).max(10);
  const schema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    originalPrice: z.number().min(0).optional().nullable(),
    category: z.string().min(1).optional(),
    image: imageSchema.optional(),
    images: imagesSchema.optional(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().min(0).optional(),
    inStock: z.boolean().optional(),
    freeShipping: z.boolean().optional(),
    badge: z.string().min(1).optional().nullable(),
    sku: z.string().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    sellerName: z.string().optional().nullable(),
    sellerEmail: z.string().email().optional().nullable(),
    country: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const { category, images, image, ...rest } = parsed.data;
    const updateData: Prisma.ProductUncheckedUpdateInput = { ...rest };
    if (category) {
      const ensured = await ensureCategory(category);
      updateData.categoryId = ensured.id;
    }
    if (images !== undefined) {
      updateData.images = images;
      updateData.image = images[0];
    } else if (image !== undefined) {
      const existingImages = existing.images?.length ? existing.images : [existing.image];
      updateData.images = [image, ...existingImages.slice(1)];
      updateData.image = image;
    }
    if (parsed.data.stock !== undefined) {
      updateData.inStock = parsed.data.stock > 0;
      updateData.lastRestocked = new Date();
    }
    const updated = await prisma.product.update({ where: { id: req.params.id }, data: updateData });
    res.json(updated);
  } catch (e) {
    console.error("Update product error", e);
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, requirePermission("products", "delete"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

    await prisma.product.delete({ where: { id: req.params.id } });

    await createAuditLog({
      userId: (req as AuthRequest).user!.userId,
      tenantId: (req as AuthRequest).user!.tenantId,
      action: "delete",
      resource: "product",
      resourceId: req.params.id,
      changes: { name: existing.name },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.json({ id: req.params.id });
  } catch (e) {
    console.error("Delete product error", e);
    res.status(404).json({ error: "Not found" });
  }
});

app.get("/api/admin/inventory", requireAdmin, requirePermission("products", "view"), async (req, res) => {
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const products = await prisma.product.findMany({
      where: tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : undefined,
      include: { category: true },
    });
    res.json(
      products.map((product) => ({
        id: product.id,
        productId: product.id,
        productName: product.name,
        sku: product.sku || `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
        stock: product.stock ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 10,
        lastRestocked: product.lastRestocked || product.createdAt,
        category: product.category?.name || "Uncategorized",
      }))
    );
  } catch (e) {
    console.error("Fetch inventory error", e);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

app.patch("/api/admin/inventory/:id", requireAdmin, requirePermission("products", "edit"), async (req, res) => {
  const schema = z.object({ stock: z.number().int().min(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const tenantFilter = getTenantFilter(req as AuthRequest);
    const existing = await prisma.product.findFirst({
      where: {
        id: req.params.id,
        ...(tenantFilter.tenantId ? { tenantId: tenantFilter.tenantId } : {}),
      },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: parsed.data.stock, inStock: parsed.data.stock > 0, lastRestocked: new Date() },
    });
    res.json({ id: updated.id, stock: updated.stock });
  } catch (e) {
    console.error("Update inventory error", e);
    res.status(404).json({ error: "Not found" });
  }
});

app.get("/api/admin/categories", requireAdmin, requirePermission("products", "view"), async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    const categoryMedia = await fetchCategoryMediaSetting();
    res.json(
      categories.map((category) => ({
        ...category,
        video: categoryMedia[category.id]?.video,
      }))
    );
  } catch (e) {
    console.error("Fetch admin categories error", e);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/admin/categories", requireAdmin, requirePermission("products", "create"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    image: z.string().optional(),
    video: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const category = await ensureCategory(parsed.data.name);
    if (parsed.data.image) {
      await prisma.category.update({ where: { id: category.id }, data: { image: parsed.data.image } });
    }
    if (parsed.data.video) {
      await updateCategoryMediaSetting(category.id, { video: parsed.data.video });
    }
    const fresh = await prisma.category.findUnique({ where: { id: category.id } });
    const categoryMedia = await fetchCategoryMediaSetting();
    res.status(201).json({ ...fresh, video: categoryMedia[category.id]?.video });
  } catch (e) {
    console.error("Create category error", e);
    res.status(500).json({ error: "Failed to create category" });
  }
});

app.delete("/api/admin/categories/:id", requireAdmin, requirePermission("products", "delete"), async (req, res) => {
  try {
    const toRemove = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!toRemove) return res.status(404).json({ error: "Not found" });
    const uncategorized = await ensureCategory("Uncategorized");
    await prisma.product.updateMany({ where: { categoryId: toRemove.id }, data: { categoryId: uncategorized.id } });
    await prisma.category.delete({ where: { id: req.params.id } });
    await updateCategoryMediaSetting(req.params.id, { video: null });
    res.json({ id: req.params.id });
  } catch (e) {
    console.error("Delete category error", e);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

app.patch("/api/admin/categories/:id", requireAdmin, requirePermission("products", "edit"), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).optional(),
    image: z.string().optional().nullable(),
    video: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updateData: { name?: string; image?: string | null } = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.image !== undefined) updateData.image = parsed.data.image;
    if (Object.keys(updateData).length > 0) {
      await prisma.category.update({ where: { id: req.params.id }, data: updateData });
    }
    if (parsed.data.video !== undefined) {
      await updateCategoryMediaSetting(req.params.id, { video: parsed.data.video });
    }
    const fresh = await prisma.category.findUnique({ where: { id: req.params.id } });
    const categoryMedia = await fetchCategoryMediaSetting();
    res.json({ ...fresh, video: categoryMedia[req.params.id]?.video });
  } catch (e) {
    console.error("Update category error", e);
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.get("/api/admin/flash-deals", requireAdmin, requirePermission("marketing", "view"), async (_req, res) => {
  try {
    const deals = await fetchFlashDealsSetting();
    res.json(deals);
  } catch (e) {
    console.error("Fetch admin flash deals error", e);
    res.status(500).json({ error: "Failed to fetch flash deals" });
  }
});

app.put("/api/admin/flash-deals", requireAdmin, requirePermission("marketing", "edit"), async (req, res) => {
  const parsed = z
    .object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      endsAt: z.string().nullable().optional(),
      productIds: z.array(z.string()).optional(),
      cards: z.array(z.unknown()).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const value = normalizeFlashDeals(parsed.data);
    const updated = await prisma.systemSetting.upsert({
      where: { key: "flash_deals" },
      update: { value },
      create: { key: "flash_deals", value },
    });
    res.json(updated.value);
  } catch (e) {
    console.error("Update flash deals error", e);
    res.status(500).json({ error: "Failed to update flash deals" });
  }
});

app.get("/api/admin/flash-ads", requireAdmin, requirePermission("marketing", "view"), async (_req, res) => {
  try {
    const ads = await fetchFlashAdsSetting();
    res.json(ads);
  } catch (e) {
    console.error("Fetch admin flash ads error", e);
    res.status(500).json({ error: "Failed to fetch flash ads" });
  }
});

app.put("/api/admin/flash-ads", requireAdmin, requirePermission("marketing", "edit"), async (req, res) => {
  const parsed = z
    .object({
      ads: z.array(z.unknown()).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    const value = normalizeFlashAds(parsed.data);
    const updated = await prisma.systemSetting.upsert({
      where: { key: "flash_ads" },
      update: { value },
      create: { key: "flash_ads", value },
    });
    res.json(updated.value);
  } catch (e) {
    console.error("Update flash ads error", e);
    res.status(500).json({ error: "Failed to update flash ads" });
  }
});

app.get("/api/admin/email-history", requireAdmin, requirePermission("marketing", "view"), async (_req, res) => {
  try {
    const history = await prisma.emailHistory.findMany({ orderBy: { createdAt: "desc" } });
    res.json(history);
  } catch (e) {
    console.error("Fetch email history error", e);
    res.status(500).json({ error: "Failed to fetch email history" });
  }
});

app.post("/api/admin/email/send-test", requireAdmin, requirePermission("marketing", "edit"), async (req, res) => {
  const schema = z.object({ to: z.string().email().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }
  const to = parsed.data.to || SUPPORT_EMAIL;
  const email = emailService.orderConfirmationTemplate({
    id: createOrderId(),
    customerName: "Test Customer",
    productName: "Test Product",
    quantity: 1,
    price: formatMoney(99.99),
    date: new Date().toISOString(),
  });
  try {
    await prisma.emailHistory.create({ data: emailService.createHistoryEntry(to, email.subject, "orderConfirmation", "Sent") });
    res.json({ success: true });
  } catch (e) {
    console.error("Send test email error", e);
    res.status(500).json({ error: "Failed to send test email" });
  }
});

app.post("/api/admin/email/low-stock-alerts", requireAdmin, requirePermission("notifications", "create"), async (_req, res) => {
  try {
    const products = await prisma.product.findMany();
    const filtered = products.filter((p) => p.stock <= p.lowStockThreshold);
    await Promise.all(
      filtered.map(async (product) => {
        const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
        const email = emailService.lowStockAlertTemplate({
          name: product.name,
          quantity: product.stock,
          category: category?.name || "Uncategorized",
          price: formatMoney(product.price),
        });
        await prisma.emailHistory.create({ data: emailService.createHistoryEntry(SUPPORT_EMAIL, email.subject, "lowStockAlert", "Sent") });
      })
    );
    res.json({ sent: filtered.length });
  } catch (e) {
    console.error("Low stock alerts error", e);
    res.status(500).json({ error: "Failed to send low stock alerts" });
  }
});

// Global error handler to avoid leaking stack traces in production
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ error: "Internal server error" });
  }
  if (err instanceof Error) {
    return res.status(500).json({ error: err.message || "Internal error", stack: err.stack });
  }
  return res.status(500).json({ error: "Internal error" });
});

const port = Number(process.env.API_PORT || process.env.PORT || 5050);

const isServerless = process.env.VERCEL === "1" || process.env.VERCEL === "true" || !!process.env.VERCEL;

if (!isServerless) {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export default app;
