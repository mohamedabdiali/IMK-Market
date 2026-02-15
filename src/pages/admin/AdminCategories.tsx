import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CategoryItem } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function AdminCategories() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.getCategoriesAdmin(token || ""),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.createCategoryAdmin(token || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setName("");
      setImage("");
      toast({ title: "Category added", description: "Category created successfully." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategoryAdmin(token || "", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Category deleted", description: "Category removed successfully." });
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>

        <div className="grid gap-4 max-w-xl mb-8">
          <Input placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Image URL (optional)" value={image} onChange={(e) => setImage(e.target.value)} />
          <Button
            onClick={() => createMutation.mutate({ name, image: image || undefined })}
            disabled={!name}
          >
            Add Category
          </Button>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage categories.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(categories as CategoryItem[]).map((category) => (
              <div key={category.id} className="border border-border/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.id}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(category.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
