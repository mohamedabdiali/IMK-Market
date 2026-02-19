import "dotenv/config";

import cors from "cors";
import express from "express";

const app = express();
const BODY_LIMIT = process.env.API_BODY_LIMIT || "25mb";
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

const PORT = Number(process.env.API_PORT || process.env.PORT || 5050);

const categories = [
  { id: "c1", name: "Electronics", image: "📱" },
  { id: "c2", name: "Fashion", image: "👗" },
  { id: "c3", name: "Home", image: "🏠" },
];

const products = [
  {
    id: "1",
    name: "Wireless Headphones",
    description: "Comfortable over-ear",
    price: 79.99,
    image: "https://via.placeholder.com/320x240?text=Headphones",
    images: [],
    categoryId: "c1",
    rating: 4.5,
    reviewCount: 12,
    inStock: true,
    freeShipping: true,
    badge: null,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Running Shoes",
    description: "Lightweight running shoes",
    price: 89.99,
    image: "https://via.placeholder.com/320x240?text=Shoes",
    images: [],
    categoryId: "c2",
    rating: 4.8,
    reviewCount: 34,
    inStock: true,
    freeShipping: false,
    badge: "Bestseller",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Desk Lamp",
    description: "LED desk lamp",
    price: 34.99,
    image: "https://via.placeholder.com/320x240?text=Lamp",
    images: [],
    categoryId: "c3",
    rating: 4.2,
    reviewCount: 8,
    inStock: true,
    freeShipping: true,
    badge: null,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Phone Case",
    description: "Durable phone case",
    price: 19.99,
    image: "https://via.placeholder.com/320x240?text=Case",
    images: [],
    categoryId: "c1",
    rating: 4.3,
    reviewCount: 20,
    inStock: true,
    freeShipping: false,
    badge: null,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Designer T-Shirt",
    description: "100% cotton",
    price: 49.99,
    image: "https://via.placeholder.com/320x240?text=T-Shirt",
    images: [],
    categoryId: "c2",
    rating: 4.6,
    reviewCount: 15,
    inStock: true,
    freeShipping: false,
    badge: null,
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Coffee Maker",
    description: "Brew great coffee",
    price: 129.99,
    image: "https://via.placeholder.com/320x240?text=Coffee+Maker",
    images: [],
    categoryId: "c3",
    rating: 4.7,
    reviewCount: 9,
    inStock: true,
    freeShipping: true,
    badge: "Top Rated",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.get("/api/categories", (_req, res) => {
  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    productCount: products.filter((p) => p.categoryId === c.id).length,
  }));
  res.json(result);
});

app.get("/api/products", (req, res) => {
  const { category, q, sort } = req.query;
  let result = products.slice();

  if (category) {
    result = result.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      return (cat && cat.name === category) || p.categoryId === category;
    });
  }

  if (q) {
    const query = q.toString().toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)
    );
  }

  if (sort === "price-low") result.sort((a, b) => a.price - b.price);
  if (sort === "price-high") result.sort((a, b) => b.price - a.price);
  if (sort === "rating") result.sort((a, b) => b.rating - a.rating);

  res.json(
    result.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      images: p.images.length ? p.images : [p.image],
      category: categories.find((c) => c.id === p.categoryId)?.name || "Uncategorized",
      rating: p.rating,
      reviewCount: p.reviewCount,
      inStock: p.inStock,
      freeShipping: p.freeShipping,
      badge: p.badge,
    }))
  );
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((x) => x.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });

  res.json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    image: product.image,
    images: product.images.length ? product.images : [product.image],
    category: categories.find((c) => c.id === product.categoryId)?.name || "Uncategorized",
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: product.inStock,
    freeShipping: product.freeShipping,
    badge: product.badge,
  });
});

app.post("/api/orders", (_req, res) => {
  const id = "ORD-" + Math.random().toString(36).slice(2, 9).toUpperCase();
  return res.json({ id, total: 0, status: "pending" });
});

app.post("/api/payments/initiate", (_req, res) => {
  return res.json({ id: "PAY-FAKE", status: "initialized", redirectUrl: null });
});

if (require.main === module) {
  app.listen(PORT, () => console.log("Mock API listening on", PORT));
}
