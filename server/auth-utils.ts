// Authentication and Authorization Utilities
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

// ============================================
// TYPES
// ============================================

export interface AuthUser {
    userId: string;
    email: string;
    username?: string;
    tenantId?: string;
    roles: string[];
    permissions: { resource: string; action: string }[];
    isSuperAdmin: boolean;
    mustResetPassword?: boolean;
    disabled?: boolean;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

// ============================================
// JWT UTILITIES
// ============================================

export async function generateToken(userId: string): Promise<{ token: string; user: AuthUser }> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Collect all roles
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Collect all unique permissions
    const permissionsSet = new Set<string>();
    const permissions: { resource: string; action: string }[] = [];

    const userRoles = user.userRoles;
    for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.rolePermissions) {
            const key = `${rolePermission.permission.resource}:${rolePermission.permission.action}`;
            if (!permissionsSet.has(key)) {
                permissionsSet.add(key);
                permissions.push({
                    resource: rolePermission.permission.resource,
                    action: rolePermission.permission.action,
                });
            }
        }
    }

    const authUser: AuthUser = {
        userId: user.id,
        email: user.email,
        username: user.username ?? undefined,
        tenantId: user.tenantId ?? undefined,
        roles,
        permissions,
        isSuperAdmin: Boolean(user.isSuperAdmin),
        mustResetPassword: Boolean(user.mustResetPassword),
        disabled: Boolean(user.disabled),
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: "12h" });

    return { token, user: authUser };
}

export function verifyToken(token: string): AuthUser {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error) {
        throw new Error("Invalid token");
    }
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Authenticate user from JWT token
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    try {
        const user = verifyToken(token);
        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }
        req.user = user;
        const allowlist = [
            "/api/auth/password/reset",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/auth/me",
        ];
        if (user.mustResetPassword && !allowlist.some((path) => req.originalUrl.startsWith(path))) {
            return res.status(403).json({ error: "Password reset required" });
        }
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/**
 * Require super admin access
 */
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.user.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
    }

    next();
}

/**
 * Require specific permission
 */
export function requirePermission(resource: string, action: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Super admin has all permissions
        if (req.user.isSuperAdmin) {
            return next();
        }

        // Check if user has the required permission
        const hasPermission = req.user.permissions.some(
            (p) => p.resource === resource && p.action === action
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: "Insufficient permissions",
                required: { resource, action }
            });
        }

        next();
    };
}

/**
 * Require tenant access (user must belong to the specified tenant)
 */
export function requireTenantAccess(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Super admin can access all tenants
    if (req.user.isSuperAdmin) {
        return next();
    }

    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

    if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
    }

    if (req.user.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this tenant" });
    }

    next();
}

/**
 * Apply tenant isolation to queries
 * Automatically filters queries by user's tenant
 */
export function getTenantFilter(req: AuthRequest): { tenantId?: string } {
    if (!req.user) {
        return {};
    }

    // Super admin sees all data
    if (req.user.isSuperAdmin) {
        return {};
    }

    // Regular users only see their tenant's data
    if (req.user.tenantId) {
        return { tenantId: req.user.tenantId };
    }

    return {};
}

// ============================================
// PERMISSION HELPERS
// ============================================

/**
 * Check if user has specific permission
 */
export function hasPermission(user: AuthUser, resource: string, action: string): boolean {
    if (user.isSuperAdmin) {
        return true;
    }

    return user.permissions.some((p) => p.resource === resource && p.action === action);
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(user: AuthUser, ...roleNames: string[]): boolean {
    if (user.isSuperAdmin) {
        return true;
    }

    return user.roles.some((role) => roleNames.includes(role));
}

/**
 * Check if user is seller
 */
export function isSeller(user: AuthUser): boolean {
    return hasRole(user, "Seller");
}

/**
 * Check if user is customer
 */
export function isCustomer(user: AuthUser): boolean {
    return hasRole(user, "Customer");
}

/**
 * Require seller access (seller role or super admin)
 */
export function requireSeller(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.isSuperAdmin || isSeller(req.user)) {
        return next();
    }
    return res.status(403).json({ error: "Seller access required" });
}

// ============================================
// AUDIT LOGGING
// ============================================

export async function createAuditLog(params: {
    userId: string;
    tenantId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: unknown;
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId,
                tenantId: params.tenantId,
                action: params.action,
                resource: params.resource,
                resourceId: params.resourceId,
                changes: params.changes ? JSON.stringify(params.changes) : undefined,
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw - audit logging should not break the main flow
    }
}

/**
 * Middleware to automatically log actions
 */
export function auditLog(resource: string, action: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next();
        }

        const resourceId = req.params.id || req.body.id;
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"];

        await createAuditLog({
            userId: req.user.userId,
            tenantId: req.user.tenantId,
            action,
            resource,
            resourceId,
            changes: req.body,
            ipAddress,
            userAgent,
        });

        next();
    };
}

// ============================================
// NOTIFICATION HELPERS
// ============================================

export async function createNotification(params: {
    userId: string;
    tenantId?: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
}) {
    try {
        await prisma.notification.create({
            data: {
                userId: params.userId,
                tenantId: params.tenantId,
                type: params.type,
                title: params.title,
                message: params.message,
                data: params.data ? JSON.stringify(params.data) : undefined,
            },
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
}

/**
 * Notify all users with specific role in a tenant
 */
export async function notifyRole(params: {
    roleName: string;
    tenantId?: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
}) {
    try {
        const role = await prisma.role.findFirst({
            where: {
                name: params.roleName,
                tenantId: params.tenantId || null,
            },
            include: {
                userRoles: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!role) {
            return;
        }

        for (const userRole of role.userRoles) {
            await createNotification({
                userId: userRole.user.id,
                tenantId: params.tenantId,
                type: params.type,
                title: params.title,
                message: params.message,
                data: params.data,
            });
        }
    } catch (error) {
        console.error("Failed to notify role:", error);
    }
}

/**
 * Notify all super admins
 */
export async function notifySuperAdmins(params: {
    type: string;
    title: string;
    message: string;
    data?: unknown;
}) {
    try {
        const superAdmins = await prisma.user.findMany({
            where: { isSuperAdmin: true },
        });

        for (const admin of superAdmins) {
            await createNotification({
                userId: admin.id,
                type: params.type,
                title: params.title,
                message: params.message,
                data: params.data,
            });
        }
    } catch (error) {
        console.error("Failed to notify super admins:", error);
    }
}
