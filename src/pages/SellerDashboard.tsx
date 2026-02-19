import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SellerAnalytics {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    status: string;
    categoryId: string;
    images: string[];
    category: { name: string };
}

interface Category {
    id: string;
    name: string;
}

interface ProductFormData {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    images: string[];
}

export default function SellerDashboard() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Fetch analytics
    const { data: analytics } = useQuery<SellerAnalytics>({
        queryKey: ["seller-analytics"],
        queryFn: () => api.get("/seller/analytics", token!) as Promise<SellerAnalytics>,
        enabled: !!token,
    });

    // Fetch products
    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ["seller-products"],
        queryFn: () => api.get("/seller/products", token!) as Promise<Product[]>,
        enabled: !!token,
    });

    // Fetch categories
    const { data: categories } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: () => api.get("/categories") as Promise<Category[]>,
    });

    // Delete product mutation
    const deleteMutation = useMutation({
        mutationFn: (productId: string) => api.delete(`/seller/products/${productId}`, token!),
        onSuccess: () => {
            toast.success("Product deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["seller-products"] });
            queryClient.invalidateQueries({ queryKey: ["seller-analytics"] });
        },
        onError: () => {
            toast.error("Failed to delete product");
        },
    });

    const handleDelete = (productId: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            deleteMutation.mutate(productId);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Seller Dashboard</h1>
                    <p className="text-muted-foreground">Manage your products and view sales</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Add Product
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalProducts || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics?.activeProducts || 0} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.lowStockProducts || 0}</div>
                        <p className="text-xs text-muted-foreground">Need restocking</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Le {(analytics?.totalRevenue || 0).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>Manage your product inventory</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading products...</div>
                    ) : !products || products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No products yet. Add your first product to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{product.name}</h4>
                                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                                {product.status}
                                            </Badge>
                                            {product.stock <= 5 && (
                                                <Badge variant="destructive">Low Stock</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Category: {product.category.name} • Price: Le {product.price.toFixed(2)} • Stock: {product.stock}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleDelete(product.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Product Dialog */}
            <ProductDialog
                open={isCreateDialogOpen || !!editingProduct}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateDialogOpen(false);
                        setEditingProduct(null);
                    }
                }}
                product={editingProduct}
                categories={categories || []}
                token={token!}
                onSuccess={() => {
                    setIsCreateDialogOpen(false);
                    setEditingProduct(null);
                    queryClient.invalidateQueries({ queryKey: ["seller-products"] });
                    queryClient.invalidateQueries({ queryKey: ["seller-analytics"] });
                }}
            />
        </div>
    );
}

// Product Dialog Component
function ProductDialog({
    open,
    onOpenChange,
    product,
    categories,
    token,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    categories: Category[];
    token: string;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        categoryId: "",
        images: [""],
    });

    // Reset/Sync form data when product changes or dialog opens
    useEffect(() => {
        if (open) {
            if (product) {
                setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    price: product.price || 0,
                    stock: product.stock || 0,
                    categoryId: product.categoryId || "",
                    images: product.images && product.images.length > 0 ? product.images : [""],
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    price: 0,
                    stock: 0,
                    categoryId: "",
                    images: [""],
                });
            }
        }
    }, [open, product]);

    const mutation = useMutation({
        mutationFn: (data: ProductFormData) => {
            if (product) {
                return api.patch(`/seller/products/${product.id}`, data, token);
            }
            return api.post("/seller/products", data, token);
        },
        onSuccess: () => {
            toast.success(product ? "Product updated" : "Product created");
            onSuccess();
        },
        onError: () => {
            toast.error("Failed to save product");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
                    <DialogDescription>
                        {product ? "Update product details" : "Add a new product to your inventory"}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="price">Price (Le)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.categoryId}
                            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="image">Image URL</Label>
                        <Input
                            id="image"
                            value={formData.images[0]}
                            onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                            placeholder="https://example.com/image.jpg"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Saving..." : product ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
