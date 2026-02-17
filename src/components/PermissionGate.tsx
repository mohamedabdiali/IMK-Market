import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";

interface PermissionGateProps {
    children: ReactNode;
    resource: string;
    action: string;
    fallback?: ReactNode;
}

export function PermissionGate({ children, resource, action, fallback = null }: PermissionGateProps) {
    const { hasPermission } = useAuth();

    if (!hasPermission(resource, action)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

interface RoleGateProps {
    children: ReactNode;
    roles: string | string[];
    fallback?: ReactNode;
}

export function RoleGate({ children, roles, fallback = null }: RoleGateProps) {
    const { hasRole } = useAuth();

    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(...roleArray)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
