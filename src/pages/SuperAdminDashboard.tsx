import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Building2, ShoppingBag, DollarSign, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    totalSellers: number;
    pendingSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

interface PendingSeller {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    productCategory: string;
    status: string;
    createdAt: string;
    user: {
        email: string;
        name: string;
    };
}

export default function SuperAdminDashboard() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    // Fetch dashboard stats
    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ["super-admin-dashboard"],
        queryFn: () => api.get("/super-admin/dashboard", token!) as Promise<DashboardStats>,
        enabled: !!token,
    });

    // Fetch pending sellers
    const { data: pendingSellers, isLoading: sellersLoading } = useQuery<PendingSeller[]>({
        queryKey: ["pending-sellers"],
        queryFn: () => api.get("/super-admin/sellers/pending", token!) as Promise<PendingSeller[]>,
        enabled: !!token,
    });

    // Approve seller mutation
    const approveMutation = useMutation({
        mutationFn: (sellerId: string) => api.post(`/super-admin/sellers/${sellerId}/approve`, {}, token!),
        onSuccess: () => {
            toast.success("Seller approved successfully");
            queryClient.invalidateQueries({ queryKey: ["pending-sellers"] });
            queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });
        },
        onError: () => {
            toast.error("Failed to approve seller");
        },
    });

    // Reject seller mutation
    const rejectMutation = useMutation({
        mutationFn: ({ sellerId, reason }: { sellerId: string; reason: string }) =>
            api.post(`/super-admin/sellers/${sellerId}/reject`, { reason }, token!),
        onSuccess: () => {
            toast.success("Seller rejected");
            queryClient.invalidateQueries({ queryKey: ["pending-sellers"] });
            queryClient.invalidateQueries({ queryKey: ["super-admin-dashboard"] });
        },
        onError: () => {
            toast.error("Failed to reject seller");
        },
    });

    const handleApprove = (sellerId: string) => {
        if (confirm("Are you sure you want to approve this seller?")) {
            approveMutation.mutate(sellerId);
        }
    };

    const handleReject = (sellerId: string) => {
        const reason = prompt("Enter rejection reason:");
        if (reason) {
            rejectMutation.mutate({ sellerId, reason });
        }
    };

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform-wide management and analytics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.activeTenants || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.totalSellers || 0} sellers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.totalOrders || 0} orders
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Le {(stats?.totalRevenue || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Sellers */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Pending Seller Approvals</CardTitle>
                            <CardDescription>Review and approve new seller registrations</CardDescription>
                        </div>
                        {stats && stats.pendingSellers > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {stats.pendingSellers} pending
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {sellersLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading sellers...</div>
                    ) : !pendingSellers || pendingSellers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No pending seller approvals</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingSellers.map((seller) => (
                                <div
                                    key={seller.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{seller.businessName}</h4>
                                            <Badge variant="outline">{seller.productCategory}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Owner: {seller.ownerName} • {seller.user.email}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Phone: {seller.phone}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Registered: {new Date(seller.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(seller.id)}
                                            disabled={approveMutation.isPending}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleReject(seller.id)}
                                            disabled={rejectMutation.isPending}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
