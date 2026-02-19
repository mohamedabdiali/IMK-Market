// Super Admin Routes
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../prisma.js";
import {
    authenticate,
    requireSuperAdmin,
    AuthRequest,
    createAuditLog,
    createNotification,
    notifyRole
} from "../auth-utils.js";

const router = Router();

// All routes require super admin access
router.use(authenticate, requireSuperAdmin);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

router.get("/dashboard", async (req: AuthRequest, res) => {
    try {
        const [
            totalTenants,
            activeTenants,
            totalUsers,
            totalSellers,
            pendingSellers,
            totalProducts,
            totalOrders,
            totalRevenue,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { subscriptionStatus: "active" } }),
            prisma.user.count(),
            prisma.sellerProfile.count(),
            prisma.sellerProfile.count({ where: { status: "pending" } }),
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { total: true } }),
        ]);

        res.json({
            totalTenants,
            activeTenants,
            totalUsers,
            totalSellers,
            pendingSellers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.total || 0,
        });
    } catch (error) {
        console.error("Super admin dashboard error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// ============================================
// TENANT MANAGEMENT
// ============================================

router.get("/tenants", async (req: AuthRequest, res) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        orders: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(tenants);
    } catch (error) {
        console.error("Get tenants error:", error);
        res.status(500).json({ error: "Failed to fetch tenants" });
    }
});

router.post("/tenants", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            name: z.string().min(2),
            subscriptionType: z.string(),
            modulesEnabled: z.array(z.string()).default([]),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const tenant = await prisma.tenant.create({
            data: {
                name: parsed.data.name,
                subscriptionType: parsed.data.subscriptionType,
                subscriptionStatus: "active",
                modulesEnabled: JSON.stringify(parsed.data.modulesEnabled),
            },
        });

        await prisma.subscription.create({
            data: {
                tenantId: tenant.id,
                planName: parsed.data.subscriptionType,
                status: "active",
                billingCycle: "monthly",
                currency: "USD",
            },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "create",
            resource: "tenant",
            resourceId: tenant.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(201).json(tenant);
    } catch (error) {
        console.error("Create tenant error:", error);
        res.status(500).json({ error: "Failed to create tenant" });
    }
});

router.patch("/tenants/:id", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            name: z.string().min(2).optional(),
            subscriptionType: z.string().optional(),
            subscriptionStatus: z.enum(["active", "suspended", "cancelled"]).optional(),
            modulesEnabled: z.array(z.string()).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const tenant = await prisma.tenant.update({
            where: { id: req.params.id },
            data: {
                ...parsed.data,
                modulesEnabled: parsed.data.modulesEnabled
                    ? JSON.stringify(parsed.data.modulesEnabled)
                    : undefined,
            },
        });

        if (parsed.data.subscriptionStatus || parsed.data.subscriptionType) {
            await prisma.subscription.updateMany({
                where: { tenantId: tenant.id },
                data: {
                    status: parsed.data.subscriptionStatus,
                    planName: parsed.data.subscriptionType,
                },
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "update",
            resource: "tenant",
            resourceId: tenant.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(tenant);
    } catch (error) {
        console.error("Update tenant error:", error);
        res.status(500).json({ error: "Failed to update tenant" });
    }
});

// ============================================
// SUBSCRIPTIONS
// ============================================

router.get("/subscriptions", async (_req: AuthRequest, res) => {
    try {
        const subs = await prisma.subscription.findMany({
            include: { tenant: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(subs);
    } catch (error) {
        console.error("Get subscriptions error:", error);
        res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
});

router.post("/subscriptions", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            tenantId: z.string(),
            planName: z.string().min(2),
            status: z.enum(["active", "suspended", "cancelled"]).default("active"),
            billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
            price: z.number().optional(),
            currency: z.string().optional(),
            endsAt: z.string().datetime().optional(),
            metadata: z.record(z.any()).optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        }

        const subscription = await prisma.subscription.create({
            data: {
                tenantId: parsed.data.tenantId,
                planName: parsed.data.planName,
                status: parsed.data.status,
                billingCycle: parsed.data.billingCycle,
                price: parsed.data.price,
                currency: parsed.data.currency ?? "USD",
                endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
                metadata: parsed.data.metadata ?? undefined,
            },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "create",
            resource: "subscription",
            resourceId: subscription.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(201).json(subscription);
    } catch (error) {
        console.error("Create subscription error:", error);
        res.status(500).json({ error: "Failed to create subscription" });
    }
});

router.patch("/subscriptions/:id", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            planName: z.string().min(2).optional(),
            status: z.enum(["active", "suspended", "cancelled"]).optional(),
            billingCycle: z.enum(["monthly", "yearly"]).optional(),
            price: z.number().optional(),
            currency: z.string().optional(),
            endsAt: z.string().datetime().optional(),
            metadata: z.record(z.any()).optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        }

        const subscription = await prisma.subscription.update({
            where: { id: req.params.id },
            data: {
                planName: parsed.data.planName,
                status: parsed.data.status,
                billingCycle: parsed.data.billingCycle,
                price: parsed.data.price,
                currency: parsed.data.currency,
                endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : undefined,
                metadata: parsed.data.metadata ?? undefined,
            },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "update",
            resource: "subscription",
            resourceId: subscription.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(subscription);
    } catch (error) {
        console.error("Update subscription error:", error);
        res.status(500).json({ error: "Failed to update subscription" });
    }
});

// ============================================
// TENANT ANALYTICS
// ============================================

router.get("/tenants/:id/analytics", async (req: AuthRequest, res) => {
    try {
        const tenantId = req.params.id;
        const [totalUsers, totalSellers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
            prisma.user.count({ where: { tenantId } }),
            prisma.sellerProfile.count({ where: { user: { tenantId } } }),
            prisma.product.count({ where: { tenantId } }),
            prisma.order.count({ where: { tenantId } }),
            prisma.order.aggregate({ where: { tenantId }, _sum: { total: true } }),
        ]);

        res.json({
            tenantId,
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.total || 0,
        });
    } catch (error) {
        console.error("Tenant analytics error:", error);
        res.status(500).json({ error: "Failed to fetch tenant analytics" });
    }
});

// ============================================
// USER MANAGEMENT (Cross-Tenant)
// ============================================

router.get("/users", async (req: AuthRequest, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                tenant: true,
                userRoles: {
                    include: {
                        role: true,
                    },
                },
                sellerProfile: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(users);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

router.post("/users", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            email: z.string().email(),
            password: z.string().min(8),
            username: z.string().min(3).optional(),
            name: z.string().optional(),
            phone: z.string().optional(),
            tenantId: z.string().optional(),
            roleIds: z.array(z.string()),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: parsed.data.email,
                username: parsed.data.username,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
                tenantId: parsed.data.tenantId,
                mustResetPassword: true,
                passwordUpdatedAt: new Date(),
            },
        });

        // Assign roles
        for (const roleId of parsed.data.roleIds) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId,
                    tenantId: parsed.data.tenantId,
                },
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "create",
            resource: "user",
            resourceId: user.id,
            changes: { email: parsed.data.email, roles: parsed.data.roleIds },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

router.delete("/users/:id", async (req: AuthRequest, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.isSuperAdmin) {
            return res.status(403).json({ error: "Cannot delete super admin" });
        }

        await prisma.user.delete({
            where: { id: req.params.id },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "delete",
            resource: "user",
            resourceId: req.params.id,
            changes: { email: user.email },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

router.patch("/users/:id/roles", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            roleIds: z.array(z.string()).min(1),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten(),
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await prisma.userRole.deleteMany({ where: { userId: user.id } });

        await prisma.userRole.createMany({
            data: parsed.data.roleIds.map((roleId) => ({
                userId: user.id,
                roleId,
                tenantId: user.tenantId || undefined,
            })),
        });

        await createAuditLog({
            userId: req.user!.userId,
            tenantId: user.tenantId || undefined,
            action: "update",
            resource: "user_roles",
            resourceId: user.id,
            changes: { roleIds: parsed.data.roleIds },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Update user roles error:", error);
        res.status(500).json({ error: "Failed to update user roles" });
    }
});

// ============================================
// ROLE MANAGEMENT (Global)
// ============================================

router.get("/permissions", async (_req: AuthRequest, res) => {
    try {
        const permissions = await prisma.permission.findMany({ orderBy: [{ resource: "asc" }, { action: "asc" }] });
        res.json(permissions);
    } catch (error) {
        console.error("Get permissions error:", error);
        res.status(500).json({ error: "Failed to fetch permissions" });
    }
});

router.get("/roles", async (req: AuthRequest, res) => {
    try {
        const roles = await prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
                _count: {
                    select: {
                        userRoles: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(roles);
    } catch (error) {
        console.error("Get roles error:", error);
        res.status(500).json({ error: "Failed to fetch roles" });
    }
});

router.post("/roles", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            name: z.string().min(2),
            description: z.string().optional(),
            tenantId: z.string().optional(),
            permissionIds: z.array(z.string()).default([]),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten()
            });
        }

        const role = await prisma.role.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description,
                tenantId: parsed.data.tenantId,
                isSystemRole: false,
            },
        });

        // Assign permissions
        for (const permissionId of parsed.data.permissionIds) {
            await prisma.rolePermission.create({
                data: {
                    roleId: role.id,
                    permissionId,
                },
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "create",
            resource: "role",
            resourceId: role.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.status(201).json(role);
    } catch (error) {
        console.error("Create role error:", error);
        res.status(500).json({ error: "Failed to create role" });
    }
});

router.patch("/roles/:id", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            name: z.string().min(2).optional(),
            description: z.string().optional(),
            permissionIds: z.array(z.string()).optional(),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid data",
                details: parsed.error.flatten(),
            });
        }

        const role = await prisma.role.findUnique({ where: { id: req.params.id } });
        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        if (role.isSystemRole && parsed.data.name && parsed.data.name !== role.name) {
            return res.status(403).json({ error: "Cannot rename system role" });
        }

        const updatedRole = await prisma.role.update({
            where: { id: role.id },
            data: {
                name: parsed.data.name ?? undefined,
                description: parsed.data.description ?? undefined,
            },
        });

        if (parsed.data.permissionIds) {
            await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
            await prisma.rolePermission.createMany({
                data: parsed.data.permissionIds.map((permissionId) => ({
                    roleId: role.id,
                    permissionId,
                })),
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "update",
            resource: "role",
            resourceId: role.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(updatedRole);
    } catch (error) {
        console.error("Update role error:", error);
        res.status(500).json({ error: "Failed to update role" });
    }
});

router.delete("/roles/:id", async (req: AuthRequest, res) => {
    try {
        const role = await prisma.role.findUnique({
            where: { id: req.params.id },
        });

        if (!role) {
            return res.status(404).json({ error: "Role not found" });
        }

        if (role.isSystemRole) {
            return res.status(403).json({ error: "Cannot delete system role" });
        }

        await prisma.role.delete({
            where: { id: req.params.id },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "delete",
            resource: "role",
            resourceId: req.params.id,
            changes: { name: role.name },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Delete role error:", error);
        res.status(500).json({ error: "Failed to delete role" });
    }
});

// ============================================
// SELLER APPROVALS
// ============================================

router.get("/sellers/pending", async (req: AuthRequest, res) => {
    try {
        const pendingSellers = await prisma.sellerProfile.findMany({
            where: { status: "pending" },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(pendingSellers);
    } catch (error) {
        console.error("Get pending sellers error:", error);
        res.status(500).json({ error: "Failed to fetch pending sellers" });
    }
});

router.post("/sellers/:id/approve", async (req: AuthRequest, res) => {
    try {
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { id: req.params.id },
            include: { user: true },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller not found" });
        }

        const updatedProfile = await prisma.sellerProfile.update({
            where: { id: req.params.id },
            data: {
                status: "active",
                approvedAt: new Date(),
                approvedBy: req.user!.userId,
            },
        });

        await prisma.sellerStatus.create({
            data: {
                sellerId: sellerProfile.id,
                status: "active",
                note: "Approved by super admin",
                changedBy: req.user!.userId,
            },
        });

        // Notify seller
        await createNotification({
            userId: sellerProfile.userId,
            type: "seller_approved",
            title: "Seller Account Approved",
            message: "Congratulations! Your seller account has been approved. You can now start listing products.",
        });

        if (sellerProfile.user?.tenantId) {
            await notifyRole({
                roleName: "Manager",
                tenantId: sellerProfile.user.tenantId,
                type: "seller_approved",
                title: "Seller Approved",
                message: `${sellerProfile.businessName} has been approved.`,
                data: { sellerId: sellerProfile.id },
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "approve",
            resource: "seller",
            resourceId: req.params.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error("Approve seller error:", error);
        res.status(500).json({ error: "Failed to approve seller" });
    }
});

router.post("/sellers/:id/reject", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            reason: z.string().min(10),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Rejection reason required",
                details: parsed.error.flatten()
            });
        }

        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { id: req.params.id },
            include: { user: true },
        });

        if (!sellerProfile) {
            return res.status(404).json({ error: "Seller not found" });
        }

        const updatedProfile = await prisma.sellerProfile.update({
            where: { id: req.params.id },
            data: {
                status: "rejected",
                rejectionReason: parsed.data.reason,
                approvedBy: req.user!.userId,
            },
        });

        await prisma.sellerStatus.create({
            data: {
                sellerId: sellerProfile.id,
                status: "rejected",
                note: parsed.data.reason,
                changedBy: req.user!.userId,
            },
        });

        // Notify seller
        await createNotification({
            userId: sellerProfile.userId,
            type: "seller_rejected",
            title: "Seller Account Rejected",
            message: `Your seller account application has been rejected. Reason: ${parsed.data.reason}`,
        });

        if (sellerProfile.user?.tenantId) {
            await notifyRole({
                roleName: "Manager",
                tenantId: sellerProfile.user.tenantId,
                type: "seller_rejected",
                title: "Seller Rejected",
                message: `${sellerProfile.businessName} was rejected.`,
                data: { sellerId: sellerProfile.id },
            });
        }

        await createAuditLog({
            userId: req.user!.userId,
            action: "reject",
            resource: "seller",
            resourceId: req.params.id,
            changes: { reason: parsed.data.reason },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(updatedProfile);
    } catch (error) {
        console.error("Reject seller error:", error);
        res.status(500).json({ error: "Failed to reject seller" });
    }
});

// ============================================
// SYSTEM SETTINGS & FEATURE TOGGLES
// ============================================

router.get("/system/settings", async (_req: AuthRequest, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
        res.json(settings);
    } catch (error) {
        console.error("Get system settings error:", error);
        res.status(500).json({ error: "Failed to fetch system settings" });
    }
});

router.put("/system/settings/:key", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            value: z.any(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key: req.params.key },
            update: {
                value: parsed.data.value,
                updatedBy: req.user!.userId,
            },
            create: {
                key: req.params.key,
                value: parsed.data.value,
                updatedBy: req.user!.userId,
            },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "update",
            resource: "system_setting",
            resourceId: setting.id,
            changes: { key: setting.key },
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(setting);
    } catch (error) {
        console.error("Update system setting error:", error);
        res.status(500).json({ error: "Failed to update system setting" });
    }
});

router.get("/feature-toggles", async (_req: AuthRequest, res) => {
    try {
        const toggles = await prisma.featureToggle.findMany({ orderBy: { key: "asc" } });
        res.json(toggles);
    } catch (error) {
        console.error("Get feature toggles error:", error);
        res.status(500).json({ error: "Failed to fetch feature toggles" });
    }
});

router.patch("/feature-toggles/:key", async (req: AuthRequest, res) => {
    try {
        const schema = z.object({
            enabled: z.boolean(),
            description: z.string().optional(),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        }

        const toggle = await prisma.featureToggle.upsert({
            where: { key: req.params.key },
            update: {
                enabled: parsed.data.enabled,
                description: parsed.data.description,
                updatedBy: req.user!.userId,
            },
            create: {
                key: req.params.key,
                enabled: parsed.data.enabled,
                description: parsed.data.description,
                updatedBy: req.user!.userId,
            },
        });

        await createAuditLog({
            userId: req.user!.userId,
            action: "update",
            resource: "feature_toggle",
            resourceId: toggle.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json(toggle);
    } catch (error) {
        console.error("Update feature toggle error:", error);
        res.status(500).json({ error: "Failed to update feature toggle" });
    }
});

// ============================================
// AUDIT LOGS
// ============================================

router.get("/audit-logs", async (req: AuthRequest, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.auditLog.count(),
        ]);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
});

export default router;
