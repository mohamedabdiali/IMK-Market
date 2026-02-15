import { AdminOrder, PendingProduct, InventoryItem, AnalyticsData } from '@/types/admin';

export const mockOrders: AdminOrder[] = [
  {
    id: 'ORD-001',
    customerName: 'Ahmed Hassan',
    customerEmail: 'ahmed@example.com',
    items: [
      { productName: 'Somali Coffee Beans', quantity: 2, price: 24.99 },
      { productName: 'Frankincense Resin', quantity: 1, price: 19.99 }
    ],
    total: 69.97,
    status: 'pending',
    createdAt: '2024-01-15T10:30:00Z',
    shippingAddress: '123 Main St, Minneapolis, MN 55401'
  },
  {
    id: 'ORD-002',
    customerName: 'Fatima Omar',
    customerEmail: 'fatima@example.com',
    items: [
      { productName: 'Traditional Dirac', quantity: 1, price: 89.99 }
    ],
    total: 89.99,
    status: 'processing',
    createdAt: '2024-01-14T15:45:00Z',
    shippingAddress: '456 Oak Ave, Columbus, OH 43215'
  },
  {
    id: 'ORD-003',
    customerName: 'Mohamed Ali',
    customerEmail: 'mohamed@example.com',
    items: [
      { productName: 'Somali Spice Mix', quantity: 3, price: 12.99 },
      { productName: 'Sambusa Maker', quantity: 1, price: 34.99 }
    ],
    total: 73.96,
    status: 'shipped',
    createdAt: '2024-01-13T09:15:00Z',
    shippingAddress: '789 Pine Rd, Seattle, WA 98101'
  },
  {
    id: 'ORD-004',
    customerName: 'Amina Yusuf',
    customerEmail: 'amina@example.com',
    items: [
      { productName: 'Oud Perfume', quantity: 1, price: 149.99 }
    ],
    total: 149.99,
    status: 'delivered',
    createdAt: '2024-01-10T14:20:00Z',
    shippingAddress: '321 Elm St, Denver, CO 80202'
  },
  {
    id: 'ORD-005',
    customerName: 'Ibrahim Farah',
    customerEmail: 'ibrahim@example.com',
    items: [
      { productName: 'Camel Milk Powder', quantity: 5, price: 29.99 }
    ],
    total: 149.95,
    status: 'pending',
    createdAt: '2024-01-16T08:00:00Z',
    shippingAddress: '555 Birch Ln, Phoenix, AZ 85001'
  }
];

export const mockPendingProducts: PendingProduct[] = [
  {
    id: 'PROD-P001',
    name: 'Handwoven Somali Basket',
    price: 45.99,
    category: 'Home & Garden',
    sellerName: 'Halimo Crafts',
    sellerEmail: 'halimo@crafts.com',
    description: 'Beautiful handwoven basket made with traditional techniques.',
    image: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400',
    status: 'pending',
    submittedAt: '2024-01-16T09:00:00Z'
  },
  {
    id: 'PROD-P002',
    name: 'Organic Somali Honey',
    price: 34.99,
    category: 'Food & Beverages',
    sellerName: 'Bee Paradise',
    sellerEmail: 'bee@paradise.com',
    description: 'Pure organic honey sourced from Somali highlands.',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
    status: 'pending',
    submittedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: 'PROD-P003',
    name: 'Traditional Koofiyad',
    price: 28.99,
    category: 'Clothing',
    sellerName: 'Cultural Wear Co',
    sellerEmail: 'info@culturalwear.com',
    description: 'Authentic Somali cap with intricate embroidery.',
    image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',
    status: 'pending',
    submittedAt: '2024-01-14T11:15:00Z'
  },
  {
    id: 'PROD-P004',
    name: 'Myrrh Essential Oil',
    price: 39.99,
    category: 'Health & Beauty',
    sellerName: 'Natural Essentials',
    sellerEmail: 'natural@essentials.com',
    description: 'Premium myrrh oil extracted using traditional methods.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    status: 'pending',
    submittedAt: '2024-01-13T16:45:00Z'
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: 'INV-001',
    productId: 'PROD-001',
    productName: 'Somali Coffee Beans',
    sku: 'SCB-001',
    stock: 150,
    lowStockThreshold: 20,
    lastRestocked: '2024-01-10T00:00:00Z',
    category: 'Food & Beverages'
  },
  {
    id: 'INV-002',
    productId: 'PROD-002',
    productName: 'Frankincense Resin',
    sku: 'FR-001',
    stock: 8,
    lowStockThreshold: 15,
    lastRestocked: '2024-01-05T00:00:00Z',
    category: 'Health & Beauty'
  },
  {
    id: 'INV-003',
    productId: 'PROD-003',
    productName: 'Traditional Dirac',
    sku: 'TD-001',
    stock: 45,
    lowStockThreshold: 10,
    lastRestocked: '2024-01-12T00:00:00Z',
    category: 'Clothing'
  },
  {
    id: 'INV-004',
    productId: 'PROD-004',
    productName: 'Somali Spice Mix',
    sku: 'SSM-001',
    stock: 12,
    lowStockThreshold: 25,
    lastRestocked: '2024-01-08T00:00:00Z',
    category: 'Food & Beverages'
  },
  {
    id: 'INV-005',
    productId: 'PROD-005',
    productName: 'Oud Perfume',
    sku: 'OP-001',
    stock: 30,
    lowStockThreshold: 5,
    lastRestocked: '2024-01-14T00:00:00Z',
    category: 'Health & Beauty'
  },
  {
    id: 'INV-006',
    productId: 'PROD-006',
    productName: 'Camel Milk Powder',
    sku: 'CMP-001',
    stock: 3,
    lowStockThreshold: 10,
    lastRestocked: '2024-01-02T00:00:00Z',
    category: 'Food & Beverages'
  }
];

export const mockAnalytics: AnalyticsData = {
  totalRevenue: 125847.50,
  totalOrders: 1284,
  totalProducts: 156,
  totalCustomers: 892,
  revenueByMonth: [
    { month: 'Aug', revenue: 18500 },
    { month: 'Sep', revenue: 22300 },
    { month: 'Oct', revenue: 19800 },
    { month: 'Nov', revenue: 28400 },
    { month: 'Dec', revenue: 35200 },
    { month: 'Jan', revenue: 21647 }
  ],
  ordersByStatus: [
    { status: 'Delivered', count: 856 },
    { status: 'Shipped', count: 215 },
    { status: 'Processing', count: 98 },
    { status: 'Pending', count: 85 },
    { status: 'Cancelled', count: 30 }
  ],
  topProducts: [
    { name: 'Somali Coffee Beans', sales: 342 },
    { name: 'Frankincense Resin', sales: 278 },
    { name: 'Traditional Dirac', sales: 234 },
    { name: 'Oud Perfume', sales: 189 },
    { name: 'Camel Milk Powder', sales: 156 }
  ],
  topCategories: [
    { name: 'Food & Beverages', revenue: 45200 },
    { name: 'Clothing', revenue: 32800 },
    { name: 'Health & Beauty', revenue: 28400 },
    { name: 'Home & Garden', revenue: 12300 },
    { name: 'Electronics', revenue: 7147 }
  ]
};
