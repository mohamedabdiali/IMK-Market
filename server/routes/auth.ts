// Enhanced Authentication Routes
import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import prisma from "../prisma.js";
import {
    generateToken,
    authenticate,
    AuthRequest,
    createAuditLog,
    notifySuperAdmins,
    notifyRole
} from "../auth-utils.js";

const router = Router();

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);
const CSRF_TOKEN_BYTES = 24;
const isProd = process.env.NODE_ENV === "production";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const generateTokenValue = (bytes = 48) => crypto.randomBytes(bytes).toString("hex");

const parseCookies = (cookieHeader?: string) => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;
    const parts = cookieHeader.split(";");
    for (const part of parts) {
        const [name, ...rest] = part.trim().split("=");
        if (!name) continue;
        cookies[name] = decodeURIComponent(rest.join("="));
    }
    return cookies;
};

const buildCookie = (name: string, value: string, options: {
    maxAge?: number;
    path?: string;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    secure?: boolean;
}) => {
    const segments = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge !== undefined) segments.push(`Max-Age=${options.maxAge}`);
    if (options.path) segments.push(`Path=${options.path}`);
    if (options.httpOnly) segments.push("HttpOnly");
    if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
    if (options.secure) segments.push("Secure");
    return segments.join("; ");
};

const setAuthCookies = (res: Response, refreshToken: string, csrfToken: string) => {
    const maxAge = REFRESH_TOKEN_DAYS * 24 * 60 * 60;
    const cookies = [
        buildCookie("refresh_token", refreshToken, {
            maxAge,
            path: "/api/auth",
            httpOnly: true,
            sameSite: "Strict",
            secure: isProd,
        }),
        buildCookie("csrf_token", csrfToken, {
            maxAge,
            path: "/",
            sameSite: "Strict",
            secure: isProd,
        }),
    ];
    res.setHeader("Set-Cookie", cookies);
};

const clearAuthCookies = (res: Response) => {
    const cookies = [
        buildCookie("refresh_token", "", { maxAge: 0, path: "/api/auth", httpOnly: true, sameSite: "Strict", secure: isProd }),
        buildCookie("csrf_token", "", { maxAge: 0, path: "/", sameSite: "Strict", secure: isProd }),
    ];
    res.setHeader("Set-Cookie", cookies);
};

const getCookie = (req: Request, name: string) => {
    const cookies = parseCookies(req.headers?.cookie as string | undefined);
    return cookies[name];
};

const requireCsrf = (req: Request, res: Response): boolean => {
    const csrfHeader = (req.headers["x-csrf-token"] || "").toString();
    const csrfCookie = getCookie(req, "csrf_token");
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        res.status(403).json({ error: "CSRF token invalid" });
        return false;
    }
    return true;
};

const issueRefreshToken = async (userId: string) => {
    const refreshToken = generateTokenValue();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });
    return refreshToken;
};

const rotateRefreshToken = async (existingToken: string) => {
    const tokenHash = hashToken(existingToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        return null;
    }
    const newToken = generateTokenValue();
    const newHash = hashToken(newToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    const replacement = await prisma.refreshToken.create({
        data: {
            userId: stored.userId,
            tokenHash: newHash,
            expiresAt,
        },
    });
    await prisma.refreshToken.update({
        where: { id: stored.id },
        data: {
            revokedAt: new Date(),
            replacedById: replacement.id,
        },
    });
    return { token: newToken, userId: stored.userId };
};

const DEFAULT_TENANT_NAME = process.env.PUBLIC_TENANT_NAME || "IMK-Market";
let cachedTenantId: string | null = null;
const getDefaultTenantId = async () => {
    if (cachedTenantId) return cachedTenantId;
    const tenant = await prisma.tenant.findUnique({ where: { name: DEFAULT_TENANT_NAME } });
    cachedTenantId = tenant?.id ?? null;
    return cachedTenantId;
};

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

        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            await createAuditLog({
                userId: user.id,
                action: "login_failed",
                resource: "super_admin",
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

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
            csrfToken,
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

        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            await createAuditLog({
                userId: user.id,
                tenantId: user.tenantId || undefined,
                action: "login_failed",
                resource: "admin",
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        await createAuditLog({
            userId: user.id,
            tenantId: user.tenantId || undefined,
            action: "login",
            resource: "admin",
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ token, user: authUser, csrfToken });
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

        const tenantId = await getDefaultTenantId();

        // Create user
        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsed.data.email,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
                tenantId: tenantId || undefined,
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
                    tenantId: tenantId || undefined,
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

        await prisma.sellerStatus.create({
            data: {
                sellerId: sellerProfile.id,
                status: "pending",
                note: "Registration submitted",
            },
        });

        await createAuditLog({
            userId: user.id,
            tenantId: tenantId || undefined,
            action: "create",
            resource: "seller_registration",
            resourceId: sellerProfile.id,
            changes: parsed.data,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
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

        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            await createAuditLog({
                userId: user.id,
                tenantId: user.tenantId || undefined,
                action: "login_failed",
                resource: "seller",
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });
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

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        res.json({
            token,
            user: authUser,
            sellerProfile: user.sellerProfile,
            csrfToken,
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

        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }

        const passwordValid = bcrypt.compareSync(parsed.data.password, user.passwordHash);
        if (!passwordValid) {
            await createAuditLog({
                userId: user.id,
                tenantId: user.tenantId || undefined,
                action: "login_failed",
                resource: "customer",
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            });
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        res.json({ token, user: authUser, csrfToken });
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

        const tenantId = await getDefaultTenantId();

        // Create user
        const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: parsed.data.email || `customer_${Date.now()}@imkmarket.local`,
                passwordHash,
                name: parsed.data.name,
                phone: parsed.data.phone,
                tenantId: tenantId || undefined,
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
                    tenantId: tenantId || undefined,
                },
            });
        }

        const { token, user: authUser } = await generateToken(user.id);

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        res.status(201).json({
            token,
            user: authUser,
            csrfToken,
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

router.post("/refresh", async (req, res) => {
    try {
        if (!requireCsrf(req, res)) return;
        const refreshToken = getCookie(req, "refresh_token");
        if (!refreshToken) {
            return res.status(401).json({ error: "Missing refresh token" });
        }

        const rotated = await rotateRefreshToken(refreshToken);
        if (!rotated) {
            clearAuthCookies(res);
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const user = await prisma.user.findUnique({ where: { id: rotated.userId } });
        if (!user || user.disabled) {
            clearAuthCookies(res);
            return res.status(403).json({ error: "Account disabled" });
        }

        const { token, user: authUser } = await generateToken(rotated.userId);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, rotated.token, csrfToken);

        res.json({ token, user: authUser, csrfToken });
    } catch (error) {
        console.error("Token refresh error:", error);
        res.status(500).json({ error: "Token refresh failed" });
    }
});

// ============================================
// SELLER GOOGLE OAUTH (Placeholder)
// ============================================

router.post("/seller/google", async (req, res) => {
    try {
        const schema = z.object({
            credential: z.string().min(10),
        });
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid Google credential" });
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            return res.status(501).json({ error: "Google OAuth not configured" });
        }

        const tokenInfoRes = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(parsed.data.credential)}`
        );
        if (!tokenInfoRes.ok) {
            return res.status(401).json({ error: "Google token verification failed" });
        }

        const tokenInfo = await tokenInfoRes.json() as {
            aud?: string;
            email?: string;
            email_verified?: string | boolean;
            name?: string;
        };

        if (!tokenInfo.email || tokenInfo.aud !== googleClientId) {
            return res.status(401).json({ error: "Google token invalid" });
        }

        if (tokenInfo.email_verified !== true && tokenInfo.email_verified !== "true") {
            return res.status(401).json({ error: "Google email not verified" });
        }

        const user = await prisma.user.findUnique({
            where: { email: tokenInfo.email },
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
            return res.status(404).json({
                error: "Seller account not found. Please register first.",
                status: "not_registered",
            });
        }

        if (user.disabled) {
            return res.status(403).json({ error: "Account disabled" });
        }

        if (user.sellerProfile.status === "pending") {
            return res.status(403).json({
                error: "Account pending approval",
                status: "pending",
            });
        }

        if (user.sellerProfile.status === "rejected") {
            return res.status(403).json({
                error: "Account has been rejected",
                status: "rejected",
                reason: user.sellerProfile.rejectionReason,
            });
        }

        if (user.sellerProfile.status === "suspended") {
            return res.status(403).json({
                error: "Account has been suspended",
                status: "suspended",
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                name: user.name || tokenInfo.name || undefined,
            },
        });

        const { token, user: authUser } = await generateToken(user.id);

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        res.json({
            token,
            user: authUser,
            sellerProfile: user.sellerProfile,
            csrfToken,
        });
    } catch (error) {
        console.error("Seller Google OAuth error:", error);
        res.status(500).json({ error: "Google login failed" });
    }
});

// ============================================
// LOGOUT
// ============================================

router.post("/logout", async (req, res) => {
    try {
        if (!requireCsrf(req, res)) return;
        const refreshToken = getCookie(req, "refresh_token");
        if (refreshToken) {
            const tokenHash = hashToken(refreshToken);
            await prisma.refreshToken.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        clearAuthCookies(res);
        res.json({ success: true });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Logout failed" });
    }
});

// ============================================
// PASSWORD RESET (FORCED OR USER-INITIATED)
// ============================================

router.post("/password/reset", authenticate, async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const schema = z.object({
            currentPassword: z.string().min(6).optional(),
            newPassword: z.string().min(8),
        });

        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.mustResetPassword) {
            if (!parsed.data.currentPassword) {
                return res.status(400).json({ error: "Current password required" });
            }
            const passwordValid = bcrypt.compareSync(parsed.data.currentPassword, user.passwordHash);
            if (!passwordValid) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }
        }

        const newHash = bcrypt.hashSync(parsed.data.newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: newHash,
                mustResetPassword: false,
                passwordUpdatedAt: new Date(),
                lastPasswordResetAt: new Date(),
            },
        });

        await prisma.refreshToken.updateMany({
            where: { userId: user.id, revokedAt: null },
            data: { revokedAt: new Date() },
        });

        const { token, user: authUser } = await generateToken(user.id);
        const refreshToken = await issueRefreshToken(user.id);
        const csrfToken = generateTokenValue(CSRF_TOKEN_BYTES);
        setAuthCookies(res, refreshToken, csrfToken);

        await createAuditLog({
            userId: user.id,
            tenantId: user.tenantId || undefined,
            action: "password_reset",
            resource: "auth",
            resourceId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        res.json({ token, user: authUser, csrfToken });
    } catch (error) {
        console.error("Password reset error:", error);
        res.status(500).json({ error: "Password reset failed" });
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
            username: user.username,
            name: user.name,
            phone: user.phone,
            tenantId: user.tenantId,
            isSuperAdmin: user.isSuperAdmin,
            mustResetPassword: user.mustResetPassword,
            disabled: user.disabled,
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
