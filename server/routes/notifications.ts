// Notification Routes
import { Router } from "express";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../auth-utils";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// GET USER NOTIFICATIONS
// ============================================

router.get("/", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const unreadOnly = req.query.unread === "true";
        const limit = parseInt(req.query.limit as string) || 50;

        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.user.userId,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId: req.user.userId,
                read: false,
            },
        });

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// ============================================
// MARK AS READ
// ============================================

router.patch("/:id/read", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        if (notification.userId !== req.user.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const updated = await prisma.notification.update({
            where: { id: req.params.id },
            data: { read: true },
        });

        res.json(updated);
    } catch (error) {
        console.error("Mark notification as read error:", error);
        res.status(500).json({ error: "Failed to mark as read" });
    }
});

// ============================================
// MARK ALL AS READ
// ============================================

router.patch("/read-all", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await prisma.notification.updateMany({
            where: {
                userId: req.user.userId,
                read: false,
            },
            data: { read: true },
        });

        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ error: "Failed to mark all as read" });
    }
});

// ============================================
// DELETE NOTIFICATION
// ============================================

router.delete("/:id", async (req: AuthRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: req.params.id },
        });

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        if (notification.userId !== req.user.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await prisma.notification.delete({
            where: { id: req.params.id },
        });

        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

export default router;
