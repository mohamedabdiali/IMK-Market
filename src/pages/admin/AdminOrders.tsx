import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AdminOrder, AdminTrackingUpdatePayload, OrderStatus } from "@/types/admin";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminOrders() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.getAdminOrders(token || ""),
    enabled: Boolean(token),
  });

  const mutation = useMutation({
    mutationFn: (payload: { id: string; status: OrderStatus }) =>
      api.updateOrderStatus(token || "", payload.id, payload.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const trackingMutation = useMutation({
    mutationFn: (payload: { id: string; data: AdminTrackingUpdatePayload }) =>
      api.updateOrderTracking(token || "", payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: (orderId: string) => api.approveOrderPayment(token || "", orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    mutation.mutate({ id: orderId, status: newStatus });
    toast({
      title: "Order Updated",
      description: `Order ${orderId} status changed to ${newStatus}`,
    });
  };

  const handleTrackingUpdate = async (orderId: string, data: AdminTrackingUpdatePayload) => {
    await trackingMutation.mutateAsync({ id: orderId, data });
    toast({
      title: "Tracking Updated",
      description: `Tracking details updated for order ${orderId}.`,
    });
  };

  const handleApprovePayment = async (orderId: string) => {
    await approvePaymentMutation.mutateAsync(orderId);
    toast({
      title: "Payment Approved",
      description: `Payment approved for order ${orderId}.`,
    });
  };

  const filteredOrders = useMemo(() => {
    return (orders as AdminOrder[]).filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.orderTrackingId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">View and manage all customer orders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tracking ID, order ID, customer name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to view orders.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading orders...</div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onTrackingUpdate={handleTrackingUpdate}
            onApprovePayment={handleApprovePayment}
          />
        )}
      </main>
    </div>
  );
}
