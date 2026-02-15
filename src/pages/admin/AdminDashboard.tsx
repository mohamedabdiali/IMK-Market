import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { StatsCard } from "@/components/admin/StatsCard";
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AdminOrder, PendingProduct, InventoryItem } from "@/types/admin";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const { token } = useAuth();
  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.getAdminAnalytics(token || ""),
    enabled: Boolean(token),
  });
  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.getAdminOrders(token || ""),
    enabled: Boolean(token),
  });
  const pendingQuery = useQuery({
    queryKey: ["pending-products"],
    queryFn: () => api.getPendingProducts(token || ""),
    enabled: Boolean(token),
  });
  const inventoryQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(token || ""),
    enabled: Boolean(token),
  });

  const orders = (ordersQuery.data || []) as AdminOrder[];
  const pendingProducts = (pendingQuery.data || []) as PendingProduct[];
  const inventory = (inventoryQuery.data || []) as InventoryItem[];

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const pendingProductsCount = pendingProducts.filter(p => p.status === 'pending').length;
  const lowStockCount = inventory.filter(i => i.stock <= i.lowStockThreshold).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(analyticsQuery.data?.totalRevenue || 0)}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Total Orders"
            value={analyticsQuery.data?.totalOrders?.toLocaleString() || "0"}
            icon={ShoppingCart}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Total Products"
            value={analyticsQuery.data?.totalProducts || 0}
            icon={Package}
            trend={{ value: 3.1, isPositive: true }}
          />
          <StatsCard
            title="Total Customers"
            value={analyticsQuery.data?.totalCustomers?.toLocaleString() || "0"}
            icon={Users}
            trend={{ value: 15.3, isPositive: true }}
          />
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{pendingOrdersCount} Pending Orders</p>
                  <p className="text-sm text-muted-foreground">Require processing</p>
                </div>
                <Link to="/admin/orders">
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{pendingProductsCount} Products Pending</p>
                  <p className="text-sm text-muted-foreground">Awaiting approval</p>
                </div>
                <Link to="/admin/products">
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{lowStockCount} Low Stock Items</p>
                  <p className="text-sm text-muted-foreground">Need restocking</p>
                </div>
                <Link to="/admin/inventory">
                  <Button variant="outline" size="sm">Manage</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total)}</p>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingProducts.filter(p => p.status === 'pending').slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sellerName}</p>
                    </div>
                    <p className="font-semibold text-gold">{formatCurrency(product.price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
