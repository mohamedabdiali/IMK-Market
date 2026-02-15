import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { StatsCard } from "@/components/admin/StatsCard";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function AdminAnalytics() {
  const { token } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api.getAdminAnalytics(token || ""),
    enabled: Boolean(token),
  });

  if (!token) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <AdminTopActions />
          <div className="text-muted-foreground">Please sign in to view analytics.</div>
        </main>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <AdminTopActions />
          <div className="text-muted-foreground">Loading analytics...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your marketplace performance and insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Total Orders"
            value={data.totalOrders.toLocaleString()}
            icon={ShoppingCart}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Total Products"
            value={data.totalProducts}
            icon={Package}
            trend={{ value: 3.1, isPositive: true }}
          />
          <StatsCard
            title="Total Customers"
            value={data.totalCustomers.toLocaleString()}
            icon={Users}
            trend={{ value: 15.3, isPositive: true }}
          />
        </div>

        {/* Charts */}
        <AnalyticsCharts data={data} />
      </main>
    </div>
  );
}
