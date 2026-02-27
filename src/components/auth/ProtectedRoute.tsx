import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAdmin, token, user, isSuperAdmin } = useAuth();

  if (!isAdmin || !token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user?.mustResetPassword && !isSuperAdmin) {
    return <Navigate to="/reset-password" replace />;
  }

  return <>{children}</>;
}
