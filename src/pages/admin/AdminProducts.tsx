import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { ProductApprovalsTable } from "@/components/admin/ProductApprovalsTable";
import { PendingProduct } from "@/types/admin";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminProducts() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pending-products"],
    queryFn: () => api.getPendingProducts(token || ""),
    enabled: Boolean(token),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approvePendingProduct(token || "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-products"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.rejectPendingProduct(token || "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pending-products"] }),
  });

  const handleApprove = (productId: string) => {
    approveMutation.mutate(productId);
    toast({
      title: "Product Approved",
      description: "The product has been approved and is now live.",
    });
  };

  const handleReject = (productId: string) => {
    rejectMutation.mutate(productId);
    toast({
      title: "Product Rejected",
      description: "The product has been rejected.",
      variant: "destructive",
    });
  };

  const filteredProducts = useMemo(() => {
    return (products as PendingProduct[]).filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Product Approvals</h1>
          <p className="text-muted-foreground">Review and approve seller product submissions</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or seller..."
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
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage products.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading pending products...</div>
        ) : (
          <ProductApprovalsTable
            products={filteredProducts}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </main>
    </div>
  );
}
