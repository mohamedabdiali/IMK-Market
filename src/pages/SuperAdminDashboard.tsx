import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Building2, DollarSign, ShoppingBag, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const MODULE_OPTIONS = [
  "Client Management",
  "Product Management",
  "Order Management",
  "Marketing Tools",
  "Analytics Dashboard",
  "Seller Management",
  "User Management",
  "Reports",
  "Settings",
  "Notifications",
];

const SUBSCRIPTION_STATUSES = ["active", "suspended", "cancelled"] as const;
const BILLING_CYCLES = ["monthly", "yearly"] as const;

const normalizeModules = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const stringifyValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseFlexibleValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

const truncate = (value: string, limit = 80) => (value.length > limit ? `${value.slice(0, limit - 3)}...` : value);

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
  businessType?: string;
  ownerName: string;
  phone?: string;
  productCategory: string;
  status: string;
  createdAt: string;
  user: {
    email: string;
    name?: string;
    phone?: string;
    createdAt?: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  subscriptionType: string;
  subscriptionStatus: string;
  modulesEnabled: unknown;
  createdAt: string;
  _count?: {
    users: number;
    products: number;
    orders: number;
  };
}

interface TenantAnalytics {
  tenantId: string;
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  tenantId?: string | null;
  isSystemRole: boolean;
  rolePermissions: Array<{ permission: Permission }>;
  _count?: { userRoles: number };
}

interface UserRecord {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  phone?: string | null;
  tenantId?: string | null;
  tenant?: { id: string; name: string } | null;
  isSuperAdmin: boolean;
  disabled?: boolean | null;
  createdAt: string;
  sellerProfile?: { id: string; businessName?: string | null; status?: string | null } | null;
  userRoles: Array<{ role: { id: string; name: string } }>;
}

interface Subscription {
  id: string;
  tenantId: string;
  planName: string;
  status: string;
  billingCycle: string;
  price?: number | null;
  currency?: string | null;
  endsAt?: string | null;
  tenant?: { id: string; name: string } | null;
}

interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

interface FeatureToggle {
  id: string;
  key: string;
  enabled: boolean;
  description?: string | null;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  changes?: unknown;
  createdAt: string;
  user?: { id: string; email: string; name?: string | null } | null;
  tenant?: { id: string; name: string } | null;
}

interface AuditLogResponse {
  logs: AuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function SuperAdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Super Admin Console</h1>
            <p className="text-muted-foreground">Platform-wide controls, tenant oversight, and security management.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {user?.email ? `Signed in as ${user.email}` : ""}
            </span>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Store
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-2 h-auto p-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="sellers">Partner Approvals</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="features">Feature Toggles</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab token={token} />
          </TabsContent>
          <TabsContent value="tenants">
            <TenantsTab token={token} isActive={activeTab === "tenants"} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab token={token} isActive={activeTab === "users"} />
          </TabsContent>
          <TabsContent value="roles">
            <RolesTab token={token} isActive={activeTab === "roles"} />
          </TabsContent>
          <TabsContent value="subscriptions">
            <SubscriptionsTab token={token} isActive={activeTab === "subscriptions"} />
          </TabsContent>
          <TabsContent value="sellers">
            <SellersTab token={token} isActive={activeTab === "sellers"} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab token={token} isActive={activeTab === "settings"} />
          </TabsContent>
          <TabsContent value="features">
            <FeatureTogglesTab token={token} isActive={activeTab === "features"} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditLogsTab token={token} isActive={activeTab === "audit"} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DashboardTab({ token }: { token: string | null }) {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["super-admin", "dashboard"],
    queryFn: () => api.get("/super-admin/dashboard", token!) as Promise<DashboardStats>,
    enabled: !!token,
  });

  const { data: pendingSellers, isLoading: sellersLoading } = useQuery<PendingSeller[]>({
    queryKey: ["super-admin", "pending-sellers"],
    queryFn: () => api.get("/super-admin/sellers/pending", token!) as Promise<PendingSeller[]>,
    enabled: !!token,
  });

  const approveMutation = useMutation({
    mutationFn: (sellerId: string) => api.post(`/super-admin/sellers/${sellerId}/approve`, {}, token!),
    onSuccess: () => {
      toast.success("Seller approved successfully");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "pending-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
    },
    onError: () => toast.error("Failed to approve seller"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ sellerId, reason }: { sellerId: string; reason: string }) =>
      api.post(`/super-admin/sellers/${sellerId}/reject`, { reason }, token!),
    onSuccess: () => {
      toast.success("Seller rejected");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "pending-sellers"] });
      queryClient.invalidateQueries({ queryKey: ["super-admin", "dashboard"] });
    },
    onError: () => toast.error("Failed to reject seller"),
  });

  const handleApprove = (sellerId: string) => {
    if (confirm("Approve this seller?")) {
      approveMutation.mutate(sellerId);
    }
  };

  const handleReject = (sellerId: string) => {
    const reason = prompt("Enter rejection reason (min 10 chars):");
    if (reason && reason.trim().length >= 10) {
      rejectMutation.mutate({ sellerId, reason: reason.trim() });
    } else if (reason) {
      toast.error("Rejection reason must be at least 10 characters.");
    }
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to view dashboard data.</div>;
  }

  if (statsLoading) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeTenants || 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalSellers || 0} partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalOrders || 0} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Partner Approvals</CardTitle>
              <CardDescription>Review and approve new seller, supplier, and manufacturer registrations</CardDescription>
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
              <p>No pending partner approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSellers.slice(0, 5).map((seller) => (
                <div key={seller.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{seller.businessName}</h4>
                      <Badge variant="secondary">
                        {(seller.businessType || "seller").charAt(0).toUpperCase() +
                          (seller.businessType || "seller").slice(1)}
                      </Badge>
                      <Badge variant="outline">{seller.productCategory}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Owner: {seller.ownerName} | {seller.user.email}
                    </p>
                    <p className="text-sm text-muted-foreground">Phone: {seller.phone || "—"}</p>
                    <p className="text-xs text-muted-foreground">Registered: {formatDate(seller.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(seller.id)} disabled={approveMutation.isPending}>
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

function TenantsTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.get("/super-admin/tenants", token!) as Promise<Tenant[]>,
    enabled: !!token && isActive,
  });

  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [customModule, setCustomModule] = useState("");
  const [tenantForm, setTenantForm] = useState({
    name: "",
    subscriptionType: "E-commerce Business",
    subscriptionStatus: "active",
    modulesEnabled: [] as string[],
  });

  const [analyticsTenant, setAnalyticsTenant] = useState<Tenant | null>(null);
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<TenantAnalytics>({
    queryKey: ["super-admin", "tenant-analytics", analyticsTenant?.id],
    queryFn: () => api.get(`/super-admin/tenants/${analyticsTenant?.id}/analytics`, token!) as Promise<TenantAnalytics>,
    enabled: !!token && !!analyticsTenant,
  });

  const createTenantMutation = useMutation({
    mutationFn: (payload: { name: string; subscriptionType: string; modulesEnabled: string[] }) =>
      api.post("/super-admin/tenants", payload, token!),
    onSuccess: () => {
      toast.success("Tenant created");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
      setTenantDialogOpen(false);
    },
    onError: () => toast.error("Failed to create tenant"),
  });

  const updateTenantMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      name?: string;
      subscriptionType?: string;
      subscriptionStatus?: string;
      modulesEnabled?: string[];
    }) => api.patch(`/super-admin/tenants/${payload.id}`, payload, token!),
    onSuccess: () => {
      toast.success("Tenant updated");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "tenants"] });
      setTenantDialogOpen(false);
    },
    onError: () => toast.error("Failed to update tenant"),
  });

  const resetTenantForm = () => {
    setTenantForm({
      name: "",
      subscriptionType: "E-commerce Business",
      subscriptionStatus: "active",
      modulesEnabled: [],
    });
    setCustomModule("");
    setEditingTenant(null);
  };

  const openCreate = () => {
    resetTenantForm();
    setTenantDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.name,
      subscriptionType: tenant.subscriptionType,
      subscriptionStatus: tenant.subscriptionStatus,
      modulesEnabled: normalizeModules(tenant.modulesEnabled),
    });
    setTenantDialogOpen(true);
  };

  const toggleModule = (moduleName: string) => {
    setTenantForm((prev) => {
      const exists = prev.modulesEnabled.includes(moduleName);
      return {
        ...prev,
        modulesEnabled: exists
          ? prev.modulesEnabled.filter((item) => item !== moduleName)
          : [...prev.modulesEnabled, moduleName],
      };
    });
  };

  const addCustomModule = () => {
    const trimmed = customModule.trim();
    if (!trimmed) return;
    setTenantForm((prev) => ({
      ...prev,
      modulesEnabled: prev.modulesEnabled.includes(trimmed)
        ? prev.modulesEnabled
        : [...prev.modulesEnabled, trimmed],
    }));
    setCustomModule("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenantForm.name.trim()) {
      toast.error("Tenant name is required");
      return;
    }
    if (editingTenant) {
      updateTenantMutation.mutate({
        id: editingTenant.id,
        name: tenantForm.name.trim(),
        subscriptionType: tenantForm.subscriptionType.trim(),
        subscriptionStatus: tenantForm.subscriptionStatus,
        modulesEnabled: tenantForm.modulesEnabled,
      });
      return;
    }
    createTenantMutation.mutate({
      name: tenantForm.name.trim(),
      subscriptionType: tenantForm.subscriptionType.trim(),
      modulesEnabled: tenantForm.modulesEnabled,
    });
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage tenants.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Tenant Management</h2>
          <p className="text-sm text-muted-foreground">Create, update, and review tenant configurations.</p>
        </div>
        <Button onClick={openCreate}>New Tenant</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading tenants...</div>
          ) : !tenants || tenants.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No tenants found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => {
                  const modules = normalizeModules(tenant.modulesEnabled);
                  return (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground">Created {formatDate(tenant.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.subscriptionStatus === "active" ? "default" : "destructive"}>
                          {tenant.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{tenant.subscriptionType}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {modules.slice(0, 3).map((moduleName) => (
                            <Badge key={moduleName} variant="outline">
                              {moduleName}
                            </Badge>
                          ))}
                          {modules.length > 3 && (
                            <Badge variant="secondary">+{modules.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          Users {tenant._count?.users ?? 0} | Products {tenant._count?.products ?? 0} | Orders{" "}
                          {tenant._count?.orders ?? 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(tenant)}>
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => setAnalyticsTenant(tenant)}>
                          Analytics
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={tenantDialogOpen}
        onOpenChange={(open) => {
          setTenantDialogOpen(open);
          if (!open) resetTenantForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTenant ? "Edit Tenant" : "Create Tenant"}</DialogTitle>
            <DialogDescription>
              {editingTenant ? "Update tenant subscription settings." : "Add a new tenant to the platform."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Tenant Name</Label>
                <Input
                  id="tenant-name"
                  value={tenantForm.name}
                  onChange={(event) => setTenantForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenant-plan">Subscription Type</Label>
                <Input
                  id="tenant-plan"
                  value={tenantForm.subscriptionType}
                  onChange={(event) => setTenantForm((prev) => ({ ...prev, subscriptionType: event.target.value }))}
                  required
                />
              </div>
            </div>
            {editingTenant && (
              <div className="space-y-2">
                <Label>Subscription Status</Label>
                <Select
                  value={tenantForm.subscriptionStatus}
                  onValueChange={(value) => setTenantForm((prev) => ({ ...prev, subscriptionStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-3">
              <Label>Modules Enabled</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {MODULE_OPTIONS.map((moduleName) => (
                  <label key={moduleName} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={tenantForm.modulesEnabled.includes(moduleName)}
                      onCheckedChange={() => toggleModule(moduleName)}
                    />
                    {moduleName}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customModule}
                  onChange={(event) => setCustomModule(event.target.value)}
                  placeholder="Add custom module"
                />
                <Button type="button" variant="outline" onClick={addCustomModule}>
                  Add
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createTenantMutation.isPending || updateTenantMutation.isPending}>
                {editingTenant ? "Save Changes" : "Create Tenant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!analyticsTenant}
        onOpenChange={(open) => {
          if (!open) setAnalyticsTenant(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tenant Analytics</DialogTitle>
            <DialogDescription>{analyticsTenant?.name}</DialogDescription>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="text-sm text-muted-foreground">Loading analytics...</div>
          ) : analyticsData ? (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Users</span>
                <span className="font-semibold">{analyticsData.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Sellers</span>
                <span className="font-semibold">{analyticsData.totalSellers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Products</span>
                <span className="font-semibold">{analyticsData.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Orders</span>
                <span className="font-semibold">{analyticsData.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Revenue</span>
                <span className="font-semibold">{formatCurrency(analyticsData.totalRevenue)}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No analytics available.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UsersTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery<UserRecord[]>({
    queryKey: ["super-admin", "users"],
    queryFn: () => api.get("/super-admin/users", token!) as Promise<UserRecord[]>,
    enabled: !!token && isActive,
  });
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["super-admin", "roles"],
    queryFn: () => api.get("/super-admin/roles", token!) as Promise<Role[]>,
    enabled: !!token && isActive,
  });
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.get("/super-admin/tenants", token!) as Promise<Tenant[]>,
    enabled: !!token && isActive,
  });

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingRolesUser, setEditingRolesUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
    phone: "",
    tenantId: "",
    roleIds: [] as string[],
  });
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const createUserMutation = useMutation({
    mutationFn: (payload: typeof userForm) =>
      api.post(
        "/super-admin/users",
        {
          email: payload.email,
          password: payload.password,
          username: payload.username || undefined,
          name: payload.name || undefined,
          phone: payload.phone || undefined,
          tenantId: payload.tenantId || undefined,
          roleIds: payload.roleIds,
        },
        token!,
      ),
    onSuccess: () => {
      toast.success("User created");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      setUserDialogOpen(false);
      setUserForm({ email: "", password: "", username: "", name: "", phone: "", tenantId: "", roleIds: [] });
    },
    onError: () => toast.error("Failed to create user"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/super-admin/users/${userId}`, token!),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      api.patch(`/super-admin/users/${userId}/roles`, { roleIds }, token!),
    onSuccess: () => {
      toast.success("Roles updated");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "users"] });
      setEditingRolesUser(null);
    },
    onError: () => toast.error("Failed to update roles"),
  });

  const toggleRole = (roleId: string) => {
    setUserForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const toggleSelectedRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
  };

  const submitUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userForm.email.trim() || !userForm.password.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (userForm.roleIds.length === 0) {
      toast.error("Select at least one role");
      return;
    }
    createUserMutation.mutate(userForm);
  };

  const openRolesEditor = (userRecord: UserRecord) => {
    setEditingRolesUser(userRecord);
    const roleIds = userRecord.userRoles.map((role) => role.role.id);
    setSelectedRoleIds(roleIds);
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage users.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">Create users and manage role assignments.</p>
        </div>
        <Button onClick={() => setUserDialogOpen(true)}>Create User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading users...</div>
          ) : !users || users.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((record) => {
                  const roleNames = record.userRoles.map((role) => role.role.name);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{record.email}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.name || record.username || "—"} | Created {formatDate(record.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roleNames.length > 0 ? (
                            roleNames.map((role) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.tenant?.name || "Global"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {record.isSuperAdmin && <Badge>Super Admin</Badge>}
                          {record.sellerProfile?.status && (
                            <Badge variant="secondary">Seller {record.sellerProfile.status}</Badge>
                          )}
                          {record.disabled && <Badge variant="destructive">Disabled</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openRolesEditor(record)}>
                          Edit Roles
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={record.isSuperAdmin}
                          onClick={() => {
                            if (confirm("Delete this user?")) {
                              deleteUserMutation.mutate(record.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>New user credentials will require a password reset on first login.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitUser} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={userForm.email}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={userForm.username}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, username: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={userForm.phone} onChange={(event) => setUserForm((prev) => ({ ...prev, phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={userForm.tenantId} onValueChange={(value) => setUserForm((prev) => ({ ...prev, tenantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Global scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Global</SelectItem>
                    {(tenants || []).map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign Roles</Label>
              <ScrollArea className="h-40 rounded-md border p-3">
                <div className="grid gap-2 md:grid-cols-2">
                  {(roles || []).map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={userForm.roleIds.includes(role.id)} onCheckedChange={() => toggleRole(role.id)} />
                      {role.name}
                      {role.isSystemRole && <Badge variant="outline">System</Badge>}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createUserMutation.isPending}>
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingRolesUser}
        onOpenChange={(open) => {
          if (!open) setEditingRolesUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Roles</DialogTitle>
            <DialogDescription>{editingRolesUser?.email}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-48 rounded-md border p-3">
            <div className="grid gap-2 md:grid-cols-2">
              {(roles || []).map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedRoleIds.includes(role.id)} onCheckedChange={() => toggleSelectedRole(role.id)} />
                  {role.name}
                </label>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                if (editingRolesUser) {
                  updateRolesMutation.mutate({ userId: editingRolesUser.id, roleIds: selectedRoleIds });
                }
              }}
            >
              Save Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RolesTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["super-admin", "roles"],
    queryFn: () => api.get("/super-admin/roles", token!) as Promise<Role[]>,
    enabled: !!token && isActive,
  });
  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ["super-admin", "permissions"],
    queryFn: () => api.get("/super-admin/permissions", token!) as Promise<Permission[]>,
    enabled: !!token && isActive,
  });
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.get("/super-admin/tenants", token!) as Promise<Tenant[]>,
    enabled: !!token && isActive,
  });

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    tenantId: "",
    permissionIds: [] as string[],
  });

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    (permissions || []).forEach((permission) => {
      const key = permission.resource;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(permission);
    });
    return groups;
  }, [permissions]);

  const createRoleMutation = useMutation({
    mutationFn: (payload: typeof roleForm) =>
      api.post(
        "/super-admin/roles",
        {
          name: payload.name,
          description: payload.description || undefined,
          tenantId: payload.tenantId || undefined,
          permissionIds: payload.permissionIds,
        },
        token!,
      ),
    onSuccess: () => {
      toast.success("Role created");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "roles"] });
      setRoleDialogOpen(false);
      setRoleForm({ name: "", description: "", tenantId: "", permissionIds: [] });
    },
    onError: () => toast.error("Failed to create role"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; description?: string; permissionIds?: string[] }) =>
      api.patch(`/super-admin/roles/${payload.id}`, payload, token!),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "roles"] });
      setRoleDialogOpen(false);
    },
    onError: () => toast.error("Failed to update role"),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => api.delete(`/super-admin/roles/${roleId}`, token!),
    onSuccess: () => {
      toast.success("Role deleted");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "roles"] });
    },
    onError: () => toast.error("Failed to delete role"),
  });

  const togglePermission = (permissionId: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }));
  };

  const openCreate = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", tenantId: "", permissionIds: [] });
    setRoleDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || "",
      tenantId: role.tenantId || "",
      permissionIds: role.rolePermissions.map((permission) => permission.permission.id),
    });
    setRoleDialogOpen(true);
  };

  const submitRole = (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleForm.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        name: roleForm.name.trim(),
        description: roleForm.description || undefined,
        permissionIds: roleForm.permissionIds,
      });
      return;
    }
    createRoleMutation.mutate(roleForm);
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage roles.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Role Management</h2>
          <p className="text-sm text-muted-foreground">Configure global or tenant-specific roles and permissions.</p>
        </div>
        <Button onClick={openCreate}>Create Role</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading roles...</div>
          ) : !roles || roles.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No roles found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium">{role.name}</div>
                      <div className="text-xs text-muted-foreground">{role.description || "—"}</div>
                    </TableCell>
                    <TableCell>{role.tenantId ? "Tenant" : "Global"}</TableCell>
                    <TableCell>{role._count?.userRoles ?? 0}</TableCell>
                    <TableCell>{role.rolePermissions.length}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(role)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={role.isSystemRole}
                        onClick={() => {
                          if (confirm("Delete this role?")) {
                            deleteRoleMutation.mutate(role.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>Assign permissions to control module access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRole} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={roleForm.name}
                  disabled={!!editingRole?.isSystemRole}
                  onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tenant Scope</Label>
                <Select value={roleForm.tenantId} onValueChange={(value) => setRoleForm((prev) => ({ ...prev, tenantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Global" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Global</SelectItem>
                    {(tenants || []).map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={roleForm.description}
                onChange={(event) => setRoleForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <ScrollArea className="h-64 rounded-md border p-3">
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-2">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">{resource}</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {perms.map((perm) => (
                          <label key={perm.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={roleForm.permissionIds.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            {perm.action}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                {editingRole ? "Save Role" : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionsTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["super-admin", "subscriptions"],
    queryFn: () => api.get("/super-admin/subscriptions", token!) as Promise<Subscription[]>,
    enabled: !!token && isActive,
  });
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["super-admin", "tenants"],
    queryFn: () => api.get("/super-admin/tenants", token!) as Promise<Tenant[]>,
    enabled: !!token && isActive,
  });

  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    tenantId: "",
    planName: "",
    status: "active",
    billingCycle: "monthly",
    price: "",
    currency: "USD",
    endsAt: "",
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (payload: typeof subscriptionForm) =>
      api.post(
        "/super-admin/subscriptions",
        {
          tenantId: payload.tenantId,
          planName: payload.planName,
          status: payload.status,
          billingCycle: payload.billingCycle,
          price: payload.price ? Number(payload.price) : undefined,
          currency: payload.currency || undefined,
          endsAt: payload.endsAt ? new Date(payload.endsAt).toISOString() : undefined,
        },
        token!,
      ),
    onSuccess: () => {
      toast.success("Subscription created");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "subscriptions"] });
      setSubscriptionDialogOpen(false);
    },
    onError: () => toast.error("Failed to create subscription"),
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: (payload: typeof subscriptionForm & { id: string }) =>
      api.patch(
        `/super-admin/subscriptions/${payload.id}`,
        {
          planName: payload.planName,
          status: payload.status,
          billingCycle: payload.billingCycle,
          price: payload.price ? Number(payload.price) : undefined,
          currency: payload.currency || undefined,
          endsAt: payload.endsAt ? new Date(payload.endsAt).toISOString() : undefined,
        },
        token!,
      ),
    onSuccess: () => {
      toast.success("Subscription updated");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "subscriptions"] });
      setSubscriptionDialogOpen(false);
    },
    onError: () => toast.error("Failed to update subscription"),
  });

  const openCreate = () => {
    setEditingSubscription(null);
    setSubscriptionForm({
      tenantId: tenants?.[0]?.id || "",
      planName: "",
      status: "active",
      billingCycle: "monthly",
      price: "",
      currency: "USD",
      endsAt: "",
    });
    setSubscriptionDialogOpen(true);
  };

  const openEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      tenantId: subscription.tenantId,
      planName: subscription.planName,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      price: subscription.price ? String(subscription.price) : "",
      currency: subscription.currency || "USD",
      endsAt: subscription.endsAt ? subscription.endsAt.slice(0, 10) : "",
    });
    setSubscriptionDialogOpen(true);
  };

  const submitSubscription = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subscriptionForm.tenantId || !subscriptionForm.planName.trim()) {
      toast.error("Tenant and plan name are required");
      return;
    }
    if (editingSubscription) {
      updateSubscriptionMutation.mutate({ ...subscriptionForm, id: editingSubscription.id });
    } else {
      createSubscriptionMutation.mutate(subscriptionForm);
    }
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage subscriptions.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Subscriptions</h2>
          <p className="text-sm text-muted-foreground">Manage tenant billing plans and status.</p>
        </div>
        <Button onClick={openCreate}>Create Subscription</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading subscriptions...</div>
          ) : !subscriptions || subscriptions.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No subscriptions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.tenant?.name || subscription.tenantId}</TableCell>
                    <TableCell>{subscription.planName}</TableCell>
                    <TableCell>
                      <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscription.billingCycle}{" "}
                      {subscription.price ? `| ${subscription.currency} ${subscription.price}` : ""}
                    </TableCell>
                    <TableCell>{subscription.endsAt ? formatDate(subscription.endsAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(subscription)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSubscription ? "Edit Subscription" : "Create Subscription"}</DialogTitle>
            <DialogDescription>Update tenant billing metadata.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSubscription} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={subscriptionForm.tenantId} onValueChange={(value) => setSubscriptionForm((prev) => ({ ...prev, tenantId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tenants || []).map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input value={subscriptionForm.planName} onChange={(event) => setSubscriptionForm((prev) => ({ ...prev, planName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={subscriptionForm.status} onValueChange={(value) => setSubscriptionForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={subscriptionForm.billingCycle} onValueChange={(value) => setSubscriptionForm((prev) => ({ ...prev, billingCycle: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>
                        {cycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  value={subscriptionForm.price}
                  onChange={(event) => setSubscriptionForm((prev) => ({ ...prev, price: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  value={subscriptionForm.currency}
                  onChange={(event) => setSubscriptionForm((prev) => ({ ...prev, currency: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ends At</Label>
                <Input
                  type="date"
                  value={subscriptionForm.endsAt}
                  onChange={(event) => setSubscriptionForm((prev) => ({ ...prev, endsAt: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createSubscriptionMutation.isPending || updateSubscriptionMutation.isPending}>
                {editingSubscription ? "Save Subscription" : "Create Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SellersTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: pendingSellers, isLoading } = useQuery<PendingSeller[]>({
    queryKey: ["super-admin", "pending-sellers"],
    queryFn: () => api.get("/super-admin/sellers/pending", token!) as Promise<PendingSeller[]>,
    enabled: !!token && isActive,
  });

  const approveMutation = useMutation({
    mutationFn: (sellerId: string) => api.post(`/super-admin/sellers/${sellerId}/approve`, {}, token!),
    onSuccess: () => {
      toast.success("Seller approved");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "pending-sellers"] });
    },
    onError: () => toast.error("Failed to approve seller"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ sellerId, reason }: { sellerId: string; reason: string }) =>
      api.post(`/super-admin/sellers/${sellerId}/reject`, { reason }, token!),
    onSuccess: () => {
      toast.success("Seller rejected");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "pending-sellers"] });
    },
    onError: () => toast.error("Failed to reject seller"),
  });

  const handleReject = (sellerId: string) => {
    const reason = prompt("Enter rejection reason (min 10 chars):");
    if (reason && reason.trim().length >= 10) {
      rejectMutation.mutate({ sellerId, reason: reason.trim() });
    } else if (reason) {
      toast.error("Rejection reason must be at least 10 characters.");
    }
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage sellers.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Partner Approvals</h2>
        <p className="text-sm text-muted-foreground">Approve or reject new seller, supplier, and manufacturer registrations.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading sellers...</div>
          ) : !pendingSellers || pendingSellers.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No pending sellers.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div className="font-medium">{seller.businessName}</div>
                      <div className="text-xs text-muted-foreground">{seller.user.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {seller.businessType || "seller"}
                    </TableCell>
                    <TableCell>{seller.ownerName}</TableCell>
                    <TableCell>{seller.phone || seller.user.phone || "—"}</TableCell>
                    <TableCell>{seller.productCategory}</TableCell>
                    <TableCell>{formatDate(seller.createdAt)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => approveMutation.mutate(seller.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleReject(seller.id)}>
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["super-admin", "settings"],
    queryFn: () => api.get("/super-admin/system/settings", token!) as Promise<SystemSetting[]>,
    enabled: !!token && isActive,
  });

  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [settingForm, setSettingForm] = useState({ key: "", value: "" });

  const updateSettingMutation = useMutation({
    mutationFn: (payload: { key: string; value: string }) =>
      api.put(`/super-admin/system/settings/${payload.key}`, { value: parseFlexibleValue(payload.value) }, token!),
    onSuccess: () => {
      toast.success("Setting saved");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "settings"] });
      setSettingDialogOpen(false);
    },
    onError: () => toast.error("Failed to save setting"),
  });

  const openCreate = () => {
    setEditingSetting(null);
    setSettingForm({ key: "", value: "" });
    setSettingDialogOpen(true);
  };

  const openEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setSettingForm({ key: setting.key, value: stringifyValue(setting.value) });
    setSettingDialogOpen(true);
  };

  const submitSetting = (event: React.FormEvent) => {
    event.preventDefault();
    if (!settingForm.key.trim()) {
      toast.error("Setting key is required");
      return;
    }
    updateSettingMutation.mutate({ key: settingForm.key.trim(), value: settingForm.value });
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage system settings.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">System Settings</h2>
          <p className="text-sm text-muted-foreground">Store global configuration values.</p>
        </div>
        <Button onClick={openCreate}>Add Setting</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading settings...</div>
          ) : !settings || settings.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No settings configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">{setting.key}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={stringifyValue(setting.value)}>
                        {truncate(stringifyValue(setting.value))}
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(setting.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(setting)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={settingDialogOpen} onOpenChange={setSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetting ? "Edit Setting" : "Add Setting"}</DialogTitle>
            <DialogDescription>Provide JSON or plain text values.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitSetting} className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                value={settingForm.key}
                disabled={!!editingSetting}
                onChange={(event) => setSettingForm((prev) => ({ ...prev, key: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Textarea
                rows={5}
                value={settingForm.value}
                onChange={(event) => setSettingForm((prev) => ({ ...prev, value: event.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateSettingMutation.isPending}>
                Save Setting
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureTogglesTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const queryClient = useQueryClient();
  const { data: toggles, isLoading } = useQuery<FeatureToggle[]>({
    queryKey: ["super-admin", "feature-toggles"],
    queryFn: () => api.get("/super-admin/feature-toggles", token!) as Promise<FeatureToggle[]>,
    enabled: !!token && isActive,
  });

  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [editingToggle, setEditingToggle] = useState<FeatureToggle | null>(null);
  const [toggleForm, setToggleForm] = useState({ key: "", description: "", enabled: false });

  const updateToggleMutation = useMutation({
    mutationFn: (payload: { key: string; enabled: boolean; description?: string }) =>
      api.patch(`/super-admin/feature-toggles/${payload.key}`, payload, token!),
    onSuccess: () => {
      toast.success("Feature toggle updated");
      queryClient.invalidateQueries({ queryKey: ["super-admin", "feature-toggles"] });
      setToggleDialogOpen(false);
    },
    onError: () => toast.error("Failed to update toggle"),
  });

  const openCreate = () => {
    setEditingToggle(null);
    setToggleForm({ key: "", description: "", enabled: false });
    setToggleDialogOpen(true);
  };

  const openEdit = (toggle: FeatureToggle) => {
    setEditingToggle(toggle);
    setToggleForm({ key: toggle.key, description: toggle.description || "", enabled: toggle.enabled });
    setToggleDialogOpen(true);
  };

  const submitToggle = (event: React.FormEvent) => {
    event.preventDefault();
    if (!toggleForm.key.trim()) {
      toast.error("Toggle key is required");
      return;
    }
    updateToggleMutation.mutate({
      key: toggleForm.key.trim(),
      enabled: toggleForm.enabled,
      description: toggleForm.description || undefined,
    });
  };

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to manage feature toggles.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Feature Toggles</h2>
          <p className="text-sm text-muted-foreground">Enable or disable platform features.</p>
        </div>
        <Button onClick={openCreate}>Add Toggle</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading feature toggles...</div>
          ) : !toggles || toggles.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No feature toggles configured.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toggles.map((toggle) => (
                  <TableRow key={toggle.id}>
                    <TableCell className="font-medium">{toggle.key}</TableCell>
                    <TableCell className="max-w-xs truncate" title={toggle.description || ""}>
                      {toggle.description || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={toggle.enabled}
                          onCheckedChange={(checked) =>
                            updateToggleMutation.mutate({
                              key: toggle.key,
                              enabled: checked,
                              description: toggle.description || undefined,
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground">{toggle.enabled ? "On" : "Off"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(toggle.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(toggle)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingToggle ? "Edit Toggle" : "Add Toggle"}</DialogTitle>
            <DialogDescription>Manage feature availability across the platform.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitToggle} className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input
                value={toggleForm.key}
                disabled={!!editingToggle}
                onChange={(event) => setToggleForm((prev) => ({ ...prev, key: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={toggleForm.description}
                onChange={(event) => setToggleForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Enabled</p>
                <p className="text-xs text-muted-foreground">Feature availability for all tenants.</p>
              </div>
              <Switch checked={toggleForm.enabled} onCheckedChange={(checked) => setToggleForm((prev) => ({ ...prev, enabled: checked }))} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateToggleMutation.isPending}>
                Save Toggle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditLogsTab({ token, isActive }: { token: string | null; isActive: boolean }) {
  const [page, setPage] = useState(1);
  const limit = 50;
  const { data, isLoading } = useQuery<AuditLogResponse>({
    queryKey: ["super-admin", "audit-logs", page],
    queryFn: () => api.get(`/super-admin/audit-logs?page=${page}&limit=${limit}`, token!) as Promise<AuditLogResponse>,
    enabled: !!token && isActive,
  });

  if (!token) {
    return <div className="text-sm text-muted-foreground">Sign in to view audit logs.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Audit Logs</h2>
        <p className="text-sm text-muted-foreground">Track sensitive actions across tenants and system modules.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading audit logs...</div>
          ) : !data || data.logs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No audit logs found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="text-xs">{log.user?.email || "System"}</TableCell>
                    <TableCell className="text-xs">{log.action}</TableCell>
                    <TableCell className="text-xs">{log.resource}</TableCell>
                    <TableCell className="text-xs">{log.tenant?.name || "Global"}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={stringifyValue(log.changes)}>
                      {truncate(stringifyValue(log.changes || ""))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div className="space-x-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(data.pagination.totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
