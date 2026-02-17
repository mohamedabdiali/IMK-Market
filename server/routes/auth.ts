// Enhanced Authentication Routes
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "./prisma";
import {
    generateToken,
    authenticate,
    AuthRequest,
    createAuditLog,
    notifySuperAdmins,
    notifyRole,
    createNotification
} from "./auth-utils";

const router = Router();

// ============================================
// SUPER ADMIN LOGIN
// ============================================

router.post("/super-admin/login", async (req, res) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
        });

        if (!user || !user.isSuperAdmin) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await createAuditLog({
            userId: user.id,
            action: "login",
            resource: "super_admin",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({
            token,
            user: authUser,
            message: "Super admin login successful"
        });
    } catch (error) {
        console.error("Super admin login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ============================================
// ADMIN LOGIN (Enhanced)
// ============================================

router.post("/admin/login", async (req, res) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            include: {
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await createAuditLog({
            userId: user.id,
            tenantId: user.tenantId || undefined,
            action: "login",
            resource: "admin",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ token, user: authUser });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ============================================
// SELLER REGISTRATION
// ============================================

router.post("/seller/register", async (req, res) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(2),
            phone: z.string().min(6),
            businessName: z.string().min(2),
            ownerName: z.string().min(2),
            businessAddress: z.string().min(10),
            productCategory: z.string().min(2),
            description: z.string().min(20),
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

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: parsed.data.email },
        });

        if (existingUser) {
            return res.status(409).json({ error: "Email already registered" });
        }

        // Create user
        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsed.data.email,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
            },
        });

        // Assign Seller role
        const sellerRole = await prisma.role.findFirst({
            where: { name: "Seller", tenantId: null },
        });

        if (sellerRole) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: sellerRole.id,
                },
            });
        }

        // Create seller profile
        const sellerProfile = await prisma.sellerProfile.create({
            data: {
                userId: user.id,
                businessName: parsed.data.businessName,
                ownerName: parsed.data.ownerName,
                phone: parsed.data.phone,
                businessAddress: parsed.data.businessAddress,
                productCategory: parsed.data.productCategory,
                description: parsed.data.description,
                tradeLicense: parsed.data.tradeLicense,
                emiratesId: parsed.data.emiratesId,
                bankDetails: parsed.data.bankDetails ? JSON.stringify(parsed.data.bankDetails) : undefined,
                status: "pending",
            },
        });

        // Notify super admins
        await notifySuperAdmins({
            type: "seller_registration",
            title: "New Seller Registration",
            message: `${parsed.data.businessName} has registered and is awaiting approval`,
            data: { sellerId: sellerProfile.id, userId: user.id },
        });

        // Notify IMK-Market managers
        const imkTenant = await prisma.tenant.findUnique({
            where: { name: "IMK-Market" },
        });

        if (imkTenant) {
            await notifyRole({
                roleName: "Manager",
                tenantId: imkTenant.id,
                type: "seller_registration",
                title: "New Seller Registration",
                message: `${parsed.data.businessName} has registered and is awaiting approval`,
                data: { sellerId: sellerProfile.id },
            });
        }

        res.status(201).json({
            message: "Registration successful. Your account is pending approval.",
            userId: user.id,
            sellerId: sellerProfile.id,
            status: "pending",
        });
    } catch (error) {
        console.error("Seller registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ============================================
// SELLER LOGIN
// ============================================

router.post("/seller/login", async (req, res) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
            include: {
                sellerProfile: true,
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user || !user.sellerProfile) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Check seller status
        if (user.sellerProfile.status === "pending") {
            return res.status(403).json({
                error: "Account pending approval",
                status: "pending"
            });
        }

        if (user.sellerProfile.status === "rejected") {
            return res.status(403).json({
                error: "Account has been rejected",
                status: "rejected",
                reason: user.sellerProfile.rejectionReason
            });
        }

        if (user.sellerProfile.status === "suspended") {
            return res.status(403).json({
                error: "Account has been suspended",
                status: "suspended"
            });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        res.json({
            token,
            user: authUser,
            sellerProfile: user.sellerProfile
        });
    } catch (error) {
        console.error("Seller login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ============================================
// CUSTOMER LOGIN (Enhanced)
// ============================================

router.post("/customer/login", async (req, res) => {
    try {
        const schema = z.object({
            phone: z.string().min(6),
            password: z.string().min(6),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Find user by phone
        const user = await prisma.user.findFirst({
            where: { phone: parsed.data.phone },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        res.json({ token, user: authUser });
    } catch (error) {
        console.error("Customer login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// ============================================
// CUSTOMER REGISTRATION (Enhanced)
// ============================================

router.post("/customer/register", async (req, res) => {
    try {
        const schema = z.object({
            email: z.string().email().optional(),
            phone: z.string().min(6),
            password: z.string().min(6),
            name: z.string().min(2).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        // Check if phone already exists
        const existingUser = await prisma.user.findFirst({
            where: { phone: parsed.data.phone },
        });

        if (existingUser) {
            return res.status(409).json({ error: "Phone number already registered" });
        }

        // Create user
        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsed.data.email || `customer_${Date.now()}@imkmarket.local`,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
            },
        });

        // Assign Customer role
        const customerRole = await prisma.role.findFirst({
            where: { name: "Customer", tenantId: null },
        });

        if (customerRole) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: customerRole.id,
                },
            });
        }

        const { token, user: authUser } = await generateToken(user.id);

        res.status(201).json({
            token,
            user: authUser,
            message: "Registration successful"
        });
    } catch (error) {
        console.error("Customer registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// ============================================
// TOKEN REFRESH
// ============================================

router.post("/refresh", authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { token, user } = await generateToken(req.user.userId);

        res.json({ token, user });
    } catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({ error: "Token refresh failed" });
    }
});

// ============================================
// GET CURRENT USER
// ============================================

router.get("/me", authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                sellerProfile: true,
                userRoles: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            tenantId: user.tenantId,
            isSuperAdmin: user.isSuperAdmin,
            roles: req.user.roles,
            permissions: req.user.permissions,
            sellerProfile: user.sellerProfile,
        });
    } catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
});

export default router;
