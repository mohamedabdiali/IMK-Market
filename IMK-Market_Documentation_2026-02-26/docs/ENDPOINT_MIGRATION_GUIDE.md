# Server Endpoint Migration to Prisma

This guide explains how to migrate each endpoint in `server/index.ts` from `lowdb` to Prisma ORM.

## General Pattern

### Before (lowdb - synchronous)
```typescript
const product = db.data.products.find(p => p.id === id);
if (!product) return res.status(404).json({ error: "Not found" });
res.json(product);
```

### After (Prisma - async)
```typescript
const product = await prisma.product.findUnique({
  where: { id }
});
if (!product) return res.status(404).json({ error: "Not found" });
res.json(product);
```

## Key Changes

1. **Make routes async**: Change `(req, res) =>` to `async (req, res) =>`
2. **Replace `db.data.*` with `prisma.*`**
3. **Use `await` for all database queries**
4. **Use Prisma's query syntax** (findMany, findUnique, create, update, delete)
5. **Add try/catch for error handling**
6. **Remove `writeDb()` calls** (Prisma auto-commits)

## Example Migrations

### Get Categories
```typescript
// Before
app.get("/api/categories", (_req, res) => {
  const productCounts = db.data.products.reduce<...>((acc, product) => {
    acc[product.categoryId] = (acc[product.categoryId] || 0) + 1;
    return acc;
  }, {});
  const result = db.data.categories.map(...);
  res.json(result);
});

// After
app.get("/api/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    const result = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await prisma.product.count({
          where: { categoryId: cat.id },
        });
        return { id: cat.id, name: cat.name, image: cat.image, productCount };
      })
    );
    res.json(result);
  } catch (e) {
    console.error("Category fetch error", e);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
```

### Create Order
```typescript
// Before
function createOrderRecord(payload: {...}) {
  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = createOrderId();
  const createdAt = new Date().toISOString();
  
  db.data.orders.push({ id, ..., createdAt });
  for (const item of payload.items) {
    db.data.orderItems.push({ ..., orderId: id });
  }
  writeDb(db);
  return { id, total, status: "pending" };
}

// After
async function createOrderRecord(payload: {...}) {
  const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const id = createOrderId();
  
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
      total,
      items: {
        create: payload.items.map(item => ({
          productId: item.productId?.toString(),
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  });
  
  return { id: order.id, total: order.total, status: order.status, paymentStatus: order.paymentStatus };
}
```

### Update Product
```typescript
// Before
app.patch("/api/admin/products/:id", requireAdmin, (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid" });
  
  const product = db.data.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  
  if (parsed.data.category) {
    const category = ensureCategory(parsed.data.category);
    product.categoryId = category.id;
  }
  Object.assign(product, parsed.data);
  writeDb(db);
  res.json(product);
});

// After
app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid" });
    
    let categoryId = undefined;
    if (parsed.data.category) {
      const category = await ensureCategory(parsed.data.category);
      categoryId = category.id;
    }
    
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        image: parsed.data.image,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
        stock: parsed.data.stock,
        status: parsed.data.status,
      },
    });
    res.json(product);
  } catch (e: any) {
    if (e.code === "P2025") return res.status(404).json({ error: "Not found" });
    console.error("Update product error", e);
    res.status(500).json({ error: "Update failed" });
  }
});
```

## Common Prisma Queries

### Find
```typescript
// Find one
const product = await prisma.product.findUnique({ where: { id } });
const product = await prisma.product.findFirst({ where: { name } });

// Find many
const products = await prisma.product.findMany({
  where: { status: "active" },
  orderBy: { createdAt: "desc" },
  take: 10, // limit
  skip: 0, // offset
});

// Count
const count = await prisma.product.count({ where: { status: "active" } });
```

### Create
```typescript
const product = await prisma.product.create({
  data: {
    name: "...",
    price: 100,
    category: { connect: { id: categoryId } }, // relation
  },
});

// Create with nested creates
const order = await prisma.order.create({
  data: {
    customerName: "...",
    items: {
      create: [{ productName: "...", quantity: 1, price: 100 }],
    },
  },
});
```

### Update
```typescript
const product = await prisma.product.update({
  where: { id },
  data: { name: "...", price: 200 },
});

// Update many
await prisma.product.updateMany({
  where: { status: "inactive" },
  data: { status: "active" },
});
```

### Delete
```typescript
const product = await prisma.product.delete({ where: { id } });

// Delete many
await prisma.product.deleteMany({ where: { status: "inactive" } });
```

### Relations
```typescript
// Get product with category
const product = await prisma.product.findUnique({
  where: { id },
  include: { category: true }, // or select: { category: { select: { name: true } } }
});

// Get order with items
const order = await prisma.order.findUnique({
  where: { id },
  include: { items: true },
});
```

## Error Handling

Prisma errors have `code` properties:

| Code | Meaning |
|------|---------|
| P2025 | Record not found |
| P2002 | Unique constraint violation |
| P2003 | Foreign key constraint violation |
| P2014 | Required relation violation |

```typescript
try {
  await prisma.product.delete({ where: { id } });
} catch (e: any) {
  if (e.code === "P2025") return res.status(404).json({ error: "Not found" });
  if (e.code === "P2003") return res.status(400).json({ error: "Related record exists" });
  throw e;
}
```

## Required Changes in server/index.ts

1. **Import**: `import prisma from "./prisma";` (already done)
2. **Remove lowdb imports** (already done)
3. **Update every endpoint**:
   - Make async
   - Replace db.data queries with prisma
   - Add error handling
4. **Update helper functions**:
   - `createOrderRecord` → async
   - `ensureCategory` → async
5. **Remove writeDb calls** (Prisma auto-saves)
6. **Test each endpoint** after migration

---

For full Prisma documentation, see: https://www.prisma.io/docs/orm/reference/prisma-client-reference
