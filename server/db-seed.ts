import bcrypt from "bcryptjs";
import crypto from "crypto";
import { nanoid } from "nanoid";
import prisma from "./prisma";

const categories = [
  { name: "Fashion & Clothing", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop" },
  { name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop" },
  { name: "Home & Lifestyle", image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=300&fit=crop" },
  { name: "Beauty & Personal Care", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop" },
  { name: "Automotive", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop" },
  { name: "Baby & Kids", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop" },
  { name: "Sports & Outdoors", image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=300&fit=crop" },
  { name: "Jewelry & Watches", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop" },
  { name: "Food & Beverages", image: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop" },
  { name: "Office & Stationery", image: "https://images.unsplash.com/photo-1487611459768-bd414656ea10?w=400&h=300&fit=crop" },
  { name: "Health & Wellness", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop" },
  { name: "Pet Supplies", image: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=300&fit=crop" },
  { name: "Uncategorized", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop" },
];

const products = [
  {
    name: "Traditional Somali Dress - Dirac",
    description: "Beautiful handcrafted traditional Somali dress with intricate embroidery",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=500&fit=crop",
    category: "Fashion & Clothing",
    rating: 4.8,
    reviewCount: 245,
    inStock: true,
    freeShipping: true,
    badge: "Best Seller",
  },
  {
    name: "Gold Plated Necklace Set",
    description: "Elegant 18K gold plated necklace with matching earrings",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop",
    category: "Jewelry & Watches",
    rating: 4.9,
    reviewCount: 189,
    inStock: true,
    freeShipping: true,
    badge: "Premium",
  },
  {
    name: "Handwoven Basket Collection",
    description: "Set of 3 authentic African handwoven baskets for home decor",
    price: 65.99,
    originalPrice: 85.99,
    image: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500&h=500&fit=crop",
    category: "Home & Lifestyle",
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    freeShipping: false,
  },
  {
    name: "Luxury Oud Perfume",
    description: "Premium Arabic Oud fragrance - Long lasting and elegant",
    price: 120.0,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop",
    category: "Beauty & Personal Care",
    rating: 4.9,
    reviewCount: 312,
    inStock: true,
    freeShipping: true,
    badge: "Top Rated",
  },
  {
    name: "Wireless Earbuds Pro",
    description: "High-quality wireless earbuds with noise cancellation",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
    category: "Electronics",
    rating: 4.6,
    reviewCount: 428,
    inStock: true,
    freeShipping: true,
  },
  {
    name: "Men's Traditional Khamis",
    description: "Premium quality white Khamis with embroidered collar",
    price: 75.0,
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&h=500&fit=crop",
    category: "Fashion & Clothing",
    rating: 4.7,
    reviewCount: 198,
    inStock: true,
    freeShipping: false,
  },
  {
    name: "Smart Watch Series X",
    description: "Advanced smartwatch with health monitoring and GPS",
    price: 199.99,
    originalPrice: 249.99,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&h=500&fit=crop",
    category: "Electronics",
    rating: 4.8,
    reviewCount: 567,
    inStock: true,
    freeShipping: false,
    badge: "New Arrival",
  },
  {
    name: "Organic Frankincense Set",
    description: "Premium frankincense incense - Natural and pure",
    price: 35.99,
    image: "https://images.unsplash.com/photo-1602928298849-325cec8771c0?w=500&h=500&fit=crop",
    category: "Home & Lifestyle",
    rating: 4.9,
    reviewCount: 234,
    inStock: true,
    freeShipping: true,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create categories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        image: cat.image,
      },
    });
  }

  // Get categories for product seeding
  const categoryMap = new Map<string, string>();
  const allCategories = await prisma.category.findMany();
  allCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

  // Create products
  for (const prod of products) {
    const categoryId = categoryMap.get(prod.category);
    if (!categoryId) continue;
    await prisma.product.upsert({
      where: { sku: `IMK-${Math.floor(Math.random() * 9000 + 1000)}` },
      update: {},
      create: {
        name: prod.name,
        description: prod.description,
        price: prod.price,
        originalPrice: prod.originalPrice,
        image: prod.image,
        images: [prod.image],
        categoryId,
        rating: prod.rating,
        reviewCount: prod.reviewCount,
        inStock: prod.inStock,
        freeShipping: prod.freeShipping,
        badge: prod.badge,
        sku: `IMK-${Math.floor(Math.random() * 9000 + 1000)}`,
        stock: Math.floor(Math.random() * 80) + 10,
        lowStockThreshold: 10,
        lastRestocked: new Date(),
        sellerName: "IMK-MARKET",
        sellerEmail: "info@imkmarket.com",
        country: "UAE",
        status: "active",
      },
    });
  }

  // Create or update admin user
  const adminEmail = process.env.ADMIN_EMAIL || "admin@imkmarket.com";
  const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64");
  const hash = bcrypt.hashSync(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hash,
      role: "admin",
    },
  });

  console.log("✅ Database seeded successfully!");
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`🔐 Generated ADMIN_PASSWORD: ${adminPassword}`);
    console.log("⚠️  Please set ADMIN_PASSWORD in your production environment and rotate this password.");
  }
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
