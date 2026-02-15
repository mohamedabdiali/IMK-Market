import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAdmin, token } = useAuth();

  if (!isAdmin || !token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
