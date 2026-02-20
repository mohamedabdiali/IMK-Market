import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingCart, DollarSign, TrendingUp, X } from "lucide-react";
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
    image?: string;
    videos?: string[];
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
    videos: string[];
}

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 12 * 1024 * 1024;
const VIDEO_MAX_DURATION_SECONDS = 25;
const MAX_PRODUCT_VIDEOS = 2;

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
        images: [],
        videos: [],
    });
    const [isImageProcessing, setIsImageProcessing] = useState(false);
    const [isVideoProcessing, setIsVideoProcessing] = useState(false);

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
                    images: product.images && product.images.length > 0 ? product.images : product.image ? [product.image] : [],
                    videos: product.videos && product.videos.length > 0 ? product.videos : [],
                });
            } else {
                setFormData({
                    name: "",
                    description: "",
                    price: 0,
                    stock: 0,
                    categoryId: "",
                    images: [],
                    videos: [],
                });
            }
        }
    }, [open, product]);

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Unable to read image file."));
            reader.readAsDataURL(file);
        });

    const readVideoDuration = (file: File) =>
        new Promise<number>((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                const duration = Number.isFinite(video.duration) ? video.duration : 0;
                URL.revokeObjectURL(url);
                resolve(duration);
            };
            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Unable to read video metadata."));
            };
            video.src = url;
        });

    const handleImagesUpload = async (files?: FileList | null) => {
        if (!files || files.length === 0) return;
        const selectedFiles = Array.from(files);
        const invalid = selectedFiles.find((file) => !file.type.startsWith("image/"));
        if (invalid) {
            toast.error("Please upload only image files.");
            return;
        }
        const tooLarge = selectedFiles.find((file) => file.size > IMAGE_MAX_FILE_SIZE);
        if (tooLarge) {
            toast.error("Each image must be smaller than 5MB.");
            return;
        }
        setIsImageProcessing(true);
        try {
            const processed: string[] = [];
            for (const file of selectedFiles) {
                processed.push(await readFileAsDataUrl(file));
            }
            setFormData((prev) => ({ ...prev, images: [...prev.images, ...processed] }));
        } catch {
            toast.error("Image upload failed. Please try again.");
        } finally {
            setIsImageProcessing(false);
        }
    };

    const handleVideosUpload = async (files?: FileList | null) => {
        if (!files || files.length === 0) return;
        const remainingSlots = MAX_PRODUCT_VIDEOS - formData.videos.length;
        if (remainingSlots <= 0) {
            toast.error(`Each product can have up to ${MAX_PRODUCT_VIDEOS} videos.`);
            return;
        }
        setIsVideoProcessing(true);
        try {
            const selectedFiles = Array.from(files).slice(0, remainingSlots);
            const processed: string[] = [];
            for (const file of selectedFiles) {
                if (!file.type.startsWith("video/")) {
                    toast.error("Please upload only video files.");
                    continue;
                }
                if (file.size > VIDEO_MAX_FILE_SIZE) {
                    toast.error("Each video must be smaller than 12MB.");
                    continue;
                }
                const duration = await readVideoDuration(file);
                if (duration > VIDEO_MAX_DURATION_SECONDS + 0.5) {
                    toast.error(`Videos must be ${VIDEO_MAX_DURATION_SECONDS} seconds or less.`);
                    continue;
                }
                processed.push(await readFileAsDataUrl(file));
            }
            if (processed.length > 0) {
                setFormData((prev) => ({ ...prev, videos: [...prev.videos, ...processed] }));
            }
        } catch {
            toast.error("Video upload failed. Please try again.");
        } finally {
            setIsVideoProcessing(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const removeVideo = (index: number) => {
        setFormData((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
    };

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
        if (isVideoProcessing || isImageProcessing) {
            toast.error("Please wait for media uploads to finish.");
            return;
        }
        if (!formData.images || formData.images.length === 0) {
            toast.error("Please upload at least one product image.");
            return;
        }
        mutation.mutate({ ...formData, images: formData.images, videos: formData.videos });
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
                    <div className="space-y-2">
                        <Label htmlFor="product-images">Product Images</Label>
                        <Input
                            id="product-images"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImagesUpload(e.target.files)}
                        />
                        {isImageProcessing && (
                            <p className="text-xs text-muted-foreground">Processing images...</p>
                        )}
                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-5 gap-2">
                                {formData.images.map((img, idx) => (
                                    <div
                                        key={`${img}-${idx}`}
                                        className="relative h-16 w-16 overflow-hidden rounded-md border border-border"
                                    >
                                        <img src={img} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs text-foreground shadow"
                                            onClick={() => removeImage(idx)}
                                            aria-label="Remove image"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="product-videos">Product Videos</Label>
                        <Input
                            id="product-videos"
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={(e) => handleVideosUpload(e.target.files)}
                        />
                        <p className="text-xs text-muted-foreground">
                            {formData.videos.length}/{MAX_PRODUCT_VIDEOS} videos - max {VIDEO_MAX_DURATION_SECONDS}s each
                        </p>
                        {isVideoProcessing && (
                            <p className="text-xs text-muted-foreground">Processing videos...</p>
                        )}
                        {formData.videos.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {formData.videos.map((video, idx) => (
                                    <div
                                        key={`${video}-${idx}`}
                                        className="relative h-24 overflow-hidden rounded-md border border-border"
                                    >
                                        <video
                                            src={video}
                                            className="h-full w-full object-cover"
                                            controls
                                            muted
                                            playsInline
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-2 rounded bg-background/80 px-1 text-xs text-foreground shadow"
                                            onClick={() => removeVideo(idx)}
                                            aria-label="Remove video"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Exit
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
