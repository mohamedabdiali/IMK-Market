import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { InventoryItem } from "@/types/admin";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, Package, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function AdminInventory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  const handleUpdateStock = (itemId: string, newStock: number) => {
    updateMutation.mutate({ id: itemId, stock: newStock });
    toast({
      title: "Stock Updated",
      description: "Inventory has been updated successfully.",
    });
  };

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(token || ""),
    enabled: Boolean(token),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; stock: number }) =>
      api.updateInventoryStock(token || "", payload.id, payload.stock),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const filteredInventory = useMemo(() => {
    return (inventory as InventoryItem[]).filter(item => {
      const matchesSearch =
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase());

      if (stockFilter === "all") return matchesSearch;
      if (stockFilter === "low") return matchesSearch && item.stock <= item.lowStockThreshold && item.stock > 0;
      if (stockFilter === "out") return matchesSearch && item.stock === 0;
      if (stockFilter === "in") return matchesSearch && item.stock > item.lowStockThreshold;
      return matchesSearch;
    });
  }, [inventory, searchTerm, stockFilter]);

  const totalItems = (inventory as InventoryItem[]).length;
  const lowStockItems = (inventory as InventoryItem[]).filter(i => i.stock <= i.lowStockThreshold && i.stock > 0).length;
  const outOfStockItems = (inventory as InventoryItem[]).filter(i => i.stock === 0).length;
  const inStockItems = (inventory as InventoryItem[]).filter(i => i.stock > i.lowStockThreshold).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage product stock levels</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="h-8 w-8 text-navy" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{inStockItems}</p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{lowStockItems}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{outOfStockItems}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage inventory.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading inventory...</div>
        ) : (
          <InventoryTable inventory={filteredInventory} onUpdateStock={handleUpdateStock} />
        )}
      </main>
    </div>
  );
}
