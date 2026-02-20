import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  BarChart3,
  Mail,
  FolderTree,
  ListPlus,
  Upload,
  ArrowLeft,
  LogOut,
  Shield,
  Flame,
  Megaphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Product Approvals", path: "/admin/products" },
  { icon: ListPlus, label: "Product Management", path: "/admin/product-management" },
  { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
  { icon: Boxes, label: "Inventory", path: "/admin/inventory" },
  { icon: FolderTree, label: "Categories", path: "/admin/categories" },
  { icon: Flame, label: "Flash Deals", path: "/admin/flash-deals" },
  { icon: Megaphone, label: "Flash Ads", path: "/admin/flash-ads" },
  { icon: Upload, label: "Bulk Ops", path: "/admin/bulk-operations", roles: ["Super Admin", "Manager"] },
  { icon: Mail, label: "Email", path: "/admin/email", roles: ["Super Admin", "Manager"] },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics", roles: ["Super Admin", "Manager"] },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, isSuperAdmin, hasRole } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 bg-navy text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold text-gold">IMK-MARKET</h1>
        <p className="text-sm text-white/60 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {isSuperAdmin && (
            <li key="super-admin">
              <Link
                to="/super-admin"
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-gold hover:bg-white/10"
              >
                <Shield className="h-5 w-5" />
                Platform Admin
              </Link>
              <div className="h-px bg-white/10 my-2 mx-4" />
            </li>
          )}
          {menuItems.filter(item => !item.roles || hasRole(...item.roles)).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-gold text-navy font-semibold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        {user && (
          <p className="px-4 py-2 text-sm text-white/60 truncate">{user.email}</p>
        )}
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
