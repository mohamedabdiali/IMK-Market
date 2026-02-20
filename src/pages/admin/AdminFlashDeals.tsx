import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { ProductManagementItem } from "@/types/admin";

interface FlashDealsSetting {
  title: string;
  subtitle: string;
  endsAt: string | null;
  productIds: string[];
}

const defaultFlashDeals: FlashDealsSetting = {
  title: "Flash Deals",
  subtitle: "Limited time offers - up to 30% off.",
  endsAt: null,
  productIds: [],
};

export default function AdminFlashDeals() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<FlashDealsSetting>(defaultFlashDeals);

  const { data: dealsSetting, isLoading: isDealsLoading } = useQuery({
    queryKey: ["admin-flash-deals"],
    queryFn: () => api.getFlashDealsAdmin(token || ""),
    enabled: Boolean(token),
  });

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.getAdminProducts(token || ""),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!dealsSetting || typeof dealsSetting !== "object") return;
    const setting = dealsSetting as Partial<FlashDealsSetting>;
    setDraft({
      title: setting.title ?? defaultFlashDeals.title,
      subtitle: setting.subtitle ?? defaultFlashDeals.subtitle,
      endsAt: setting.endsAt ?? null,
      productIds: Array.isArray(setting.productIds) ? setting.productIds : [],
    });
  }, [dealsSetting]);

  const saveMutation = useMutation({
    mutationFn: (payload: FlashDealsSetting) => api.updateFlashDealsAdmin(token || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-deals"] });
      toast({ title: "Flash deals updated", description: "Homepage flash deals were saved." });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products as ProductManagementItem[];
    if (!query) return list;
    return list.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.sku}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [products, search]);

  const toggleProduct = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev.productIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, productIds: Array.from(next) };
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Flash Deals</h1>
          <p className="text-muted-foreground">
            Manage the Flash Deals panel separately from your main product catalog.
          </p>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage flash deals.</div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Panel Details</CardTitle>
                <CardDescription>Update the headline and expiration date shown on the homepage.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Title"
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Subtitle"
                  value={draft.subtitle}
                  onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                />
                <Input
                  type="datetime-local"
                  value={draft.endsAt ? new Date(draft.endsAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
                <div className="flex items-center justify-end">
                  <Button
                    onClick={() => saveMutation.mutate(draft)}
                    disabled={isDealsLoading || saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Saving..." : "Save Flash Deals"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Products</CardTitle>
                <CardDescription>Select which products appear in the Flash Deals panel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <div className="text-sm text-muted-foreground">
                    Selected: {draft.productIds.length}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDraft((prev) => ({ ...prev, productIds: [] }))}
                  >
                    Clear Selection
                  </Button>
                </div>

                {isProductsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {filteredProducts.map((product) => {
                      const checked = draft.productIds.includes(product.id);
                      return (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/30"
                        >
                          <Checkbox checked={checked} onCheckedChange={() => toggleProduct(product.id)} />
                          <div className="flex-1">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {product.category} - {formatCurrency(product.price)}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
