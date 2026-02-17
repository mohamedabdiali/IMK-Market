// Super Admin Routes
import { Router } from "express";
import { z } from "zod";
import prisma from "../prisma.js";
import {
    authenticate,
    requireSuperAdmin,
    AuthRequest,
    createAuditLog,
    createNotification
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

        const bcrypt = require("bcryptjs");
        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: parsed.data.email,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
                tenantId: parsed.data.tenantId,
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

// ============================================
// ROLE MANAGEMENT (Global)
// ============================================

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

        // Notify seller
        await createNotification({
            userId: sellerProfile.userId,
            type: "seller_approved",
            title: "Seller Account Approved",
            message: "Congratulations! Your seller account has been approved. You can now start listing products.",
        });

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
            },
        });

        // Notify seller
        await createNotification({
            userId: sellerProfile.userId,
            type: "seller_rejected",
            title: "Seller Account Rejected",
            message: `Your seller account application has been rejected. Reason: ${parsed.data.reason}`,
        });

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
