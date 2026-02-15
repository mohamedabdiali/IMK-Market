import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export function AdminTopActions() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 mb-6">
      <Button asChild variant="outline" size="sm">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          logout();
          navigate("/admin/login");
        }}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </div>
  );
}
