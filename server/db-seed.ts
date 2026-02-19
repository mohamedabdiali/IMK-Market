import bcrypt from "bcryptjs";
import crypto from "crypto";
import { nanoid } from "nanoid";
import prisma from "./prisma.js";

// ============================================
// SEED DATA DEFINITIONS
// ============================================

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

// ============================================
// PERMISSION DEFINITIONS
// ============================================

const resources = [
  "dashboard",
  "analytics",
  "products",
  "orders",
  "users",
  "sellers",
  "marketing",
  "reports",
  "settings",
  "notifications",
  "audit_logs",
  "tenants",
  "roles",
];

const actions = ["view", "create", "edit", "delete", "approve", "export"];

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function main() {
  const createTempPassword = () =>
    crypto
      .randomBytes(12)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 16);
  console.log("🌱 Seeding database with multi-tenant architecture...\n");

  // ============================================
  // 1. CREATE PERMISSIONS
  // ============================================
  console.log("📋 Creating permissions...");
  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: { resource, action },
        },
        update: {},
        create: {
          resource,
          action,
          description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }
  console.log(`✅ Created ${permissions.length} permissions\n`);

  // ============================================
  // 2. CREATE SUPER ADMIN USER
  // ============================================
  console.log("👑 Creating Super System Admin...");
  const superAdminPassword = crypto.randomBytes(16).toString("base64").slice(0, 20);
  const superAdminHash = bcrypt.hashSync(superAdminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@primmesisc.com" },
    update: {},
    create: {
      email: "admin@primmesisc.com",
      username: "superadmin",
      passwordHash: superAdminHash,
      name: "Super System Admin",
      isSuperAdmin: true,
      mustResetPassword: true,
      passwordUpdatedAt: new Date(),
    },
  });
  console.log(`✅ Super Admin created: admin@primmesisc.com`);
  console.log(`🔐 SUPER ADMIN PASSWORD: ${superAdminPassword}`);
  console.log(`⚠️  SAVE THIS PASSWORD - It will not be shown again!\n`);

  // ============================================
  // 3. CREATE GLOBAL ROLES
  // ============================================
  console.log("🎭 Creating global roles...");

  const superAdminRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Super Admin", tenantId: null } },
    update: {},
    create: {
      name: "Super Admin",
      description: "Full system access across all tenants",
      isSystemRole: true,
    },
  });

  const sellerRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Seller", tenantId: null } },
    update: {},
    create: {
      name: "Seller",
      description: "Seller with product management capabilities",
      isSystemRole: true,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Customer", tenantId: null } },
    update: {},
    create: {
      name: "Customer",
      description: "Regular customer account",
      isSystemRole: true,
    },
  });

  // Assign all permissions to Super Admin role
  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Assign Super Admin role to super admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  console.log(`✅ Created global roles: Super Admin, Seller, Customer\n`);

  // ============================================
  // 4. CREATE IMK-MARKET TENANT
  // ============================================
  console.log("🏢 Creating IMK-Market tenant...");
  const imkTenant = await prisma.tenant.upsert({
    where: { name: "IMK-Market" },
    update: {},
    create: {
      name: "IMK-Market",
      subscriptionType: "E-commerce Business",
      subscriptionStatus: "active",
      modulesEnabled: JSON.stringify([
        "Client Management",
        "Product Management",
        "Order Management",
        "Marketing Tools",
        "Analytics Dashboard",
        "Seller Management",
      ]),
    },
  });
  console.log(`✅ Created tenant: IMK-Market\n`);

  await prisma.subscription.upsert({
    where: { tenantId: imkTenant.id },
    update: {},
    create: {
      tenantId: imkTenant.id,
      planName: "E-commerce Business",
      status: "active",
      billingCycle: "monthly",
      currency: "USD",
    },
  });

  // ============================================
  // 5. CREATE TENANT-SPECIFIC ROLES
  // ============================================
  console.log("🎯 Creating IMK-Market roles...");

  const managerRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Manager", tenantId: imkTenant.id } },
    update: {},
    create: {
      name: "Manager",
      description: "Full access within IMK-Market tenant",
      tenantId: imkTenant.id,
      isSystemRole: false,
    },
  });

  const salesAssociateRole = await prisma.role.upsert({
    where: { name_tenantId: { name: "Sales Associate", tenantId: imkTenant.id } },
    update: {},
    create: {
      name: "Sales Associate",
      description: "Limited access for sales operations",
      tenantId: imkTenant.id,
      isSystemRole: false,
    },
  });

  // Manager permissions (most permissions except system-level)
  const managerPermissions = permissions.filter(
    (p) => !["tenants", "roles", "audit_logs"].includes(p.resource) || p.action === "view"
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Sales Associate permissions (limited)
  const salesPermissions = permissions.filter(
    (p) =>
      (p.resource === "orders" && ["view", "edit"].includes(p.action)) ||
      (p.resource === "products" && ["view", "edit"].includes(p.action)) ||
      (p.resource === "dashboard" && p.action === "view")
  );
  for (const permission of salesPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: salesAssociateRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: salesAssociateRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log(`✅ Created tenant roles: Manager, Sales Associate\n`);

  // ============================================
  // 6. CREATE IMK-MARKET TEAM ACCOUNTS
  // ============================================
  console.log("👥 Creating IMK-Market team accounts...");

  const managerPassword = createTempPassword();
  const salesPassword = createTempPassword();

  const manager = await prisma.user.upsert({
    where: { email: "manager@imk-market.com" },
    update: {},
    create: {
      email: "manager@imk-market.com",
      passwordHash: bcrypt.hashSync(managerPassword, 10),
      name: "IMK Manager",
      tenantId: imkTenant.id,
      mustResetPassword: true,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: manager.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: manager.id,
      roleId: managerRole.id,
      tenantId: imkTenant.id,
    },
  });

  const salesAssociate = await prisma.user.upsert({
    where: { email: "sales@imk-market.com" },
    update: {},
    create: {
      email: "sales@imk-market.com",
      passwordHash: bcrypt.hashSync(salesPassword, 10),
      name: "Sales Associate",
      tenantId: imkTenant.id,
      mustResetPassword: true,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: salesAssociate.id,
        roleId: salesAssociateRole.id,
      },
    },
    update: {},
    create: {
      userId: salesAssociate.id,
      roleId: salesAssociateRole.id,
      tenantId: imkTenant.id,
    },
  });

  console.log(`✅ Manager: manager@imk-market.com / ${managerPassword}`);
  console.log(`✅ Sales Associate: sales@imk-market.com / ${salesPassword}\n`);

  // ============================================
  // 7. CREATE DEMO CUSTOMER
  // ============================================
  console.log("🛍️  Creating demo customer...");
  const demoCustomerPassword = process.env.DEMO_CUSTOMER_PASSWORD || "Demo@12345";
  const demoCustomerPhone = process.env.DEMO_CUSTOMER_PHONE || "+23270000000";
  const demoCustomer = await prisma.user.upsert({
    where: { email: "customer@demo.com" },
    update: {},
    create: {
      email: "customer@demo.com",
      passwordHash: bcrypt.hashSync(demoCustomerPassword, 10),
      name: "Demo Customer",
      phone: demoCustomerPhone,
      tenantId: imkTenant.id,
      mustResetPassword: false,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: demoCustomer.id,
        roleId: customerRole.id,
      },
    },
    update: {},
    create: {
      userId: demoCustomer.id,
      roleId: customerRole.id,
      tenantId: imkTenant.id,
    },
  });

  console.log(`✅ Demo Customer: customer@demo.com / ${demoCustomerPassword}\n`);

  // ============================================
  // 8. CREATE DEMO SELLER
  // ============================================
  console.log("🏪 Creating demo seller...");
  const sellerPassword = createTempPassword();
  const demoSeller = await prisma.user.upsert({
    where: { email: "seller@demo.com" },
    update: {},
    create: {
      email: "seller@demo.com",
      passwordHash: bcrypt.hashSync(sellerPassword, 10),
      name: "Demo Seller",
      phone: "+971509876543",
      tenantId: imkTenant.id,
      mustResetPassword: true,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: demoSeller.id,
        roleId: sellerRole.id,
      },
    },
    update: {},
    create: {
      userId: demoSeller.id,
      roleId: sellerRole.id,
      tenantId: imkTenant.id,
    },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: demoSeller.id },
    update: {},
    create: {
      userId: demoSeller.id,
      businessName: "Demo Electronics Store",
      ownerName: "John Doe",
      phone: "+971509876543",
      businessAddress: "Dubai, UAE",
      productCategory: "Electronics",
      description: "Premium electronics and gadgets",
      status: "active",
      approvedAt: new Date(),
      approvedBy: superAdmin.id,
    },
  });

  console.log(`✅ Demo Seller: seller@demo.com / ${sellerPassword}\n`);

  await prisma.sellerStatus.create({
    data: {
      sellerId: sellerProfile.id,
      status: "active",
      note: "Seeded demo seller",
      changedBy: superAdmin.id,
    },
  });

  // ============================================
  // 9. CREATE CATEGORIES
  // ============================================
  console.log("📦 Creating categories...");
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
  console.log(`✅ Created ${categories.length} categories\n`);

  // ============================================
  // 10. CREATE PRODUCTS
  // ============================================
  console.log("🛒 Creating products...");
  const categoryMap = new Map<string, string>();
  const allCategories = await prisma.category.findMany();
  allCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

  for (const prod of products) {
    const categoryId = categoryMap.get(prod.category);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
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
        tenantId: imkTenant.id,
        country: "UAE",
        status: "active",
      },
    });
  }

  // Create one seller product
  const electronicsCategory = categoryMap.get("Electronics");
  if (electronicsCategory) {
    await prisma.product.create({
      data: {
        name: "Premium Bluetooth Speaker",
        description: "High-quality portable Bluetooth speaker with 360° sound",
        price: 129.99,
        originalPrice: 159.99,
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop",
        images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop"],
        categoryId: electronicsCategory,
        rating: 4.7,
        reviewCount: 89,
        inStock: true,
        freeShipping: true,
        badge: "Seller Product",
        sku: `SELLER-${Math.floor(Math.random() * 9000 + 1000)}`,
        stock: 25,
        lowStockThreshold: 5,
        lastRestocked: new Date(),
        sellerId: sellerProfile.id,
        country: "UAE",
        status: "active",
      },
    });
  }

  console.log(`✅ Created ${products.length + 1} products\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("=".repeat(60));
  console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📋 ACCOUNT CREDENTIALS:\n");
  console.log("🔴 SUPER ADMIN (Platform Owner):");
  console.log(`   Email: admin@primmesisc.com`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`   Access: Full platform control\n`);

  console.log("🔵 IMK-MARKET MANAGER:");
  console.log(`   Email: manager@imk-market.com`);
  console.log(`   Password: ${managerPassword}`);
  console.log(`   Access: Full IMK-Market tenant access\n`);

  console.log("🟢 SALES ASSOCIATE:");
  console.log(`   Email: sales@imk-market.com`);
  console.log(`   Password: ${salesPassword}`);
  console.log(`   Access: Orders & Products (limited)\n`);

  console.log("🟡 DEMO SELLER:");
  console.log(`   Email: seller@demo.com`);
  console.log(`   Password: ${sellerPassword}`);
  console.log(`   Access: Own products management\n`);

  console.log("🟣 DEMO CUSTOMER:");
  console.log(`   Email: customer@demo.com`);
  console.log(`   Password: ${demoCustomerPassword}`);
  console.log(`   Access: Shopping & orders\n`);

  console.log("=".repeat(60));
  console.log("⚠️  IMPORTANT: Save the Super Admin password securely!");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
