// Seller Routes
import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma";
import {
    authenticate,
    AuthRequest,
    isSeller,
    createAuditLog,
    createNotification,
    notifyRole
} from "../auth-utils";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// SELLER PROFILE
// ============================================

router.get("/profile", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                    },
                },
            },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        res.json(sellerProfile);
    } catch (error) {
        console.error("Get seller profile error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

router.patch("/profile", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const schema = z.object({
            businessName: z.string().min(2).optional(),
            ownerName: z.string().min(2).optional(),
            phone: z.string().min(6).optional(),
            businessAddress: z.string().min(10).optional(),
            productCategory: z.string().min(2).optional(),
            description: z.string().min(20).optional(),
            tradeLicense: z.string().optional(),
            emiratesId: z.string().optional(),
            bankDetails: z.object({
                accountName: z.string(),
                accountNumber: z.string(),
                bankName: z.string(),
                iban: z.string().optional(),
                swiftCode: z.string().optional(),
            }).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const sellerProfile = await prisma.sellerProfile.update({
            where: { userId: req.user.userId },
            data: {
                ...parsed.data,
                bankDetails: parsed.data.bankDetails
                    ? JSON.stringify(parsed.data.bankDetails)
                    : undefined,
            },
        });

        await createAuditLog({
            userId: req.user.userId,
            action: "update",
            resource: "seller_profile",
            resourceId: sellerProfile.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(sellerProfile);
    } catch (error) {
        console.error("Update seller profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// ============================================
// SELLER PRODUCTS
// ============================================

router.get("/products", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        const products = await prisma.product.findMany({
            where: { sellerId: sellerProfile.id },
            include: {
                category: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(products);
    } catch (error) {
        console.error("Get seller products error:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

router.post("/products", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        if (sellerProfile.status !== "active") {
            return res.status(403).json({ error: "Seller account not active" });
        }

        const schema = z.object({
            name: z.string().min(2),
            description: z.string().min(10),
            price: z.number().positive(),
            originalPrice: z.number().positive().optional(),
            categoryId: z.string(),
            images: z.array(z.string()).min(1),
            stock: z.number().int().min(0).default(0),
            lowStockThreshold: z.number().int().min(0).default(10),
            freeShipping: z.boolean().default(false),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const product = await prisma.product.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description,
                price: parsed.data.price,
                originalPrice: parsed.data.originalPrice,
                categoryId: parsed.data.categoryId,
                image: parsed.data.images[0],
                images: parsed.data.images,
                stock: parsed.data.stock,
                lowStockThreshold: parsed.data.lowStockThreshold,
                freeShipping: parsed.data.freeShipping,
                sellerId: sellerProfile.id,
                tenantId: req.user.tenantId || undefined,
                sku: `SELLER-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                inStock: parsed.data.stock > 0,
                status: "active",
                lastRestocked: new Date(),
            },
        });

        await createAuditLog({
            userId: req.user.userId,
            action: "create",
            resource: "product",
            resourceId: product.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(201).json(product);
    } catch (error) {
        console.error("Create seller product error:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
});

router.patch("/products/:id", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        // Verify product ownership
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        if (product.sellerId !== sellerProfile.id) {
            return res.status(403).json({ error: "Not authorized to edit this product" });
        }

        const schema = z.object({
            name: z.string().min(2).optional(),
            description: z.string().min(10).optional(),
            price: z.number().positive().optional(),
            originalPrice: z.number().positive().optional(),
            images: z.array(z.string()).min(1).optional(),
            categoryId: z.string().optional(),
            stock: z.number().int().min(0).optional(),
            lowStockThreshold: z.number().int().min(0).optional(),
            freeShipping: z.boolean().optional(),
            status: z.enum(["active", "inactive"]).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: req.params.id },
            data: {
                ...parsed.data,
                image: parsed.data.images ? parsed.data.images[0] : undefined,
                inStock: parsed.data.stock !== undefined ? parsed.data.stock > 0 : undefined,
            },
        });

        await createAuditLog({
            userId: req.user.userId,
            action: "update",
            resource: "product",
            resourceId: updatedProduct.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error("Update seller product error:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});

router.delete("/products/:id", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        // Verify product ownership
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
        });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        if (product.sellerId !== sellerProfile.id) {
            return res.status(403).json({ error: "Not authorized to delete this product" });
        }

        await prisma.product.delete({
            where: { id: req.params.id },
        });

        await createAuditLog({
            userId: req.user.userId,
            action: "delete",
            resource: "product",
            resourceId: req.params.id,
            changes: { name: product.name },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete seller product error:", error);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// ============================================
// SELLER ORDERS
// ============================================

router.get("/orders", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        // Get all products by this seller
        const sellerProducts = await prisma.product.findMany({
            where: { sellerId: sellerProfile.id },
            select: { id: true },
        });

        const productIds = sellerProducts.map(p => p.id);

        // Get orders containing seller's products
        const orders = await prisma.order.findMany({
            where: {
                items: {
                    some: {
                        productId: {
                            in: productIds,
                        },
                    },
                },
            },
            include: {
                items: {
                    where: {
                        productId: {
                            in: productIds,
                        },
                    },
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(orders);
    } catch (error) {
        console.error("Get seller orders error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// ============================================
// SELLER ANALYTICS
// ============================================

router.get("/analytics", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: req.user.userId },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller profile not found" });
        }

        const [
            totalProducts,
            activeProducts,
            lowStockProducts,
        ] = await Promise.all([
            prisma.product.count({ where: { sellerId: sellerProfile.id } }),
            prisma.product.count({
                where: { sellerId: sellerProfile.id, status: "active" }
            }),
            prisma.product.count({
                where: {
                    sellerId: sellerProfile.id,
                    stock: {
                        lte: 5, // Fallback to hardcoded threshold for simplicity or use a raw query if dynamic is needed
                    },
                },
            }),
        ]);

        // Get seller products
        const sellerProducts = await prisma.product.findMany({
            where: { sellerId: sellerProfile.id },
            select: { id: true },
        });

        const productIds = sellerProducts.map(p => p.id);

        // Get order items for seller products
        const orderItems = await prisma.orderItem.findMany({
            where: {
                productId: {
                    in: productIds,
                },
            },
        });

        const totalRevenue = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalOrders = new Set(orderItems.map(item => item.orderId)).size;

        res.json({
            totalProducts,
            activeProducts,
            lowStockProducts,
            totalOrders,
            totalRevenue,
        });
    } catch (error) {
        console.error("Get seller analytics error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

export default router;
