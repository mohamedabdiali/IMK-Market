require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const app = express();
const BODY_LIMIT = process.env.API_BODY_LIMIT || '25mb';
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use('/mock-images', express.static(path.join(__dirname, '..', 'public', 'mock-images')));
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));

const PORT = Number(process.env.API_PORT || process.env.PORT || 5050);

const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || 'SLE';
const MOCK_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@imkmarket.com';
const MOCK_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const MOCK_REFRESH_DAYS = 30;
const mockSessions = new Map();

const createCsrfToken = () => crypto.randomBytes(16).toString('hex');

const parseCookies = (cookieHeader = '') => {
  const cookies = {};
  cookieHeader.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) return;
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
};

const buildCookie = (name, value, opts = {}) => {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) segments.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) segments.push(`Path=${opts.path}`);
  if (opts.httpOnly) segments.push('HttpOnly');
  if (opts.sameSite) segments.push(`SameSite=${opts.sameSite}`);
  return segments.join('; ');
};

const setAuthCookies = (res, refreshToken, csrfToken) => {
  const maxAge = MOCK_REFRESH_DAYS * 24 * 60 * 60;
  res.setHeader('Set-Cookie', [
    buildCookie('refresh_token', refreshToken, { maxAge, path: '/api/auth', httpOnly: true, sameSite: 'Strict' }),
    buildCookie('csrf_token', csrfToken, { maxAge, path: '/', sameSite: 'Strict' }),
  ]);
};

const clearAuthCookies = (res) => {
  res.setHeader('Set-Cookie', [
    buildCookie('refresh_token', '', { maxAge: 0, path: '/api/auth', httpOnly: true, sameSite: 'Strict' }),
    buildCookie('csrf_token', '', { maxAge: 0, path: '/', sameSite: 'Strict' }),
  ]);
};

const issueMockSession = (user) => {
  const refreshToken = createId('RT', 8);
  const csrfToken = createCsrfToken();
  mockSessions.set(refreshToken, { user, csrfToken });
  return { refreshToken, csrfToken };
};

const createId = (prefix, bytes = 4) => `${prefix}-${crypto.randomBytes(bytes).toString('hex').toUpperCase()}`;
const nowIso = () => new Date().toISOString();
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];

const DATA_PATH = path.join(__dirname, '..', 'data', 'imk-market.json');
const ASSET_ROOT = path.join(__dirname, '..', 'public', 'assets');
const PRODUCT_ASSET_ROOT = path.join(ASSET_ROOT, 'products');
const MIN_ASSET_BYTES = 5 * 1024;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

const isLocalAssetPath = (value) => typeof value === 'string' && value.startsWith('/assets/');

const assetPathToDisk = (value) => {
  if (!isLocalAssetPath(value)) return null;
  const relative = value.replace('/assets/', '');
  return path.join(ASSET_ROOT, relative);
};

const isUsableAsset = (value) => {
  const diskPath = assetPathToDisk(value);
  if (!diskPath || !fs.existsSync(diskPath)) return false;
  try {
    const stats = fs.statSync(diskPath);
    return stats.isFile() && stats.size >= MIN_ASSET_BYTES;
  } catch {
    return false;
  }
};

const listAssetFiles = (diskDir, urlBase, extensions) => {
  if (!diskDir || !fs.existsSync(diskDir)) return [];
  try {
    return fs
      .readdirSync(diskDir)
      .filter((file) => extensions.has(path.extname(file).toLowerCase()))
      .filter((file) => {
        const filePath = path.join(diskDir, file);
        try {
          const stats = fs.statSync(filePath);
          return stats.isFile() && stats.size >= MIN_ASSET_BYTES;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `${urlBase}/${file}`);
  } catch {
    return [];
  }
};

const buildProductAssetIndex = () => {
  if (!fs.existsSync(PRODUCT_ASSET_ROOT)) return { index: new Map(), sets: [] };
  const entries = fs.readdirSync(PRODUCT_ASSET_ROOT, { withFileTypes: true });
  const index = new Map();
  const sets = [];
  entries
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      const productId = entry.name;
      const diskDir = path.join(PRODUCT_ASSET_ROOT, productId);
      const urlBase = `/assets/products/${productId}`;
      const images = listAssetFiles(diskDir, urlBase, IMAGE_EXTENSIONS);
      const videos = listAssetFiles(diskDir, urlBase, VIDEO_EXTENSIONS);
      if (images.length) {
        const assetSet = { images, videos };
        index.set(productId, assetSet);
        sets.push(assetSet);
      }
    });
  return { index, sets };
};

const productAssetCache = buildProductAssetIndex();

const pickAssetSet = (key) => {
  if (!productAssetCache.sets.length) return null;
  const text = (key || '').toString();
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return productAssetCache.sets[hash % productAssetCache.sets.length];
};

const ensureGallerySize = (images, minSize = 8) => {
  if (!Array.isArray(images)) return [];
  const unique = images.filter(Boolean);
  if (unique.length === 0) return [];
  const output = unique.slice();
  let cursor = 0;
  while (output.length < minSize) {
    output.push(unique[cursor % unique.length]);
    cursor += 1;
  }
  return output;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => (typeof value === 'boolean' ? value : fallback);

const loadImkMarketSeed = () => {
  if (!fs.existsSync(DATA_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
};

const normalizeSeedProducts = (items, categories) => {
  const categoryByName = new Map(
    (Array.isArray(categories) ? categories : [])
      .filter((cat) => cat && cat.name && cat.id)
      .map((cat) => [cat.name.toLowerCase(), cat.id])
  );
  const categoryIds = new Set(
    (Array.isArray(categories) ? categories : [])
      .filter((cat) => cat && cat.id)
      .map((cat) => cat.id.toString())
  );
  const fallbackSets = (Array.isArray(items) ? items : [])
    .map((product) => {
      const rawImages = Array.isArray(product.images)
        ? product.images.filter((img) => typeof img === 'string' && img.trim())
        : [];
      const rawVideos = Array.isArray(product.videos)
        ? product.videos.filter((vid) => typeof vid === 'string' && vid.trim())
        : [];
      const localImages = rawImages.filter((img) => isLocalAssetPath(img) && isUsableAsset(img));
      const usableImages = localImages.length ? localImages : rawImages;
      const images = ensureGallerySize(usableImages, 8);
      if (images.length < 8) return null;
      const localVideos = rawVideos.filter((vid) => isLocalAssetPath(vid) && isUsableAsset(vid));
      return { images, videos: localVideos.length ? localVideos : rawVideos };
    })
    .filter(Boolean);
  const combinedSets = [...productAssetCache.sets, ...fallbackSets];
  const pickFallbackSet = (key) => {
    if (!combinedSets.length) return null;
    const text = (key || '').toString();
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return combinedSets[hash % combinedSets.length];
  };

  return (Array.isArray(items) ? items : []).map((product) => {
    const id = (product.id || createId('PRD', 4)).toString();
    const assetSet = productAssetCache.index.get(id) || null;
    const fallbackSet = pickFallbackSet(product.name || id);
    const rawImages = Array.isArray(product.images)
      ? product.images.filter((img) => typeof img === 'string' && img.trim())
      : [];
    const rawVideos = Array.isArray(product.videos)
      ? product.videos.filter((vid) => typeof vid === 'string' && vid.trim())
      : [];
    const localImages = rawImages.filter((img) => isLocalAssetPath(img) && isUsableAsset(img));
    const localVideos = rawVideos.filter((vid) => isLocalAssetPath(vid) && isUsableAsset(vid));

    let images = [];
    if (assetSet && assetSet.images.length) images = assetSet.images.slice();
    else if (localImages.length) images = localImages.slice();
    else if (fallbackSet && fallbackSet.images.length) images = fallbackSet.images.slice();
    else if (rawImages.length) images = rawImages.slice();
    else if (product.image) images = [product.image];

    images = ensureGallerySize(images, 8);

    let videos = [];
    if (assetSet && assetSet.videos.length) videos = assetSet.videos.slice();
    else if (localVideos.length) videos = localVideos.slice();
    else if (fallbackSet && fallbackSet.videos.length) videos = fallbackSet.videos.slice();
    else if (rawVideos.length) videos = rawVideos.slice();
    else if (product.video) videos = [product.video];

    let categoryId = null;
    if (product.categoryId && categoryIds.has(product.categoryId.toString())) {
      categoryId = product.categoryId.toString();
    } else if (typeof product.category === 'string') {
      const rawCategory = product.category.toString();
      if (categoryIds.has(rawCategory)) {
        categoryId = rawCategory;
      } else {
        categoryId = categoryByName.get(rawCategory.toLowerCase()) || null;
      }
    }
    if (!categoryId && categories && categories.length) {
      categoryId = categories[0].id.toString();
    }

    return {
      ...product,
      id,
      name: product.name || `Product ${id}`,
      description: product.description || '',
      price: toNumber(product.price, 0),
      originalPrice: product.originalPrice === undefined || product.originalPrice === null ? undefined : toNumber(product.originalPrice),
      image: images[0] || product.image || '',
      images,
      videos,
      categoryId,
      rating: toNumber(product.rating, 4.5),
      reviewCount: Math.max(0, Math.floor(toNumber(product.reviewCount, 0))),
      inStock: toBoolean(product.inStock, true),
      freeShipping: toBoolean(product.freeShipping, false),
      badge: product.badge ?? null,
      createdAt: product.createdAt || nowIso(),
      updatedAt: product.updatedAt || product.createdAt || nowIso(),
      sku: product.sku || `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
      stock: Math.max(0, Math.floor(toNumber(product.stock, 0))),
      lowStockThreshold: Math.max(0, Math.floor(toNumber(product.lowStockThreshold, 10))),
      lastRestocked: product.lastRestocked || product.createdAt || nowIso(),
      status: product.status || 'active',
    };
  });
};
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const TRACKING_EVENT_CONTENT = {
  pending: {
    title: 'Order Confirmed',
    message: 'Your order has been received and is waiting for processing.',
  },
  processing: {
    title: 'Order Processing',
    message: 'Your items are being prepared for dispatch.',
  },
  shipped: {
    title: 'Order Shipped',
    message: 'Your package is in transit.',
  },
  delivered: {
    title: 'Order Delivered',
    message: 'Your order has been delivered successfully.',
  },
  cancelled: {
    title: 'Order Cancelled',
    message: 'This order was cancelled.',
  },
};

const TRACKING_LOCATION_BY_STATUS = {
  pending: 'Order desk',
  processing: 'Warehouse',
  shipped: 'Transit hub',
  delivered: 'Delivery destination',
  cancelled: 'Order desk',
};

const CARGO_ESTIMATE_DAYS = {
  air: 3,
  land: 7,
  sea: 18,
};

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizePhone = (value) => (value || '').toString().replace(/[^\d+]/g, '');
const normalizeCustomerPhone = (value) => {
  const normalized = normalizePhone(value);
  if (!normalized) return '';
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
};
const hashPassword = (value) => crypto.createHash('sha256').update(value).digest('hex');
const createTrackingNumber = () => `TRK-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
const resolveOrderTrackingId = (order) => order.trackingNumber || order.id;
const canProceedWithOrder = (order) => order.paymentMethod === 'cod' || order.paymentStatus === 'paid';
const requiresManualProofApproval = (paymentMethod) =>
  paymentMethod === 'orange_money' || paymentMethod === 'afrimoney' || paymentMethod === 'qmoney';
const parseStoredPaymentItems = (value) => {
  if (Array.isArray(value)) {
    return { orderItems: value };
  }
  if (!value || typeof value !== 'object') {
    return { orderItems: [] };
  }
  const orderItems = Array.isArray(value.orderItems) ? value.orderItems : [];
  const proofImage = typeof value.proofImage === 'string' ? value.proofImage : undefined;
  const proofVideo = typeof value.proofVideo === 'string' ? value.proofVideo : undefined;
  const proofSubmittedAt = typeof value.proofSubmittedAt === 'string' ? value.proofSubmittedAt : undefined;
  const proofApprovedAt = typeof value.proofApprovedAt === 'string' ? value.proofApprovedAt : undefined;
  return { orderItems, proofImage, proofVideo, proofSubmittedAt, proofApprovedAt };
};
const buildStoredPaymentItems = (data) => ({
  orderItems: data.orderItems,
  ...(data.proofImage ? { proofImage: data.proofImage } : {}),
  ...(data.proofVideo ? { proofVideo: data.proofVideo } : {}),
  ...(data.proofSubmittedAt ? { proofSubmittedAt: data.proofSubmittedAt } : {}),
  ...(data.proofApprovedAt ? { proofApprovedAt: data.proofApprovedAt } : {}),
});

const resolveEstimatedDeliveryIso = (cargoType, fromIso) => {
  const base = new Date(fromIso || nowIso());
  const key = (cargoType || '').toString().toLowerCase();
  const days = CARGO_ESTIMATE_DAYS[key] || 6;
  base.setDate(base.getDate() + days);
  return base.toISOString();
};

const resolveStatusLocation = (status, shippingAddress, explicitLocation) => {
  const location = normalizeText(explicitLocation);
  if (location) return location;
  if (status === 'delivered') return shippingAddress;
  return TRACKING_LOCATION_BY_STATUS[status] || TRACKING_LOCATION_BY_STATUS.pending;
};

const addTrackingEvent = (order, payload) => {
  const status = ORDER_STATUSES.includes(payload.status) ? payload.status : 'pending';
  const content = TRACKING_EVENT_CONTENT[status];
  const note = normalizeText(payload.note);
  const event = {
    id: createId('TRK', 4),
    status,
    title: payload.title || content.title,
    message: payload.message || (note ? `${content.message} ${note}` : content.message),
    location: normalizeText(payload.location) || undefined,
    source: payload.source || 'system',
    eventAt: payload.eventAt || nowIso(),
    createdAt: nowIso(),
  };
  if (!Array.isArray(order.trackingEvents)) order.trackingEvents = [];
  order.trackingEvents.push(event);
  order.lastTrackingUpdate = event.eventAt;
  return event;
};

const ensureTrackingState = (order) => {
  if (!order.trackingNumber) order.trackingNumber = createTrackingNumber();
  if (!order.trackingCarrier) order.trackingCarrier = 'IMK Logistics';
  if (!order.currentLocation) {
    order.currentLocation = resolveStatusLocation(order.status, order.shippingAddress, order.currentLocation);
  }
  if (!order.estimatedDelivery) {
    order.estimatedDelivery = resolveEstimatedDeliveryIso(order.cargoType, order.createdAt);
  }
  if (order.status === 'shipped' && !order.shippedAt) {
    order.shippedAt = order.createdAt;
  }
  if (order.status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = order.createdAt;
    order.currentLocation = order.shippingAddress;
  }
  if (!Array.isArray(order.trackingEvents) || order.trackingEvents.length === 0) {
    addTrackingEvent(order, {
      status: ORDER_STATUSES.includes(order.status) ? order.status : 'pending',
      location: order.currentLocation,
      source: 'system',
      eventAt: order.createdAt,
    });
  }
  if (!order.lastTrackingUpdate) {
    const latest = order.trackingEvents
      .slice()
      .sort((a, b) => new Date(b.eventAt) - new Date(a.eventAt))[0];
    order.lastTrackingUpdate = latest ? latest.eventAt : order.createdAt;
  }
  return order;
};

const markOrderPaymentApproved = (order, source = 'admin', note = 'Payment approved. Your order is now moving to processing.') => {
  if (!order) return null;
  const shouldMoveToProcessing = order.status === 'pending';
  const shouldMarkPaid = order.paymentStatus !== 'paid';
  if (!shouldMoveToProcessing && !shouldMarkPaid) {
    return order;
  }
  if (shouldMoveToProcessing) {
    order.status = 'processing';
  }
  order.paymentStatus = 'paid';
  order.currentLocation = resolveStatusLocation(order.status, order.shippingAddress, order.currentLocation);
  order.lastTrackingUpdate = nowIso();
  addTrackingEvent(order, {
    status: ORDER_STATUSES.includes(order.status) ? order.status : 'processing',
    title: 'Payment Approved',
    message: note,
    location: order.currentLocation,
    source,
    eventAt: order.lastTrackingUpdate,
  });
  return order;
};

const toTrackingResponse = (order) => {
  const hydrated = ensureTrackingState(order);
  const progressMap = {
    pending: 20,
    processing: 45,
    shipped: 75,
    delivered: 100,
    cancelled: 0,
  };
  const events = hydrated.trackingEvents
    .slice()
    .sort((a, b) => new Date(a.eventAt) - new Date(b.eventAt));
  return {
    id: hydrated.id,
    orderTrackingId: resolveOrderTrackingId(hydrated),
    status: hydrated.status,
    paymentMethod: hydrated.paymentMethod,
    paymentStatus: hydrated.paymentStatus,
    approvedToProceed: canProceedWithOrder(hydrated),
    total: hydrated.total,
    cargoType: hydrated.cargoType,
    trackingNumber: hydrated.trackingNumber,
    trackingCarrier: hydrated.trackingCarrier,
    trackingUrl: hydrated.trackingUrl || null,
    currentLocation: hydrated.currentLocation,
    estimatedDelivery: hydrated.estimatedDelivery || null,
    shippedAt: hydrated.shippedAt || null,
    deliveredAt: hydrated.deliveredAt || null,
    lastTrackingUpdate: hydrated.lastTrackingUpdate || null,
    createdAt: hydrated.createdAt,
    progress: progressMap[hydrated.status] || 0,
    items: hydrated.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
    })),
    events,
    support: {
      email: process.env.SUPPORT_EMAIL || 'info@imkmarket.com',
      phone: process.env.SUPPORT_PHONE || '+232-76-123-456',
    },
  };
};

// Extended Categories
let categories = [
  { id: 'c1', name: 'Electronics' },
  { id: 'c2', name: 'Fashion & Apparel' },
  { id: 'c3', name: 'Home & Garden' },
  { id: 'c4', name: 'Books & Media' },
  { id: 'c5', name: 'Sports & Outdoors' },
  { id: 'c6', name: 'Beauty & Personal Care' },
  { id: 'c7', name: 'Toys & Games' },
  { id: 'c8', name: 'Food & Beverages' },
  { id: 'c9', name: 'Automotive' },
  { id: 'c10', name: 'Health & Wellness' },
  { id: 'c11', name: 'Pet Supplies' },
  { id: 'c12', name: 'Office & School Supplies' },
];

// Local image mapping for categories and products
const PRODUCT_COUNT = 97;
const PRODUCT_GALLERY_SIZE = 8;
const categoryImageById = Object.fromEntries(
  categories.map((category) => [category.id, `/mock-images/categories/${category.id}.svg`])
);
categories = categories.map((category) => ({
  ...category,
  image: categoryImageById[category.id],
}));

const productPrefixes = [
  'Premium',
  'Deluxe',
  'Professional',
  'Ultra',
  'Compact',
  'HD',
  'Max',
  'Plus',
  'Pro',
  'Elite',
  'Standard',
  'Advanced',
  'Smart',
  'Digital',
  'Modern',
  'Classic',
  'Eco',
  'Wireless',
  'Portable',
  'Durable',
];

const productSuffixes = [
  'Series',
  'Edition',
  'Bundle',
  'Kit',
  'Pack',
  'Collection',
  'Line',
  'Select',
  'Signature',
  'Choice',
];

const productDescriptions = [
  'High quality with excellent durability',
  'Feature-rich design for maximum performance',
  'Ergonomic and user-friendly interface',
  'Perfect for daily use and heavy workload',
  'Sleek design meets functionality',
  'Industry-leading performance and reliability',
  'Innovative technology for modern lifestyle',
  'Premium materials for long-lasting use',
  'Easy to use and maintain',
  'Best value for money',
];

const createProductImagePath = (index) => {
  const normalizedIndex = ((index % PRODUCT_COUNT) + PRODUCT_COUNT) % PRODUCT_COUNT;
  return `/mock-images/products/p-${String(normalizedIndex + 1).padStart(3, '0')}.svg`;
};

const createProductGallery = (index) => {
  const gallery = [];
  const seen = new Set();
  const stride = 13;

  for (let offset = 0; gallery.length < PRODUCT_GALLERY_SIZE; offset += 1) {
    const nextImage = createProductImagePath(index + offset * stride);
    if (seen.has(nextImage)) continue;
    seen.add(nextImage);
    gallery.push(nextImage);
  }

  return gallery;
};

const generateProducts = () => {
  const generated = [];
  const badges = ['', '', 'Bestseller', 'New', 'Sale', 'Top Rated', 'Limited'];

  for (let index = 0; index < PRODUCT_COUNT; index++) {
    const id = index + 1;
    const category = categories[index % categories.length];
    const prefix = productPrefixes[index % productPrefixes.length];
    const suffix = productSuffixes[Math.floor(index / productPrefixes.length) % productSuffixes.length];
    const name = `${prefix} ${category.name.split(' ')[0]} ${suffix} ${id}`;
    const price = parseFloat((10 + ((index * 17) % 390) + (index % 7) * 0.73).toFixed(2));
    const originalPrice =
      index % 6 === 0 ? undefined : parseFloat((price * (1.12 + ((index % 5) * 0.05))).toFixed(2));
    const rating = parseFloat((3.8 + ((index % 12) * 0.1)).toFixed(1));
    const stock = index % 14 === 0 ? 0 : 8 + ((index * 9) % 132);
    const inStock = stock > 0;
    const createdAt = new Date(Date.now() - randInt(0, 30 * 24 * 60 * 60 * 1000)).toISOString();
    const images = createProductGallery(index);
    const image = images[0];

    generated.push({
      id: String(id),
      name,
      description: productDescriptions[index % productDescriptions.length],
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      image,
      images,
      videos: [],
      categoryId: category.id,
      rating,
      reviewCount: 20 + ((index * 37) % 680),
      inStock,
      freeShipping: index % 3 !== 0,
      badge: badges[index % badges.length] || null,
      status: 'active',
      sku: `IMK-${String(id).padStart(4, '0')}`,
      stock,
      lowStockThreshold: 10,
      lastRestocked: createdAt,
      sellerName: 'IMK-MARKET',
      sellerEmail: 'info@imkmarket.com',
      country: 'UAE',
      createdAt,
      updatedAt: createdAt,
    });
  }
  return generated;
};

let products = generateProducts();

const getCategoryName = (categoryId) =>
  categories.find((c) => c.id === categoryId)?.name || 'Uncategorized';

const ensureCategory = (name, image) => {
  const trimmed = (name || '').toString().trim();
  if (!trimmed) return null;
  const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    if (image) existing.image = image;
    return existing;
  }
  const created = {
    id: `c${categories.length + 1}-${crypto.randomBytes(2).toString('hex')}`,
    name: trimmed,
    image: image || '/mock-images/categories/default.svg',
  };
  categories.push(created);
  return created;
};

const ensureUncategorized = () => ensureCategory('Uncategorized', '/mock-images/categories/default.svg');

const isAbsoluteUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);
const isImagePayload = (value) =>
  typeof value === 'string' && (value.startsWith('data:image/') || isAbsoluteUrl(value) || isLocalAssetPath(value));
const isVideoPayload = (value) =>
  typeof value === 'string' && (value.startsWith('data:video/') || isAbsoluteUrl(value) || isLocalAssetPath(value));
const toPublicMediaUrl = (req, value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (isAbsoluteUrl(trimmed) || !trimmed.startsWith('/')) return trimmed;
  return `${req.protocol}://${req.get('host')}${trimmed}`;
};

const toPublicProduct = (p, req) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: p.price,
  originalPrice: p.originalPrice,
  image: toPublicMediaUrl(req, p.image),
  images: (p.images && p.images.length > 0 ? p.images : [p.image]).map((image) => toPublicMediaUrl(req, image)),
  videos: (p.videos && p.videos.length > 0 ? p.videos : []).map((video) => toPublicMediaUrl(req, video)),
  category: getCategoryName(p.categoryId),
  rating: p.rating,
  reviewCount: p.reviewCount,
  inStock: p.inStock,
  freeShipping: p.freeShipping,
  badge: p.badge,
});

const toAdminProduct = (product, req) => ({
  ...product,
  image: toPublicMediaUrl(req, product.images && product.images.length ? product.images[0] : product.image),
  images: (product.images && product.images.length ? product.images : [product.image]).map((image) =>
    toPublicMediaUrl(req, image)
  ),
  videos: (product.videos && product.videos.length ? product.videos : []).map((video) => toPublicMediaUrl(req, video)),
  sku: product.sku || `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
  stock: product.stock ?? 0,
  lowStockThreshold: product.lowStockThreshold ?? 10,
  lastRestocked: product.lastRestocked || product.createdAt || nowIso(),
  status: product.status || 'active',
  category: getCategoryName(product.categoryId),
});

const toInventoryItem = (product) => ({
  id: product.id,
  productId: product.id,
  productName: product.name,
  sku: product.sku || `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
  stock: product.stock ?? 0,
  lowStockThreshold: product.lowStockThreshold ?? 10,
  lastRestocked: product.lastRestocked || product.createdAt || nowIso(),
  category: getCategoryName(product.categoryId),
});

// Seed some data so the admin panel isn't empty.
let pendingProducts = [
  {
    id: createId('PEND', 3),
    name: 'Handwoven Somali Basket',
    price: 45.99,
    category: 'Home & Garden',
    sellerName: 'Halimo Crafts',
    sellerEmail: 'halimo@crafts.com',
    description: 'Beautiful handwoven basket made with traditional techniques.',
    image: '/mock-images/products/p-091.svg',
    status: 'pending',
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: createId('PEND', 3),
    name: 'Organic Somali Honey',
    price: 34.99,
    category: 'Food & Beverages',
    sellerName: 'Bee Paradise',
    sellerEmail: 'bee@paradise.com',
    description: 'Pure organic honey sourced from Somali highlands.',
    image: '/mock-images/products/p-092.svg',
    status: 'pending',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: createId('PEND', 3),
    name: 'Premium Oud Perfume Oil',
    price: 59.5,
    category: 'Beauty & Personal Care',
    sellerName: 'Sahara Scents',
    sellerEmail: 'sales@saharascents.com',
    description: 'Long-lasting oud perfume oil in a premium roll-on bottle.',
    image: '/mock-images/products/p-093.svg',
    status: 'pending',
    submittedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
];

let orders = [];
(() => {
  const exampleCustomers = [
    { name: 'Mohamed Abdi', email: 'mohamed@example.com', phone: '+232-76-555-0101' },
    { name: 'Amina Yusuf', email: 'amina@example.com', phone: '+232-76-555-0102' },
    { name: 'Fatima Ali', email: 'fatima@example.com', phone: '+232-76-555-0103' },
    { name: 'John Doe', email: 'john@example.com', phone: '+232-76-555-0104' },
  ];
  const statuses = ORDER_STATUSES;
  for (let i = 0; i < 8; i++) {
    const customer = pick(exampleCustomers);
    const itemCount = randInt(1, 4);
    const items = Array.from({ length: itemCount }).map(() => {
      const p = pick(products);
      const quantity = randInt(1, 3);
      return { productName: p.name, quantity, price: p.price };
    });
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date(Date.now() - randInt(1, 20) * 24 * 60 * 60 * 1000).toISOString();

    orders.push({
      id: `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      items,
      total: Math.round(total * 100) / 100,
      status: pick(statuses),
      paymentMethod: pick(['cod', 'paystack', 'orange_money', 'afrimoney', 'qmoney']),
      paymentStatus: pick(['pending', 'initialized', 'paid']),
      paymentReference: `IMK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      createdAt,
      shippingAddress: 'Freetown, Sierra Leone',
      cargoType: pick(['air', 'sea', 'land']),
      trackingNumber: createTrackingNumber(),
      trackingCarrier: 'IMK Logistics',
      trackingUrl: null,
      currentLocation: undefined,
      estimatedDelivery: undefined,
      shippedAt: undefined,
      deliveredAt: undefined,
      lastTrackingUpdate: createdAt,
      trackingEvents: [],
    });
  }
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  orders.forEach((order) => ensureTrackingState(order));
})();

let payments = [];
const DEMO_CUSTOMER_PHONE = normalizeCustomerPhone(process.env.DEMO_CUSTOMER_PHONE || "+23270000000");
const DEMO_CUSTOMER_PASSWORD = process.env.DEMO_CUSTOMER_PASSWORD || "Demo@12345";
const demoCustomerAccount = {
  id: createId("CUST", 4),
  name: "Demo Customer",
  email: "customer@demo.com",
  phone: DEMO_CUSTOMER_PHONE,
  passwordHash: hashPassword(DEMO_CUSTOMER_PASSWORD),
  role: "user",
  createdAt: nowIso(),
};
let customerAccounts = [demoCustomerAccount];
let emailHistory = [
  {
    id: createId('EMAIL', 4),
    to: 'admin@imkmarket.com',
    subject: 'Welcome to IMK-MARKET Admin',
    template: 'welcomeSeller',
    sentAt: nowIso(),
    status: 'Sent',
  },
];

const imkSeed = loadImkMarketSeed();
if (imkSeed) {
  if (Array.isArray(imkSeed.categories) && imkSeed.categories.length) {
    categories = imkSeed.categories.map((category) => ({
      ...category,
      id: category.id?.toString() || createId('CAT', 3),
      name: category.name?.toString() || 'Uncategorized',
      image: category.image || '/mock-images/categories/default.svg',
    }));
  }
  if (Array.isArray(imkSeed.products) && imkSeed.products.length) {
    products = normalizeSeedProducts(imkSeed.products, categories);
  }
}

// Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/categories', (req, res) => {
  const media = getCategoryMediaSetting();
  const result = categories.map(c => ({
    id: c.id,
    name: c.name,
    image: toPublicMediaUrl(req, c.image),
    video: media[c.id] ? media[c.id].video : undefined,
    productCount: products.filter(p => p.categoryId === c.id).length
  }));
  res.json(result);
});

app.get('/api/flash-deals', (_req, res) => {
  res.json(getFlashDealsSetting());
});

app.get('/api/flash-ads', (_req, res) => {
  res.json(getFlashAdsSetting());
});

app.get('/api/products', (req, res) => {
  const { category, q, sort, minPrice, maxPrice, rating, inStock } = req.query;
  let result = products.slice();

  // Filter by category
  if (category) {
    const cat = categories.find(c => c.name === category);
    if (cat) result = result.filter(p => p.categoryId === cat.id);
  }

  // Filter by search query
  if (q) {
    const qq = q.toString().toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(qq) || p.description.toLowerCase().includes(qq));
  }

  // Filter by price range
  if (minPrice) result = result.filter(p => p.price >= parseFloat(minPrice));
  if (maxPrice) result = result.filter(p => p.price <= parseFloat(maxPrice));

  // Filter by rating
  if (rating) result = result.filter(p => p.rating >= parseFloat(rating));

  // Filter by stock
  if (inStock === 'true') result = result.filter(p => p.inStock);

  // Sorting
  if (sort === 'price-low') result.sort((a, b) => a.price - b.price);
  else if (sort === 'price-high') result.sort((a, b) => b.price - a.price);
  else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (sort === 'best-sellers') result.sort((a, b) => b.reviewCount - a.reviewCount);

  res.json(result.map((product) => toPublicProduct(product, req)));
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(toPublicProduct(p, req));
});

app.get('/api/products/search/suggestions', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  if (!q) return res.json([]);
  const suggestions = [...new Set(products.filter(p => p.name.toLowerCase().includes(q)).map(p => p.name))].slice(0, 10);
  res.json(suggestions);
});

app.post('/api/pending-products', (req, res) => {
  const payload = req.body || {};
  const name = (payload.name || '').toString().trim();
  const category = (payload.category || '').toString().trim();
  const description = (payload.description || '').toString().trim();
  const sellerName = (payload.sellerName || '').toString().trim();
  const sellerEmail = (payload.sellerEmail || '').toString().trim();
  const location = (payload.location || '').toString().trim();
  const phone = (payload.phone || '').toString().trim();
  const image = (payload.image || '').toString().trim();
  const video = payload.video ? payload.video.toString().trim() : '';
  const price = Number(payload.price);

  const fieldErrors = {};
  if (name.length < 2) fieldErrors.name = ['Name is required'];
  if (category.length < 2) fieldErrors.category = ['Category is required'];
  if (!Number.isFinite(price) || price <= 0) fieldErrors.price = ['Price must be greater than zero'];
  if (description.length < 8) fieldErrors.description = ['Description is required'];
  if (sellerName.length < 2) fieldErrors.sellerName = ['Seller name is required'];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellerEmail)) fieldErrors.sellerEmail = ['Valid seller email is required'];
  if (location.length < 2) fieldErrors.location = ['Location is required'];
  if (phone.length < 6) fieldErrors.phone = ['Phone number is required'];
  if (!isImagePayload(image)) fieldErrors.image = ['A valid image is required'];
  if (video && !isVideoPayload(video)) fieldErrors.video = ['Video must be a valid URL or data URI'];
  if (Object.keys(fieldErrors).length) {
    return res.status(400).json({ error: 'Invalid payload', details: { fieldErrors } });
  }

  const pending = {
    id: createId('PEND', 3),
    name,
    price,
    category,
    sellerName,
    sellerEmail,
    description,
    image,
    video: video || undefined,
    phone,
    location,
    status: 'pending',
    submittedAt: nowIso(),
  };
  pendingProducts.unshift(pending);
  return res.status(201).json({ id: pending.id, status: pending.status, submittedAt: pending.submittedAt });
});

app.post('/api/orders', (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod,
    paymentReference,
    cargoType,
    items,
  } = req.body || {};

  if (!customerName || !customerEmail || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const normalizedItems = items
    .map((item) => ({
      productName: (item.productName || '').toString(),
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    }))
    .filter((item) => item.productName && item.quantity > 0 && item.price >= 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: 'Invalid items' });
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const createdAt = nowIso();
  const order = {
    id: `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    customerName,
    customerEmail,
    customerPhone,
    items: normalizedItems,
    total: Math.round(total * 100) / 100,
    status: 'pending',
    paymentMethod: paymentMethod || 'cod',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'initialized',
    paymentReference: paymentReference || undefined,
    createdAt,
    shippingAddress,
    cargoType: cargoType || undefined,
    trackingNumber: createTrackingNumber(),
    trackingCarrier: 'IMK Logistics',
    trackingUrl: undefined,
    currentLocation: resolveStatusLocation('pending', shippingAddress),
    estimatedDelivery: resolveEstimatedDeliveryIso(cargoType, createdAt),
    shippedAt: undefined,
    deliveredAt: undefined,
    lastTrackingUpdate: createdAt,
    trackingEvents: [],
  };
  addTrackingEvent(order, {
    status: 'pending',
    location: order.currentLocation,
    source: 'system',
    eventAt: createdAt,
  });
  orders.unshift(order);
  return res.status(201).json(order);
});

app.get('/api/orders/track', (req, res) => {
  const orderTrackingId = typeof req.query.orderTrackingId === 'string' ? req.query.orderTrackingId.trim().toUpperCase() : '';
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
  const trackingNumber =
    typeof req.query.trackingNumber === 'string' ? req.query.trackingNumber.trim().toUpperCase() : '';
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';

  if (!orderTrackingId && !orderId && !trackingNumber) {
    return res.status(400).json({ error: 'Provide orderTrackingId, orderId, or trackingNumber' });
  }
  const hasStrongReference = Boolean(orderTrackingId) || Boolean(orderId && trackingNumber);
  if (!hasStrongReference && !email && !phone) {
    return res.status(400).json({ error: 'Provide email or phone for verification' });
  }

  const order = orders.find((item) => {
    if (orderTrackingId && (item.id.toUpperCase() === orderTrackingId || (item.trackingNumber || '').toUpperCase() === orderTrackingId)) {
      return true;
    }
    if (orderId && item.id === orderId) return true;
    if (trackingNumber && (item.trackingNumber || '').toUpperCase() === trackingNumber) return true;
    return false;
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (orderTrackingId) {
    const matchesTrackingId = order.id.toUpperCase() === orderTrackingId || (order.trackingNumber || '').toUpperCase() === orderTrackingId;
    if (!matchesTrackingId) return res.status(404).json({ error: 'Order not found' });
  }
  if (orderId && order.id !== orderId) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (trackingNumber && (order.trackingNumber || '').toUpperCase() !== trackingNumber) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (hasStrongReference) {
    return res.json(toTrackingResponse(order));
  }

  const emailMatches = email ? (order.customerEmail || '').toLowerCase() === email : true;
  const phoneMatches = phone ? normalizePhone(order.customerPhone) === normalizePhone(phone) : true;
  if (!emailMatches || !phoneMatches) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(toTrackingResponse(order));
});

app.post('/api/payments/initiate', (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    paymentMethod,
    cargoType,
    paymentProofImage,
    paymentProofVideo,
    items,
  } = req.body || {};

  if (!customerName || !customerEmail || !shippingAddress || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const normalizedItems = items
    .map((item) => ({
      productName: (item.productName || '').toString(),
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    }))
    .filter((item) => item.productName && item.quantity > 0 && item.price >= 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: 'Invalid items' });
  }

  if (paymentProofImage && !isImagePayload(paymentProofImage.toString())) {
    return res.status(400).json({ error: 'Invalid payment proof image' });
  }
  if (paymentProofVideo && !isVideoPayload(paymentProofVideo.toString())) {
    return res.status(400).json({ error: 'Invalid payment proof video' });
  }

  const amount = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = nowIso();
  const reference = `IMK-${id.replace('PAY-', '')}`;
  const method = (paymentMethod || 'paystack').toString();
  const hasProof = Boolean(paymentProofImage || paymentProofVideo);
  const storedItems = buildStoredPaymentItems({
    orderItems: normalizedItems,
    ...(paymentProofImage ? { proofImage: paymentProofImage.toString() } : {}),
    ...(paymentProofVideo ? { proofVideo: paymentProofVideo.toString() } : {}),
    ...(hasProof ? { proofSubmittedAt: createdAt } : {}),
  });

  const provisionalOrder = {
    id: `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    customerName,
    customerEmail,
    customerPhone,
    items: normalizedItems,
    total: Math.round(amount * 100) / 100,
    status: 'pending',
    paymentMethod: method,
    paymentStatus: 'initialized',
    paymentReference: reference,
    createdAt,
    shippingAddress,
    cargoType: cargoType || undefined,
    trackingNumber: createTrackingNumber(),
    trackingCarrier: 'IMK Logistics',
    trackingUrl: undefined,
    currentLocation: resolveStatusLocation('pending', shippingAddress),
    estimatedDelivery: resolveEstimatedDeliveryIso(cargoType, createdAt),
    shippedAt: undefined,
    deliveredAt: undefined,
    lastTrackingUpdate: createdAt,
    trackingEvents: [],
  };
  addTrackingEvent(provisionalOrder, {
    status: 'pending',
    location: provisionalOrder.currentLocation,
    source: 'system',
    eventAt: createdAt,
  });
  orders.unshift(provisionalOrder);

  const record = {
    id,
    status: 'pending',
    amount: Math.round(amount * 100) / 100,
    currency: PAYMENT_CURRENCY,
    reference,
    paymentMethod: method,
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    cargoType: cargoType || undefined,
    items: storedItems,
    orderId: provisionalOrder.id,
    createdAt,
    updatedAt: createdAt,
  };
  payments.unshift(record);

  const instructions =
    method === 'paystack'
      ? ['Complete payment in the secure card window.', 'After confirmation, your order will be approved for processing.']
      : [
        `Send payment to ${process.env.SUPPORT_PHONE || '+232-76-123-456'} (${process.env.BRAND_NAME || 'IMK-MARKET'}).`,
        `Use reference: ${reference}.`,
        'Upload your payment proof for admin approval.',
      ];

  res.status(201).json({
    id: record.id,
    status: record.status,
    amount: record.amount,
    currency: record.currency,
    reference: record.reference,
    paymentMethod: record.paymentMethod,
    instructions,
    requiresRedirect: record.paymentMethod === 'paystack',
    paymentUrl: record.paymentMethod === 'paystack' ? 'https://example.com/pay' : null,
    orderId: record.orderId,
    orderTrackingId: resolveOrderTrackingId(provisionalOrder),
    updatedAt: record.updatedAt,
    proofUploaded: hasProof,
  });
});

app.get('/api/payments/:id', (req, res) => {
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Not found' });
  const order = payment.orderId ? orders.find((item) => item.id === payment.orderId) : null;
  const paymentItems = parseStoredPaymentItems(payment.items);

  res.json({
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    paymentMethod: payment.paymentMethod,
    orderId: payment.orderId,
    orderTrackingId: order ? resolveOrderTrackingId(order) : payment.orderId || null,
    trackingNumber: order?.trackingNumber || null,
    providerReference: payment.providerReference || null,
    updatedAt: payment.updatedAt,
    items: payment.items || null,
    proofUploaded: Boolean(paymentItems.proofImage || paymentItems.proofVideo),
    paymentProofImage: paymentItems.proofImage || null,
    paymentProofVideo: paymentItems.proofVideo || null,
    paymentProofSubmittedAt: paymentItems.proofSubmittedAt || null,
    paymentProofApprovedAt: paymentItems.proofApprovedAt || null,
    orderStatus: order?.status || null,
    orderPaymentStatus: order?.paymentStatus || null,
    approvedToProceed: order ? canProceedWithOrder(order) : false,
  });
});

app.patch('/api/payments/:id/proof', (req, res) => {
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Not found' });

  const proofImage = typeof req.body?.proofImage === 'string' ? req.body.proofImage : undefined;
  const proofVideo = typeof req.body?.proofVideo === 'string' ? req.body.proofVideo : undefined;
  if (!proofImage && !proofVideo) {
    return res.status(400).json({ error: 'At least one proof file is required' });
  }
  if (proofImage && !isImagePayload(proofImage)) {
    return res.status(400).json({ error: 'Invalid proof image' });
  }
  if (proofVideo && !isVideoPayload(proofVideo)) {
    return res.status(400).json({ error: 'Invalid proof video' });
  }

  const parsedItems = parseStoredPaymentItems(payment.items);
  const submittedAt = nowIso();
  payment.items = buildStoredPaymentItems({
    orderItems: parsedItems.orderItems,
    proofImage: proofImage || parsedItems.proofImage,
    proofVideo: proofVideo || parsedItems.proofVideo,
    proofSubmittedAt: submittedAt,
  });
  payment.updatedAt = submittedAt;
  if (payment.status === 'failed') {
    payment.status = 'pending';
  }

  const order = payment.orderId ? orders.find((item) => item.id === payment.orderId) : null;
  if (order) {
    order.paymentStatus = 'initialized';
    order.status = 'pending';
    order.currentLocation = resolveStatusLocation('pending', order.shippingAddress, order.currentLocation);
    order.lastTrackingUpdate = submittedAt;
  }

  return res.json({
    id: payment.id,
    status: payment.status,
    proofUploaded: true,
    paymentProofSubmittedAt: submittedAt,
    orderId: payment.orderId,
    orderTrackingId: order ? resolveOrderTrackingId(order) : payment.orderId || null,
  });
});

app.get('/api/reviews/:productId', (req, res) => {
  const reviews = [
    { id: 1, author: 'John Doe', rating: 5, comment: 'Excellent product! Highly recommended.', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 2, author: 'Jane Smith', rating: 4, comment: 'Good quality, fast delivery.', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 3, author: 'Bob Wilson', rating: 5, comment: 'Worth every penny. Great value.', date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
  ];
  res.json(reviews);
});

app.get('/api/trending', (req, res) => {
  const trending = products.filter(p => p.badge === 'Bestseller' || p.rating > 4.5).slice(0, 20);
  res.json(trending.map((product) => toPublicProduct(product, req)));
});

app.get('/api/featured', (req, res) => {
  const featured = products.filter(p => p.badge === 'New' || p.badge === 'Top Rated').slice(0, 12);
  res.json(featured.map((product) => toPublicProduct(product, req)));
});

// ------------------------
// Authentication (unified paths)
// ------------------------
app.post('/api/auth/customer/register', (req, res) => {
  const payload = req.body || {};
  const name = normalizeText(payload.name);
  const email = normalizeText(payload.email);
  const phone = normalizeCustomerPhone(payload.phone);
  const password = (payload.password || '').toString();

  const fieldErrors = {};
  if (name.length < 2) fieldErrors.name = ['Name is required'];
  if (phone.replace(/[^\d]/g, '').length < 7) fieldErrors.phone = ['Valid phone number is required'];
  if (password.length < 6) fieldErrors.password = ['Password must be at least 6 characters'];
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = ['Invalid email address'];
  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({ error: 'Invalid payload', details: { fieldErrors } });
  }

  const exists = customerAccounts.find((account) => account.phone === phone);
  if (exists) {
    return res.status(409).json({ error: 'Phone number is already registered' });
  }

  const account = {
    id: createId('CUST', 4),
    name,
    email: email || `${phone.replace(/[^\d]/g, '')}@customer.local`,
    phone,
    passwordHash: hashPassword(password),
    role: 'user',
    createdAt: nowIso(),
  };
  customerAccounts.unshift(account);
  const user = {
    userId: account.id,
    name: account.name,
    phone: account.phone,
    email: account.email,
    roles: ['Customer'],
    permissions: [],
    isSuperAdmin: false
  };
  const session = issueMockSession(user);
  setAuthCookies(res, session.refreshToken, session.csrfToken);
  return res.status(201).json({
    token: `customer-${account.id}`,
    user,
    csrfToken: session.csrfToken
  });
});

app.post('/api/auth/customer/login', (req, res) => {
  const payload = req.body || {};
  const phone = normalizeCustomerPhone(payload.phone);
  const password = (payload.password || '').toString();

  if (phone.replace(/[^\d]/g, '').length < 7 || password.length < 1) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const account = customerAccounts.find((entry) => entry.phone === phone);
  if (!account || account.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const user = {
    userId: account.id,
    name: account.name,
    phone: account.phone,
    email: account.email,
    roles: ['Customer'],
    permissions: [],
    isSuperAdmin: false
  };
  const session = issueMockSession(user);
  setAuthCookies(res, session.refreshToken, session.csrfToken);
  return res.json({
    token: `customer-${account.id}`,
    user,
    csrfToken: session.csrfToken
  });
});

app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const emailOk = email.toString().toLowerCase() === MOCK_ADMIN_EMAIL.toLowerCase();
  const passwordOk = password === MOCK_ADMIN_PASSWORD || password === 'admin123' || password === 'Manager123!@#';
  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const user = {
    userId: 'admin-1',
    email: email,
    name: 'Store Manager',
    roles: ['Manager'],
    permissions: [{ resource: 'orders', action: 'read' }, { resource: 'products', action: 'manage' }],
    isSuperAdmin: false
  };
  const session = issueMockSession(user);
  setAuthCookies(res, session.refreshToken, session.csrfToken);
  return res.json({
    token: 'mock-admin-token',
    user,
    csrfToken: session.csrfToken
  });
});

app.post('/api/auth/super-admin/login', (req, res) => {
  const { email, password } = req.body || {};
  const SUPER_ADMIN_EMAIL = 'admin@primmesisc.com';
  const SUPER_ADMIN_PASS = 'SuperSecure123!@#';

  console.log(`[AUTH] Super Admin login attempt: ${email}`);

  const emailMatches = email && email.toString().trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  const passwordMatches = password && password.toString().trim() === SUPER_ADMIN_PASS;

  if (emailMatches && passwordMatches) {
    console.log(`[AUTH] Super Admin login SUCCESS: ${email}`);
    const user = {
      userId: 'super-admin-1',
      email: SUPER_ADMIN_EMAIL,
      name: 'Super System Admin',
      roles: ['Super Admin'],
      permissions: [],
      isSuperAdmin: true
    };
    const session = issueMockSession(user);
    setAuthCookies(res, session.refreshToken, session.csrfToken);
    return res.json({
      token: 'mock-super-admin-token',
      user,
      csrfToken: session.csrfToken
    });
  }
  console.log(`[AUTH] Super Admin login FAILED: ${email}`);
  return res.status(401).json({ error: 'Invalid credentials' });
});


app.post('/api/auth/seller/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === 'seller@example.com' && (password === 'Seller123!@#' || password === 'seller123')) {
    const user = {
      userId: 'seller-1',
      email: 'seller@example.com',
      name: 'Demo Seller',
      roles: ['Seller'],
      permissions: [{ resource: 'products', action: 'own' }],
      isSuperAdmin: false,
      sellerProfile: {
        id: 'sp-1',
        businessName: 'Demo Store',
        status: 'active'
      }
    };
    const session = issueMockSession(user);
    setAuthCookies(res, session.refreshToken, session.csrfToken);
    return res.json({
      token: 'mock-seller-token',
      user,
      csrfToken: session.csrfToken
    });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/seller/google', (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'Invalid Google credential' });
  }
  const user = {
    userId: 'seller-google-1',
    email: 'seller@example.com',
    name: 'Google Seller',
    roles: ['Seller'],
    permissions: [{ resource: 'products', action: 'own' }],
    isSuperAdmin: false,
    sellerProfile: {
      id: 'sp-google-1',
      businessName: 'Google Demo Store',
      status: 'active'
    }
  };
  const session = issueMockSession(user);
  setAuthCookies(res, session.refreshToken, session.csrfToken);
  return res.json({
    token: 'mock-seller-google-token',
    user,
    csrfToken: session.csrfToken
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const csrfHeader = (req.headers['x-csrf-token'] || '').toString();
  if (!cookies.csrf_token || csrfHeader !== cookies.csrf_token) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  const session = mockSessions.get(cookies.refresh_token);
  if (!session) {
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  mockSessions.delete(cookies.refresh_token);
  const nextSession = issueMockSession(session.user);
  setAuthCookies(res, nextSession.refreshToken, nextSession.csrfToken);
  return res.json({
    token: 'mock-access-token',
    user: session.user,
    csrfToken: nextSession.csrfToken
  });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const csrfHeader = (req.headers['x-csrf-token'] || '').toString();
  if (!cookies.csrf_token || csrfHeader !== cookies.csrf_token) {
    return res.status(403).json({ error: 'CSRF token invalid' });
  }
  if (cookies.refresh_token) {
    mockSessions.delete(cookies.refresh_token);
  }
  clearAuthCookies(res);
  return res.json({ success: true });
});

app.post('/api/auth/password/reset', (req, res) => {
  const payload = req.body || {};
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return res.status(400).json({ error: 'Invalid password' });
  }
  const cookies = parseCookies(req.headers.cookie || '');
  const session = mockSessions.get(cookies.refresh_token);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const nextSession = issueMockSession({ ...session.user, mustResetPassword: false });
  setAuthCookies(res, nextSession.refreshToken, nextSession.csrfToken);
  return res.json({
    token: 'mock-access-token',
    user: { ...session.user, mustResetPassword: false },
    csrfToken: nextSession.csrfToken
  });
});
// ------------------------
// Admin / Super Admin Middleware
// ------------------------
const requireAdmin = (req, res, next) => {
  const auth = (req.headers.authorization || '').toString();
  if (!auth.startsWith('Bearer ') || auth.slice(7).trim().length === 0) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

const superAdminModules = [
  'Client Management',
  'Product Management',
  'Order Management',
  'Marketing Tools',
  'Analytics Dashboard',
  'Seller Management',
  'User Management',
  'Reports',
  'Settings',
  'Notifications',
];

const mockPermissions = [
  { id: 'perm-1', resource: 'dashboard', action: 'view', description: 'View dashboard' },
  { id: 'perm-2', resource: 'products', action: 'manage', description: 'Manage products' },
  { id: 'perm-3', resource: 'orders', action: 'manage', description: 'Manage orders' },
  { id: 'perm-4', resource: 'users', action: 'manage', description: 'Manage users' },
  { id: 'perm-5', resource: 'settings', action: 'manage', description: 'Manage settings' },
];

const mockRoles = [
  {
    id: 'role-super',
    name: 'Super Admin',
    description: 'Full access',
    tenantId: null,
    isSystemRole: true,
    rolePermissions: mockPermissions.map((permission) => ({ permission })),
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description: 'Tenant management',
    tenantId: null,
    isSystemRole: true,
    rolePermissions: mockPermissions
      .filter((permission) => permission.resource !== 'settings')
      .map((permission) => ({ permission })),
  },
  {
    id: 'role-seller',
    name: 'Seller',
    description: 'Seller access',
    tenantId: null,
    isSystemRole: true,
    rolePermissions: [{ permission: mockPermissions[1] }],
  },
];

const mockTenants = [
  {
    id: 'tenant-1',
    name: 'IMK-Market',
    subscriptionType: 'E-commerce Business',
    subscriptionStatus: 'active',
    modulesEnabled: superAdminModules,
    createdAt: nowIso(),
  },
];

const mockUsers = [
  {
    id: 'user-super',
    email: 'admin@primmesisc.com',
    name: 'Super Admin',
    tenantId: null,
    tenant: null,
    isSuperAdmin: true,
    disabled: false,
    createdAt: nowIso(),
    sellerProfile: null,
    userRoles: [{ role: mockRoles[0] }],
  },
];

const mockSubscriptions = [
  {
    id: 'sub-1',
    tenantId: mockTenants[0].id,
    planName: mockTenants[0].subscriptionType,
    status: 'active',
    billingCycle: 'monthly',
    price: 0,
    currency: 'USD',
    endsAt: null,
    tenant: mockTenants[0],
  },
];

const mockSettings = [
  { id: 'setting-1', key: 'support_email', value: 'info@imkmarket.com', updatedAt: nowIso() },
];

const defaultFlashDeals = {
  title: 'Flash Deals',
  subtitle: 'Limited time offers - up to 30% off.',
  endsAt: null,
  productIds: [],
  cards: [],
};

const defaultFlashAds = {
  ads: [],
};

const normalizeFlashDealCards = (cards) => {
  if (!Array.isArray(cards)) return [];
  return cards
    .map((entry) => {
      const safe = entry && typeof entry === 'object' ? entry : {};
      const mediaUrl = typeof safe.mediaUrl === 'string' ? safe.mediaUrl.trim() : '';
      if (!mediaUrl) return null;
      return {
        id: typeof safe.id === 'string' && safe.id.trim().length ? safe.id.trim() : `promo-${createId('CARD', 3)}`,
        title: typeof safe.title === 'string' && safe.title.trim().length ? safe.title.trim() : 'Flash Deal',
        subtitle: typeof safe.subtitle === 'string' ? safe.subtitle.trim() : '',
        badge: typeof safe.badge === 'string' ? safe.badge.trim() : '',
        price: typeof safe.price === 'string' ? safe.price.trim() : '',
        cta: typeof safe.cta === 'string' ? safe.cta.trim() : '',
        mediaType: safe.mediaType === 'video' ? 'video' : 'image',
        mediaUrl,
        animation: ['none', 'pulse', 'float', 'zoom'].includes(safe.animation) ? safe.animation : 'none',
      };
    })
    .filter(Boolean)
    .slice(0, 12);
};

const normalizeFlashDeals = (value) => {
  const safe = value && typeof value === 'object' ? value : {};
  const title = typeof safe.title === 'string' && safe.title.trim().length ? safe.title.trim() : defaultFlashDeals.title;
  const subtitle =
    typeof safe.subtitle === 'string' && safe.subtitle.trim().length ? safe.subtitle.trim() : defaultFlashDeals.subtitle;
  const endsAt =
    typeof safe.endsAt === 'string' && !Number.isNaN(new Date(safe.endsAt).getTime())
      ? new Date(safe.endsAt).toISOString()
      : null;
  const productIds = Array.from(
    new Set(Array.isArray(safe.productIds) ? safe.productIds.map((id) => String(id).trim()).filter(Boolean) : [])
  );
  const cards = normalizeFlashDealCards(safe.cards);
  return { title, subtitle, endsAt, productIds, cards };
};

const normalizeFlashAds = (value) => {
  const safe = value && typeof value === 'object' ? value : {};
  const rawAds = Array.isArray(safe.ads) ? safe.ads : [];
  const ads = rawAds
    .map((entry) => {
      const ad = entry && typeof entry === 'object' ? entry : {};
      const mediaUrl = typeof ad.mediaUrl === 'string' ? ad.mediaUrl.trim() : '';
      if (!mediaUrl) return null;
      return {
        id: typeof ad.id === 'string' && ad.id.trim().length ? ad.id.trim() : `ad-${createId('AD', 3)}`,
        slot: ad.slot === 'right' ? 'right' : 'left',
        title: typeof ad.title === 'string' ? ad.title.trim() : '',
        subtitle: typeof ad.subtitle === 'string' ? ad.subtitle.trim() : '',
        text: typeof ad.text === 'string' ? ad.text.trim() : '',
        badge: typeof ad.badge === 'string' ? ad.badge.trim() : '',
        cta: typeof ad.cta === 'string' ? ad.cta.trim() : '',
        mediaType: ad.mediaType === 'video' ? 'video' : 'image',
        mediaUrl,
        animation: ['none', 'pulse', 'float', 'zoom'].includes(ad.animation) ? ad.animation : 'none',
      };
    })
    .filter(Boolean)
    .slice(0, 6);
  return { ads };
};

const getFlashDealsSetting = () => {
  const existing = mockSettings.find((setting) => setting.key === 'flash_deals');
  return normalizeFlashDeals(existing ? existing.value : defaultFlashDeals);
};

const setFlashDealsSetting = (payload) => {
  const value = normalizeFlashDeals(payload);
  const existing = mockSettings.find((setting) => setting.key === 'flash_deals');
  if (existing) {
    existing.value = value;
    existing.updatedAt = nowIso();
    return value;
  }
  mockSettings.unshift({ id: createId('SET', 3), key: 'flash_deals', value, updatedAt: nowIso() });
  return value;
};

const getFlashAdsSetting = () => {
  const existing = mockSettings.find((setting) => setting.key === 'flash_ads');
  return normalizeFlashAds(existing ? existing.value : defaultFlashAds);
};

const setFlashAdsSetting = (payload) => {
  const value = normalizeFlashAds(payload);
  const existing = mockSettings.find((setting) => setting.key === 'flash_ads');
  if (existing) {
    existing.value = value;
    existing.updatedAt = nowIso();
    return value;
  }
  mockSettings.unshift({ id: createId('SET', 3), key: 'flash_ads', value, updatedAt: nowIso() });
  return value;
};

const getCategoryMediaSetting = () => {
  const existing = mockSettings.find((setting) => setting.key === 'category_media');
  const value = existing && typeof existing.value === 'object' && !Array.isArray(existing.value) ? existing.value : {};
  return value;
};

const setCategoryMediaSetting = (value) => {
  const existing = mockSettings.find((setting) => setting.key === 'category_media');
  if (existing) {
    existing.value = value;
    existing.updatedAt = nowIso();
    return value;
  }
  mockSettings.unshift({ id: createId('SET', 3), key: 'category_media', value, updatedAt: nowIso() });
  return value;
};

const updateCategoryMedia = (categoryId, payload) => {
  const current = getCategoryMediaSetting();
  const existing = current[categoryId] || {};
  const next = { ...current };
  if (payload.video === null || payload.video === undefined || `${payload.video}`.trim().length === 0) {
    const { video: _removed, ...rest } = existing;
    if (Object.keys(rest).length === 0) {
      delete next[categoryId];
    } else {
      next[categoryId] = rest;
    }
  } else {
    next[categoryId] = { ...existing, video: payload.video };
  }
  return setCategoryMediaSetting(next);
};

const mockFeatureToggles = [
  { id: 'toggle-1', key: 'seller_approvals', enabled: true, description: 'Require seller approvals', updatedAt: nowIso() },
];

const mockAuditLogs = [];

app.get('/api/super-admin/dashboard', requireAdmin, (req, res) => {
  res.json({
    totalTenants: 1,
    activeTenants: 1,
    totalUsers: customerAccounts.length + 5,
    totalSellers: 3,
    pendingSellers: pendingProducts.length,
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
  });
});

app.get('/api/super-admin/sellers/pending', requireAdmin, (req, res) => {
  res.json(pendingProducts.filter(p => p.status === 'pending').map(p => ({
    id: p.id,
    businessName: p.sellerName,
    businessEmail: p.sellerEmail,
    status: 'pending',
    createdAt: p.submittedAt,
    user: {
      name: p.sellerName,
      email: p.sellerEmail
    }
  })));
});

const attachTenantCounts = (tenant) => ({
  ...tenant,
  _count: {
    users: mockUsers.filter((user) => user.tenantId === tenant.id).length,
    products: products.length,
    orders: orders.length,
  },
});

app.get('/api/super-admin/tenants', requireAdmin, (_req, res) => {
  res.json(mockTenants.map(attachTenantCounts));
});

app.post('/api/super-admin/tenants', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const tenant = {
    id: createId('TEN', 3),
    name: payload.name || 'New Tenant',
    subscriptionType: payload.subscriptionType || 'E-commerce Business',
    subscriptionStatus: 'active',
    modulesEnabled: Array.isArray(payload.modulesEnabled) ? payload.modulesEnabled : [],
    createdAt: nowIso(),
  };
  mockTenants.unshift(tenant);
  mockSubscriptions.unshift({
    id: createId('SUB', 3),
    tenantId: tenant.id,
    planName: tenant.subscriptionType,
    status: 'active',
    billingCycle: 'monthly',
    price: 0,
    currency: 'USD',
    endsAt: null,
    tenant,
  });
  res.status(201).json(tenant);
});

app.patch('/api/super-admin/tenants/:id', requireAdmin, (req, res) => {
  const tenant = mockTenants.find((item) => item.id === req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  const payload = req.body || {};
  if (payload.name) tenant.name = payload.name;
  if (payload.subscriptionType) tenant.subscriptionType = payload.subscriptionType;
  if (payload.subscriptionStatus) tenant.subscriptionStatus = payload.subscriptionStatus;
  if (Array.isArray(payload.modulesEnabled)) tenant.modulesEnabled = payload.modulesEnabled;
  const subscription = mockSubscriptions.find((item) => item.tenantId === tenant.id);
  if (subscription) {
    if (payload.subscriptionType) subscription.planName = payload.subscriptionType;
    if (payload.subscriptionStatus) subscription.status = payload.subscriptionStatus;
  }
  res.json(tenant);
});

app.get('/api/super-admin/permissions', requireAdmin, (_req, res) => {
  res.json(mockPermissions);
});

app.get('/api/super-admin/roles', requireAdmin, (_req, res) => {
  const roles = mockRoles.map((role) => ({
    ...role,
    _count: {
      userRoles: mockUsers.filter((user) => user.userRoles.some((entry) => entry.role.id === role.id)).length,
    },
  }));
  res.json(roles);
});

app.post('/api/super-admin/roles', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const permissionIds = Array.isArray(payload.permissionIds) ? payload.permissionIds : [];
  const rolePermissions = mockPermissions
    .filter((permission) => permissionIds.includes(permission.id))
    .map((permission) => ({ permission }));
  const role = {
    id: createId('ROLE', 3),
    name: payload.name || 'Custom Role',
    description: payload.description || null,
    tenantId: payload.tenantId || null,
    isSystemRole: false,
    rolePermissions,
  };
  mockRoles.unshift(role);
  res.status(201).json(role);
});

app.patch('/api/super-admin/roles/:id', requireAdmin, (req, res) => {
  const role = mockRoles.find((item) => item.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  const payload = req.body || {};
  if (payload.name) role.name = payload.name;
  if (payload.description !== undefined) role.description = payload.description;
  if (Array.isArray(payload.permissionIds)) {
    role.rolePermissions = mockPermissions
      .filter((permission) => payload.permissionIds.includes(permission.id))
      .map((permission) => ({ permission }));
  }
  res.json(role);
});

app.delete('/api/super-admin/roles/:id', requireAdmin, (req, res) => {
  const index = mockRoles.findIndex((role) => role.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Role not found' });
  const role = mockRoles[index];
  if (role.isSystemRole) return res.status(403).json({ error: 'Cannot delete system role' });
  mockRoles.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/super-admin/users', requireAdmin, (_req, res) => {
  res.json(mockUsers);
});

app.post('/api/super-admin/users', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const roleIds = Array.isArray(payload.roleIds) ? payload.roleIds : [];
  const userRoles = mockRoles
    .filter((role) => roleIds.includes(role.id))
    .map((role) => ({ role }));
  const user = {
    id: createId('USR', 3),
    email: payload.email || `user-${Date.now()}@example.com`,
    name: payload.name || null,
    username: payload.username || null,
    phone: payload.phone || null,
    tenantId: payload.tenantId || null,
    tenant: mockTenants.find((tenant) => tenant.id === payload.tenantId) || null,
    isSuperAdmin: false,
    disabled: false,
    createdAt: nowIso(),
    sellerProfile: null,
    userRoles,
  };
  mockUsers.unshift(user);
  res.status(201).json(user);
});

app.patch('/api/super-admin/users/:id/roles', requireAdmin, (req, res) => {
  const user = mockUsers.find((item) => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const roleIds = Array.isArray(req.body?.roleIds) ? req.body.roleIds : [];
  user.userRoles = mockRoles.filter((role) => roleIds.includes(role.id)).map((role) => ({ role }));
  res.json({ success: true });
});

app.delete('/api/super-admin/users/:id', requireAdmin, (req, res) => {
  const index = mockUsers.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'User not found' });
  const user = mockUsers[index];
  if (user.isSuperAdmin) return res.status(403).json({ error: 'Cannot delete super admin' });
  mockUsers.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/super-admin/subscriptions', requireAdmin, (_req, res) => {
  res.json(mockSubscriptions);
});

app.post('/api/super-admin/subscriptions', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const tenant = mockTenants.find((item) => item.id === payload.tenantId) || null;
  const subscription = {
    id: createId('SUB', 3),
    tenantId: payload.tenantId,
    planName: payload.planName || 'Custom Plan',
    status: payload.status || 'active',
    billingCycle: payload.billingCycle || 'monthly',
    price: payload.price || 0,
    currency: payload.currency || 'USD',
    endsAt: payload.endsAt || null,
    tenant,
  };
  mockSubscriptions.unshift(subscription);
  res.status(201).json(subscription);
});

app.patch('/api/super-admin/subscriptions/:id', requireAdmin, (req, res) => {
  const subscription = mockSubscriptions.find((item) => item.id === req.params.id);
  if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  const payload = req.body || {};
  if (payload.planName) subscription.planName = payload.planName;
  if (payload.status) subscription.status = payload.status;
  if (payload.billingCycle) subscription.billingCycle = payload.billingCycle;
  if (payload.price !== undefined) subscription.price = payload.price;
  if (payload.currency) subscription.currency = payload.currency;
  if (payload.endsAt !== undefined) subscription.endsAt = payload.endsAt;
  res.json(subscription);
});

app.get('/api/super-admin/system/settings', requireAdmin, (_req, res) => {
  res.json(mockSettings);
});

app.put('/api/super-admin/system/settings/:key', requireAdmin, (req, res) => {
  const key = req.params.key;
  const existing = mockSettings.find((setting) => setting.key === key);
  if (existing) {
    existing.value = req.body?.value;
    existing.updatedAt = nowIso();
    return res.json(existing);
  }
  const setting = { id: createId('SET', 3), key, value: req.body?.value, updatedAt: nowIso() };
  mockSettings.unshift(setting);
  return res.json(setting);
});

app.get('/api/super-admin/feature-toggles', requireAdmin, (_req, res) => {
  res.json(mockFeatureToggles);
});

app.patch('/api/super-admin/feature-toggles/:key', requireAdmin, (req, res) => {
  const key = req.params.key;
  const existing = mockFeatureToggles.find((toggle) => toggle.key === key);
  if (existing) {
    if (typeof req.body?.enabled === 'boolean') existing.enabled = req.body.enabled;
    if (req.body?.description !== undefined) existing.description = req.body.description;
    existing.updatedAt = nowIso();
    return res.json(existing);
  }
  const toggle = {
    id: createId('TGL', 3),
    key,
    enabled: Boolean(req.body?.enabled),
    description: req.body?.description || null,
    updatedAt: nowIso(),
  };
  mockFeatureToggles.unshift(toggle);
  return res.json(toggle);
});

app.get('/api/super-admin/audit-logs', requireAdmin, (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 50);
  const total = mockAuditLogs.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.json({
    logs: mockAuditLogs.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages },
  });
});

app.get('/api/admin/analytics', requireAdmin, (_req, res) => {

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const uniqueEmails = new Set(orders.map((o) => o.customerEmail).filter(Boolean));
  const totalCustomers = uniqueEmails.size;

  const statusList = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const ordersByStatus = statusList.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const revenueByMonth = Array.from({ length: 6 }).map((_, idx) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - idx));
    const month = date.toLocaleString('en-US', { month: 'short' });
    const revenue = orders
      .filter((order) => {
        const created = new Date(order.createdAt);
        return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
      })
      .reduce((sum, order) => sum + (order.total || 0), 0);
    return { month, revenue: Math.round(revenue * 100) / 100 };
  });

  const salesByProduct = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const key = item.productName || 'Unknown';
      salesByProduct.set(key, (salesByProduct.get(key) || 0) + (item.quantity || 0));
    }
  }
  const topProducts = Array.from(salesByProduct.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sales]) => ({ name, sales }));

  const revenueByCategory = new Map();
  for (const order of orders) {
    for (const item of order.items || []) {
      const prod = products.find((p) => p.name === item.productName);
      const categoryName = prod ? getCategoryName(prod.categoryId) : 'Uncategorized';
      const revenue = (item.price || 0) * (item.quantity || 0);
      revenueByCategory.set(categoryName, (revenueByCategory.get(categoryName) || 0) + revenue);
    }
  }
  const topCategories = Array.from(revenueByCategory.entries())
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  res.json({
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders,
    totalProducts,
    totalCustomers,
    revenueByMonth,
    ordersByStatus,
    topProducts: topProducts.length ? topProducts : products.slice(0, 5).map((p, idx) => ({ name: p.name, sales: 10 + idx * 5 })),
    topCategories,
  });
});

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  const sorted = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((order) => ensureTrackingState(order));
  const paymentByOrderId = new Map();
  for (const payment of payments.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    if (!payment.orderId || paymentByOrderId.has(payment.orderId)) continue;
    paymentByOrderId.set(payment.orderId, payment);
  }
  const payload = sorted.map((order) => {
    const payment = paymentByOrderId.get(order.id);
    const paymentItems = payment ? parseStoredPaymentItems(payment.items) : { orderItems: [] };
    return {
      ...order,
      orderTrackingId: resolveOrderTrackingId(order),
      paymentId: payment?.id || null,
      paymentProofImage: paymentItems.proofImage || null,
      paymentProofVideo: paymentItems.proofVideo || null,
      paymentProofSubmittedAt: paymentItems.proofSubmittedAt || null,
      paymentProofApprovedAt: paymentItems.proofApprovedAt || null,
    };
  });
  res.json(payload);
});

app.post('/api/admin/orders/:id/approve-payment', requireAdmin, (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  if (order.paymentMethod === 'cod') {
    return res.status(400).json({ error: 'COD orders do not require payment approval' });
  }

  const payment = payments
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .find((item) => item.orderId === order.id);
  if (!payment) {
    return res.status(404).json({ error: 'Linked payment record not found' });
  }

  const paymentItems = parseStoredPaymentItems(payment.items);
  if (requiresManualProofApproval(order.paymentMethod) && !paymentItems.proofImage && !paymentItems.proofVideo) {
    return res.status(400).json({ error: 'Payment proof image or video is required before approval' });
  }

  const approvedAt = nowIso();
  payment.status = 'paid';
  payment.updatedAt = approvedAt;
  payment.items = buildStoredPaymentItems({
    orderItems: paymentItems.orderItems,
    ...(paymentItems.proofImage ? { proofImage: paymentItems.proofImage } : {}),
    ...(paymentItems.proofVideo ? { proofVideo: paymentItems.proofVideo } : {}),
    ...(paymentItems.proofSubmittedAt ? { proofSubmittedAt: paymentItems.proofSubmittedAt } : {}),
    ...(paymentItems.proofImage || paymentItems.proofVideo ? { proofApprovedAt: approvedAt } : {}),
  });

  markOrderPaymentApproved(order, 'admin', 'Payment approved by admin. Your order is now moving to processing.');

  return res.json({
    success: true,
    id: order.id,
    orderTrackingId: resolveOrderTrackingId(order),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentId: payment.id,
    paymentProofApprovedAt: paymentItems.proofImage || paymentItems.proofVideo ? approvedAt : null,
  });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const {
    status,
    location,
    note,
    trackingNumber,
    trackingCarrier,
    trackingUrl,
    estimatedDelivery,
  } = req.body || {};
  const allowed = ORDER_STATUSES;
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });

  ensureTrackingState(order);
  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber.toString().trim().toUpperCase();
  if (trackingCarrier) order.trackingCarrier = trackingCarrier.toString().trim();
  if (trackingUrl) order.trackingUrl = trackingUrl.toString().trim();
  if (estimatedDelivery) {
    const parsedDate = new Date(estimatedDelivery);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid estimatedDelivery date' });
    }
    order.estimatedDelivery = parsedDate.toISOString();
  }
  order.currentLocation = resolveStatusLocation(status, order.shippingAddress, location || order.currentLocation);
  order.lastTrackingUpdate = nowIso();
  if (status === 'shipped') {
    if (!order.shippedAt) order.shippedAt = nowIso();
    if (!order.trackingNumber) order.trackingNumber = createTrackingNumber();
    if (!order.trackingCarrier) order.trackingCarrier = 'IMK Logistics';
    if (!order.estimatedDelivery) order.estimatedDelivery = resolveEstimatedDeliveryIso(order.cargoType);
  }
  if (status === 'delivered') {
    order.deliveredAt = nowIso();
    order.currentLocation = order.shippingAddress;
  }
  addTrackingEvent(order, {
    status,
    location: order.currentLocation,
    note: normalizeText(note),
    source: 'admin',
  });

  res.json({
    id: order.id,
    status: order.status,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    currentLocation: order.currentLocation,
    estimatedDelivery: order.estimatedDelivery,
    lastTrackingUpdate: order.lastTrackingUpdate,
  });
});

app.patch('/api/admin/orders/:id/tracking', requireAdmin, (req, res) => {
  const {
    trackingNumber,
    trackingCarrier,
    trackingUrl,
    currentLocation,
    estimatedDelivery,
    note,
  } = req.body || {};
  const hasPayload = [
    trackingNumber,
    trackingCarrier,
    trackingUrl,
    currentLocation,
    estimatedDelivery,
    note,
  ].some((value) => value !== undefined && value !== null && `${value}`.trim() !== '');

  if (!hasPayload) {
    return res.status(400).json({ error: 'No tracking fields provided' });
  }

  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  ensureTrackingState(order);

  if (trackingNumber) order.trackingNumber = trackingNumber.toString().trim().toUpperCase();
  if (trackingCarrier) order.trackingCarrier = trackingCarrier.toString().trim();
  if (trackingUrl) order.trackingUrl = trackingUrl.toString().trim();
  if (currentLocation) order.currentLocation = currentLocation.toString().trim();
  if (estimatedDelivery) {
    const parsedDate = new Date(estimatedDelivery);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid estimatedDelivery date' });
    }
    order.estimatedDelivery = parsedDate.toISOString();
  }
  order.lastTrackingUpdate = nowIso();
  addTrackingEvent(order, {
    status: ORDER_STATUSES.includes(order.status) ? order.status : 'pending',
    title: 'Tracking Updated',
    message: normalizeText(note) || 'Tracking details were updated by support.',
    location: order.currentLocation,
    source: 'admin',
  });

  res.json({
    id: order.id,
    trackingNumber: order.trackingNumber,
    trackingCarrier: order.trackingCarrier,
    trackingUrl: order.trackingUrl || null,
    currentLocation: order.currentLocation,
    estimatedDelivery: order.estimatedDelivery || null,
    lastTrackingUpdate: order.lastTrackingUpdate,
  });
});

app.get('/api/admin/pending-products', requireAdmin, (req, res) => {
  const sorted = pendingProducts
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  res.json(sorted.map((product) => ({ ...product, image: toPublicMediaUrl(req, product.image) })));
});

app.post('/api/admin/pending-products/:id/approve', requireAdmin, (req, res) => {
  const pending = pendingProducts.find((p) => p.id === req.params.id);
  if (!pending) return res.status(404).json({ error: 'Not found' });

  if (pending.status !== 'approved') {
    const category = ensureCategory(pending.category);
    const createdAt = nowIso();
    const stock = 20;
    const product = {
      id: createId('PRD', 4),
      name: pending.name,
      description: pending.description,
      price: pending.price,
      originalPrice: undefined,
      image: pending.image,
      images: [pending.image],
      categoryId: category ? category.id : ensureUncategorized().id,
      rating: 4.5,
      reviewCount: 0,
      inStock: true,
      freeShipping: false,
      badge: 'New',
      status: 'active',
      sku: `IMK-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      stock,
      lowStockThreshold: 10,
      lastRestocked: createdAt,
      sellerName: pending.sellerName,
      sellerEmail: pending.sellerEmail,
      country: 'UAE',
      createdAt,
      updatedAt: createdAt,
    };
    products.unshift(product);
    pending.status = 'approved';

    if (pending.sellerEmail) {
      emailHistory.unshift({
        id: createId('EMAIL', 4),
        to: pending.sellerEmail,
        subject: `Welcome Seller - ${pending.sellerName || 'Seller'} - IMK-MARKET`,
        template: 'welcomeSeller',
        sentAt: nowIso(),
        status: 'Sent',
      });
    }
  }

  res.json({ id: pending.id, status: pending.status });
});

app.post('/api/admin/pending-products/:id/reject', requireAdmin, (req, res) => {
  const pending = pendingProducts.find((p) => p.id === req.params.id);
  if (!pending) return res.status(404).json({ error: 'Not found' });
  pending.status = 'rejected';
  res.json({ id: pending.id, status: pending.status });
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const sorted = products.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map((product) => toAdminProduct(product, req)));
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const payload = req.body || {};
  const name = (payload.name || '').toString().trim();
  const description = (payload.description || '').toString().trim();
  const categoryName = (payload.category || '').toString().trim();
  const price = Number(payload.price);

  const images = Array.isArray(payload.images) ? payload.images : payload.image ? [payload.image] : [];
  const normalizedImages = images
    .map((img) => (img || '').toString())
    .filter((img) => isImagePayload(img))
    .slice(0, 10);
  const videos = Array.isArray(payload.videos) ? payload.videos : [];
  const normalizedVideos = videos
    .map((video) => (video || '').toString())
    .filter((video) => isVideoPayload(video))
    .slice(0, 2);

  const fieldErrors = {};
  if (!name) fieldErrors.name = ['Name is required'];
  if (!description) fieldErrors.description = ['Description is required'];
  if (!categoryName) fieldErrors.category = ['Category is required'];
  if (!Number.isFinite(price)) fieldErrors.price = ['Price must be a number'];
  if (normalizedImages.length === 0) fieldErrors.images = ['At least one image is required'];
  if (Object.keys(fieldErrors).length) {
    return res.status(400).json({ error: 'Invalid payload', details: { fieldErrors } });
  }

  const category = ensureCategory(categoryName);
  const createdAt = nowIso();
  const stock = Number.isFinite(Number(payload.stock)) ? Math.max(0, Math.floor(Number(payload.stock))) : 0;
  const lowStockThreshold = Number.isFinite(Number(payload.lowStockThreshold))
    ? Math.max(0, Math.floor(Number(payload.lowStockThreshold)))
    : 10;

  const product = {
    id: createId('PRD', 4),
    name,
    description,
    price,
    originalPrice: payload.originalPrice === null || payload.originalPrice === undefined ? undefined : Number(payload.originalPrice),
    image: normalizedImages[0],
    images: normalizedImages,
    videos: normalizedVideos,
    categoryId: category ? category.id : ensureUncategorized().id,
    rating: Number.isFinite(Number(payload.rating)) ? Number(payload.rating) : 4.5,
    reviewCount: Number.isFinite(Number(payload.reviewCount)) ? Math.max(0, Math.floor(Number(payload.reviewCount))) : 0,
    inStock: payload.inStock === undefined ? stock > 0 : Boolean(payload.inStock),
    freeShipping: payload.freeShipping === undefined ? false : Boolean(payload.freeShipping),
    badge: payload.badge ? payload.badge : 'New',
    sku: payload.sku ? payload.sku : `IMK-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    stock,
    lowStockThreshold,
    lastRestocked: createdAt,
    sellerName: payload.sellerName || undefined,
    sellerEmail: payload.sellerEmail || undefined,
    country: payload.country || 'UAE',
    status: payload.status === 'inactive' ? 'inactive' : 'active',
    createdAt,
    updatedAt: createdAt,
  };

  products.unshift(product);
  res.status(201).json(toAdminProduct(product, req));
});

app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  const payload = req.body || {};

  if (payload.name !== undefined) product.name = payload.name.toString();
  if (payload.description !== undefined) product.description = payload.description.toString();
  if (payload.price !== undefined && Number.isFinite(Number(payload.price))) product.price = Number(payload.price);
  if (payload.originalPrice !== undefined) {
    product.originalPrice = payload.originalPrice === null ? undefined : Number(payload.originalPrice);
  }

  if (payload.category !== undefined) {
    const cat = ensureCategory(payload.category.toString());
    product.categoryId = cat ? cat.id : ensureUncategorized().id;
  }

  if (Array.isArray(payload.images)) {
    const normalized = payload.images
      .map((img) => (img || '').toString())
      .filter((img) => isImagePayload(img))
      .slice(0, 10);
    if (normalized.length > 0) {
      product.images = normalized;
      product.image = normalized[0];
    }
  } else if (payload.image !== undefined) {
    const img = (payload.image || '').toString();
    if (isImagePayload(img)) {
      const existing = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
      product.images = [img, ...existing.slice(1)];
      product.image = img;
    }
  }

  if (Array.isArray(payload.videos)) {
    const normalizedVideos = payload.videos
      .map((video) => (video || '').toString())
      .filter((video) => isVideoPayload(video))
      .slice(0, 2);
    product.videos = normalizedVideos;
  }

  if (payload.rating !== undefined && Number.isFinite(Number(payload.rating))) product.rating = Number(payload.rating);
  if (payload.reviewCount !== undefined && Number.isFinite(Number(payload.reviewCount))) product.reviewCount = Math.max(0, Math.floor(Number(payload.reviewCount)));
  if (payload.freeShipping !== undefined) product.freeShipping = Boolean(payload.freeShipping);
  if (payload.inStock !== undefined) product.inStock = Boolean(payload.inStock);
  if (payload.badge !== undefined) product.badge = payload.badge;
  if (payload.sku !== undefined) product.sku = payload.sku.toString();
  if (payload.sellerName !== undefined) product.sellerName = payload.sellerName;
  if (payload.sellerEmail !== undefined) product.sellerEmail = payload.sellerEmail;
  if (payload.country !== undefined) product.country = payload.country;
  if (payload.status !== undefined) product.status = payload.status === 'inactive' ? 'inactive' : 'active';

  if (payload.stock !== undefined && Number.isFinite(Number(payload.stock))) {
    product.stock = Math.max(0, Math.floor(Number(payload.stock)));
    product.inStock = product.stock > 0;
    product.lastRestocked = nowIso();
  }
  if (payload.lowStockThreshold !== undefined && Number.isFinite(Number(payload.lowStockThreshold))) {
    product.lowStockThreshold = Math.max(0, Math.floor(Number(payload.lowStockThreshold)));
  }

  product.updatedAt = nowIso();
  res.json(toAdminProduct(product, req));
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const before = products.length;
  products = products.filter((p) => p.id !== req.params.id);
  if (products.length === before) return res.status(404).json({ error: 'Not found' });
  res.json({ id: req.params.id });
});

app.get('/api/admin/inventory', requireAdmin, (_req, res) => {
  res.json(products.map(toInventoryItem));
});

app.patch('/api/admin/inventory/:id', requireAdmin, (req, res) => {
  const { stock } = req.body || {};
  const parsed = Number(stock);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  product.stock = Math.floor(parsed);
  product.inStock = product.stock > 0;
  product.lastRestocked = nowIso();
  product.updatedAt = nowIso();
  res.json({ id: product.id, stock: product.stock });
});

app.get('/api/admin/categories', requireAdmin, (req, res) => {
  const media = getCategoryMediaSetting();
  const sorted = categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
      image: toPublicMediaUrl(req, c.image),
      video: media[c.id] ? media[c.id].video : undefined,
    }));
  res.json(sorted);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, image, video } = req.body || {};
  if (!name || !name.toString().trim()) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const category = ensureCategory(name.toString(), image ? image.toString() : undefined);
  if (video) {
    updateCategoryMedia(category.id, { video: video.toString() });
  }
  const media = getCategoryMediaSetting();
  res.status(201).json({
    ...category,
    image: toPublicMediaUrl(req, category.image),
    video: media[category.id] ? media[category.id].video : undefined,
  });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const existing = categories.find((c) => c.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const uncategorized = ensureUncategorized();
  products.forEach((p) => {
    if (p.categoryId === existing.id) p.categoryId = uncategorized.id;
  });
  categories = categories.filter((c) => c.id !== existing.id);
  updateCategoryMedia(req.params.id, { video: null });
  res.json({ id: req.params.id });
});

app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const { name, image, video } = req.body || {};
  const existing = categories.find((c) => c.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (name && name.toString().trim()) existing.name = name.toString().trim();
  if (image !== undefined) existing.image = image ? image.toString() : existing.image;
  if (video !== undefined) updateCategoryMedia(existing.id, { video: video ? video.toString() : null });
  const media = getCategoryMediaSetting();
  res.json({
    id: existing.id,
    name: existing.name,
    image: toPublicMediaUrl(req, existing.image),
    video: media[existing.id] ? media[existing.id].video : undefined,
  });
});

app.get('/api/admin/flash-deals', requireAdmin, (_req, res) => {
  res.json(getFlashDealsSetting());
});

app.put('/api/admin/flash-deals', requireAdmin, (req, res) => {
  const value = setFlashDealsSetting(req.body || {});
  res.json(value);
});

app.get('/api/admin/flash-ads', requireAdmin, (_req, res) => {
  res.json(getFlashAdsSetting());
});

app.put('/api/admin/flash-ads', requireAdmin, (req, res) => {
  const value = setFlashAdsSetting(req.body || {});
  res.json(value);
});

app.get('/api/admin/email-history', requireAdmin, (_req, res) => {
  const sorted = emailHistory
    .slice()
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  res.json(sorted);
});

app.post('/api/admin/email/send-test', requireAdmin, (req, res) => {
  const to = (req.body && req.body.to ? req.body.to.toString() : process.env.SUPPORT_EMAIL) || 'info@imkmarket.com';
  emailHistory.unshift({
    id: createId('EMAIL', 4),
    to,
    subject: 'Test Email - IMK-MARKET',
    template: 'orderConfirmation',
    sentAt: nowIso(),
    status: 'Sent',
  });
  res.json({ success: true });
});

app.post('/api/admin/email/low-stock-alerts', requireAdmin, (_req, res) => {
  const support = process.env.SUPPORT_EMAIL || 'info@imkmarket.com';
  const low = products.filter((p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 10));
  low.forEach((p) => {
    emailHistory.unshift({
      id: createId('EMAIL', 4),
      to: support,
      subject: `Low stock alert - ${p.name}`,
      template: 'lowStockAlert',
      sentAt: nowIso(),
      status: 'Sent',
    });
  });
  res.json({ sent: low.length });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Mock API with ${products.length} products listening on port ${PORT}`));
}

module.exports = app;
