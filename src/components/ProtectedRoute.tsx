import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
    requireSuperAdmin?: boolean;
    requireAdmin?: boolean;
    requireSeller?: boolean;
    requirePermission?: { resource: string; action: string };
    requireRole?: string | string[];
    allowPasswordReset?: boolean;
}

export function ProtectedRoute({
    children,
    requireSuperAdmin,
    requireAdmin,
    requireSeller,
    requirePermission,
    requireRole,
    allowPasswordReset,
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isSuperAdmin, isAdmin, isSeller, hasPermission, hasRole } = useAuth();

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.mustResetPassword && !allowPasswordReset && !isSuperAdmin) {
        return <Navigate to="/reset-password" replace />;
    }

    // Check super admin requirement
    if (requireSuperAdmin && !isSuperAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin && !isSuperAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check seller requirement
    if (requireSeller && !isSeller && !isSuperAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check specific permission
    if (requirePermission && !hasPermission(requirePermission.resource, requirePermission.action)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Check role requirement
    if (requireRole) {
        const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
        if (!hasRole(...roles)) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
}
