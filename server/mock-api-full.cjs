require('dotenv').config();

const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const BODY_LIMIT = process.env.API_BODY_LIMIT || '25mb';
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));
app.use('/mock-images', express.static(path.join(__dirname, '..', 'public', 'mock-images')));

const PORT = Number(process.env.API_PORT || process.env.PORT || 5050);

const PAYMENT_CURRENCY = process.env.PAYMENT_CURRENCY || 'SLE';
const MOCK_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@imkmarket.com';
const MOCK_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const createId = (prefix, bytes = 4) => `${prefix}-${crypto.randomBytes(bytes).toString('hex').toUpperCase()}`;
const nowIso = () => new Date().toISOString();
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
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
const createTrackingNumber = () => `TRK-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

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
    status: hydrated.status,
    paymentStatus: hydrated.paymentStatus,
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

const createProductImagePath = (index) => `/mock-images/products/p-${String(index + 1).padStart(3, '0')}.svg`;

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
    const image = createProductImagePath(index);

    generated.push({
      id: String(id),
      name,
      description: productDescriptions[index % productDescriptions.length],
      price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      image,
      images: [image],
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

// Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/categories', (req, res) => {
  const result = categories.map(c => ({ id: c.id, name: c.name, image: toPublicMediaUrl(req, c.image), productCount: products.filter(p => p.categoryId === c.id).length }));
  res.json(result);
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
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim() : '';
  const trackingNumber =
    typeof req.query.trackingNumber === 'string' ? req.query.trackingNumber.trim().toUpperCase() : '';
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';

  if (!orderId && !trackingNumber) {
    return res.status(400).json({ error: 'Provide orderId or trackingNumber' });
  }
  const hasStrongPair = Boolean(orderId && trackingNumber);
  if (!hasStrongPair && !email && !phone) {
    return res.status(400).json({ error: 'Provide email or phone for verification' });
  }

  const order = orders.find((item) => {
    if (orderId && item.id === orderId) return true;
    if (trackingNumber && (item.trackingNumber || '').toUpperCase() === trackingNumber) return true;
    return false;
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (trackingNumber && (order.trackingNumber || '').toUpperCase() !== trackingNumber) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (hasStrongPair) {
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

  const amount = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = nowIso();
  const reference = `IMK-${id.replace('PAY-', '')}`;
  const method = (paymentMethod || 'paystack').toString();

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
    items: normalizedItems,
    orderId: undefined,
    createdAt,
    updatedAt: createdAt,
  };
  payments.unshift(record);

  const instructions = [
    'Complete the payment using your selected method.',
    'Then refresh the status to confirm your order.',
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
    updatedAt: record.updatedAt,
  });
});

app.get('/api/payments/:id', (req, res) => {
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Not found' });

  // Auto-confirm payments after ~10s for demo purposes.
  if (payment.status === 'pending') {
    const ageMs = Date.now() - new Date(payment.createdAt).getTime();
    if (ageMs > 10_000) {
      payment.status = 'paid';
      payment.updatedAt = nowIso();
      if (!payment.orderId) {
        const order = {
          id: `ORD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
          customerPhone: payment.customerPhone,
          items: payment.items,
          total: payment.amount,
          status: 'pending',
          paymentMethod: payment.paymentMethod,
          paymentStatus: 'paid',
          paymentReference: payment.reference,
          createdAt: payment.updatedAt,
          shippingAddress: payment.shippingAddress,
          cargoType: payment.cargoType,
          trackingNumber: createTrackingNumber(),
          trackingCarrier: 'IMK Logistics',
          trackingUrl: undefined,
          currentLocation: resolveStatusLocation('pending', payment.shippingAddress),
          estimatedDelivery: resolveEstimatedDeliveryIso(payment.cargoType, payment.updatedAt),
          shippedAt: undefined,
          deliveredAt: undefined,
          lastTrackingUpdate: payment.updatedAt,
          trackingEvents: [],
        };
        addTrackingEvent(order, {
          status: 'pending',
          location: order.currentLocation,
          source: 'system',
          eventAt: payment.updatedAt,
        });
        orders.unshift(order);
        payment.orderId = order.id;
      }
    }
  }

  res.json({
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    paymentMethod: payment.paymentMethod,
    orderId: payment.orderId,
    trackingNumber: payment.orderId ? orders.find((o) => o.id === payment.orderId)?.trackingNumber || null : null,
    updatedAt: payment.updatedAt,
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
// Admin (mock implementation)
// ------------------------
const requireAdmin = (req, res, next) => {
  const auth = (req.headers.authorization || '').toString();
  if (!auth.startsWith('Bearer ') || auth.slice(7).trim().length === 0) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const emailOk = email.toString().toLowerCase() === MOCK_ADMIN_EMAIL.toLowerCase();
  const passwordOk = password === MOCK_ADMIN_PASSWORD || password === 'admin123';
  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  return res.json({ token: 'mock-admin-token', role: 'admin', email });
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
  res.json(sorted);
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
    .filter((img) => img.startsWith('http') || img.startsWith('data:'))
    .slice(0, 10);

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
      .filter((img) => img.startsWith('http') || img.startsWith('data:'))
      .slice(0, 10);
    if (normalized.length > 0) {
      product.images = normalized;
      product.image = normalized[0];
    }
  } else if (payload.image !== undefined) {
    const img = (payload.image || '').toString();
    if (img.startsWith('http') || img.startsWith('data:')) {
      const existing = Array.isArray(product.images) && product.images.length ? product.images : [product.image];
      product.images = [img, ...existing.slice(1)];
      product.image = img;
    }
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
  const sorted = categories
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, image: toPublicMediaUrl(req, c.image) }));
  res.json(sorted);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { name, image } = req.body || {};
  if (!name || !name.toString().trim()) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const category = ensureCategory(name.toString(), image ? image.toString() : undefined);
  res.status(201).json({ ...category, image: toPublicMediaUrl(req, category.image) });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const existing = categories.find((c) => c.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const uncategorized = ensureUncategorized();
  products.forEach((p) => {
    if (p.categoryId === existing.id) p.categoryId = uncategorized.id;
  });
  categories = categories.filter((c) => c.id !== existing.id);
  res.json({ id: req.params.id });
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

