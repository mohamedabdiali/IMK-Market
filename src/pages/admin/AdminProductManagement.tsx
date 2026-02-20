import { useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { ProductManagementItem, CategoryItem } from "@/types/admin";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  sku: "",
  badge: "",
  rating: "4.5",
  reviewCount: "0",
  freeShipping: false,
  inStock: true,
  images: [] as string[],
  videos: [] as string[],
  stock: "",
  lowStockThreshold: "10",
  sellerName: "",
  sellerEmail: "",
  country: "",
  status: "active",
};

const VIDEO_MAX_FILE_SIZE = 12 * 1024 * 1024;
const VIDEO_MAX_DURATION_SECONDS = 25;
const MAX_PRODUCT_VIDEOS = 2;

export default function AdminProductManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const usingMockApi = import.meta.env.VITE_USE_MOCK_API === "true";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<ProductManagementItem | null>(null);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.getAdminProducts(token || ""),
    enabled: Boolean(token),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.getCategoriesAdmin(token || ""),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.createAdminProduct(token || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowForm(false);
      setForm({ ...emptyForm });
      toast({ title: "Product added", description: "Product created successfully." });
    },
    onError: (error: Error) => {
      let message = error.message?.includes("Failed to fetch")
        ? "API server unreachable. Start the backend at http://localhost:5050 or update VITE_API_BASE_URL."
        : error.message || "Please check the form and try again.";
      if (!error.message?.includes("Failed to fetch")) {
        try {
          const parsed = JSON.parse(error.message) as {
            details?: { fieldErrors?: Record<string, string[]> };
          };
          const fields = parsed?.details?.fieldErrors
            ? Object.keys(parsed.details.fieldErrors)
            : [];
          if (fields.length > 0) {
            message = `Please check: ${fields.join(", ")}.`;
          }
        } catch {
          // keep default message
        }
      }
      toast({
        title: "Product creation failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: unknown }) =>
      api.updateAdminProduct(token || "", payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEditing(null);
      toast({ title: "Product updated", description: "Product updated successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAdminProduct(token || "", id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Product deleted", description: "Product removed successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = minPrice.trim().length ? Number.parseFloat(minPrice) : undefined;
    const max = maxPrice.trim().length ? Number.parseFloat(maxPrice) : undefined;

    return (products as ProductManagementItem[])
      .filter((product) => {
        const searchable = [
          product.name,
          product.sku,
          product.category,
          product.description,
          product.sellerName ?? "",
          product.sellerEmail ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !query || searchable.includes(query);
        const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || product.status === statusFilter;
        const stock = product.stock ?? 0;
        const lowStockThreshold = product.lowStockThreshold ?? 10;
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in-stock" && stock > 0) ||
          (stockFilter === "out-of-stock" && stock <= 0) ||
          (stockFilter === "low-stock" && stock <= lowStockThreshold);
        const matchesMin = min === undefined || product.price >= min;
        const matchesMax = max === undefined || product.price <= max;

        return matchesSearch && matchesCategory && matchesStatus && matchesStock && matchesMin && matchesMax;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || a.lastRestocked || 0).getTime();
        const bTime = new Date(b.createdAt || b.lastRestocked || 0).getTime();
        return bTime - aTime;
      });
  }, [products, search, categoryFilter, statusFilter, stockFilter, minPrice, maxPrice]);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
  };

  const priceValue = Number.parseFloat(form.price);
  const canCreate =
    form.name.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.category.trim().length > 0 &&
    form.images.length > 0 &&
    Number.isFinite(priceValue);

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

  const prepareImage = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to load image."));
    });
    img.src = dataUrl;
    await loaded;
    const maxSize = 800;
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale === 1) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  };

  const handleCreate = () => {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();
    const trimmedCategory = form.category.trim();
    const normalizedPrice = Number.parseFloat(form.price);
    const normalizedImages = form.images.map((img) => img.trim()).filter(Boolean);
    const normalizedVideos = form.videos.map((video) => video.trim()).filter(Boolean);
    const missing: string[] = [];

    if (!trimmedName) missing.push("name");
    if (!trimmedDescription) missing.push("description");
    if (!trimmedCategory) missing.push("category");
    if (normalizedImages.length === 0) missing.push("images");
    if (!Number.isFinite(normalizedPrice)) missing.push("price");
    if (normalizedImages.length > 10) missing.push("max 10 images");
    if (normalizedVideos.length > MAX_PRODUCT_VIDEOS) missing.push(`max ${MAX_PRODUCT_VIDEOS} videos`);

    if (missing.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please check: ${missing.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    if (isImageProcessing || isVideoProcessing) {
      toast({
        title: "Media still processing",
        description: "Please wait a moment for uploads to finish.",
        variant: "destructive",
      });
      return;
    }
    const invalidImage = normalizedImages.find(
      (img) => !(img.startsWith("data:") || img.startsWith("http") || img.startsWith("/assets/"))
    );
    if (invalidImage) {
      toast({
        title: "Invalid image",
        description: "Images must be valid uploaded media.",
        variant: "destructive",
      });
      return;
    }
    const invalidVideo = normalizedVideos.find(
      (video) => !(video.startsWith("data:") || video.startsWith("http") || video.startsWith("/assets/"))
    );
    if (invalidVideo) {
      toast({
        title: "Invalid video",
        description: "Videos must be valid uploaded media.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      name: trimmedName,
      description: trimmedDescription,
      price: normalizedPrice,
      originalPrice: form.originalPrice.trim().length
        ? Number.parseFloat(form.originalPrice)
        : undefined,
      category: trimmedCategory,
      images: normalizedImages,
      videos: normalizedVideos,
      sku: form.sku.trim() ? form.sku.trim() : undefined,
      badge: form.badge.trim() ? form.badge.trim() : undefined,
      rating: form.rating.trim().length ? Number.parseFloat(form.rating) : undefined,
      reviewCount: form.reviewCount.trim().length ? Number.parseInt(form.reviewCount, 10) : undefined,
      freeShipping: form.freeShipping,
      inStock: form.inStock,
      stock: Number.isFinite(Number.parseInt(form.stock, 10))
        ? Number.parseInt(form.stock, 10)
        : 0,
      lowStockThreshold: Number.isFinite(Number.parseInt(form.lowStockThreshold, 10))
        ? Number.parseInt(form.lowStockThreshold, 10)
        : 10,
      sellerName: form.sellerName.trim() ? form.sellerName.trim() : undefined,
      sellerEmail: form.sellerEmail.trim() ? form.sellerEmail.trim() : undefined,
      country: form.country.trim() ? form.country.trim() : undefined,
      status: form.status,
    });
  };

  const handleImagesUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = 10 - form.images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Image limit reached",
        description: "Each product can have up to 10 images.",
        variant: "destructive",
      });
      return;
    }
    setIsImageProcessing(true);
    try {
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const processed: string[] = [];
      for (const file of selectedFiles) {
        processed.push(await prepareImage(file));
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...processed] }));
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try another image.",
        variant: "destructive",
      });
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleEditImagesUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0 || !editing) return;
    const currentImages = (editing.images?.length ? editing.images : [editing.image]).filter(Boolean);
    const remainingSlots = 10 - currentImages.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Image limit reached",
        description: "Each product can have up to 10 images.",
        variant: "destructive",
      });
      return;
    }
    setIsImageProcessing(true);
    try {
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const processed: string[] = [];
      for (const file of selectedFiles) {
        processed.push(await prepareImage(file));
      }
      const nextImages = [...currentImages, ...processed];
      setEditing((prev) => (prev ? { ...prev, images: nextImages, image: nextImages[0] } : prev));
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try another image.",
        variant: "destructive",
      });
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleVideosUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_PRODUCT_VIDEOS - form.videos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Video limit reached",
        description: `Each product can have up to ${MAX_PRODUCT_VIDEOS} videos.`,
        variant: "destructive",
      });
      return;
    }
    setIsVideoProcessing(true);
    try {
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const processed: string[] = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith("video/")) {
          toast({ title: "Invalid video", description: "Upload a valid video file.", variant: "destructive" });
          continue;
        }
        if (file.size > VIDEO_MAX_FILE_SIZE) {
          toast({
            title: "Video too large",
            description: "Each video must be smaller than 12MB.",
            variant: "destructive",
          });
          continue;
        }
        const duration = await readVideoDuration(file);
        if (duration > VIDEO_MAX_DURATION_SECONDS + 0.5) {
          toast({
            title: "Video too long",
            description: `Videos must be ${VIDEO_MAX_DURATION_SECONDS} seconds or less.`,
            variant: "destructive",
          });
          continue;
        }
        processed.push(await readFileAsDataUrl(file));
      }
      if (processed.length > 0) {
        setForm((prev) => ({ ...prev, videos: [...prev.videos, ...processed] }));
      }
    } catch (error) {
      toast({
        title: "Video upload failed",
        description: error instanceof Error ? error.message : "Please try another video.",
        variant: "destructive",
      });
    } finally {
      setIsVideoProcessing(false);
    }
  };

  const handleEditVideosUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0 || !editing) return;
    const currentVideos = editing.videos?.length ? editing.videos : [];
    const remainingSlots = MAX_PRODUCT_VIDEOS - currentVideos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Video limit reached",
        description: `Each product can have up to ${MAX_PRODUCT_VIDEOS} videos.`,
        variant: "destructive",
      });
      return;
    }
    setIsVideoProcessing(true);
    try {
      const selectedFiles = Array.from(files).slice(0, remainingSlots);
      const processed: string[] = [];
      for (const file of selectedFiles) {
        if (!file.type.startsWith("video/")) {
          toast({ title: "Invalid video", description: "Upload a valid video file.", variant: "destructive" });
          continue;
        }
        if (file.size > VIDEO_MAX_FILE_SIZE) {
          toast({
            title: "Video too large",
            description: "Each video must be smaller than 12MB.",
            variant: "destructive",
          });
          continue;
        }
        const duration = await readVideoDuration(file);
        if (duration > VIDEO_MAX_DURATION_SECONDS + 0.5) {
          toast({
            title: "Video too long",
            description: `Videos must be ${VIDEO_MAX_DURATION_SECONDS} seconds or less.`,
            variant: "destructive",
          });
          continue;
        }
        processed.push(await readFileAsDataUrl(file));
      }
      if (processed.length > 0) {
        const nextVideos = [...currentVideos, ...processed];
        setEditing((prev) => (prev ? { ...prev, videos: nextVideos } : prev));
      }
    } catch (error) {
      toast({
        title: "Video upload failed",
        description: error instanceof Error ? error.message : "Please try another video.",
        variant: "destructive",
      });
    } finally {
      setIsVideoProcessing(false);
    }
  };


  const setCreateCoverImage = (index: number) => {
    setForm((prev) => {
      if (index <= 0 || index >= prev.images.length) return prev;
      const nextImages = [...prev.images];
      const [selected] = nextImages.splice(index, 1);
      nextImages.unshift(selected);
      return { ...prev, images: nextImages };
    });
  };

  const removeCreateImage = (index: number) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeCreateVideo = (index: number) => {
    setForm((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  };


  const setEditCoverImage = (index: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const currentImages = (prev.images?.length ? prev.images : [prev.image]).filter(Boolean);
      if (index <= 0 || index >= currentImages.length) return prev;
      const nextImages = [...currentImages];
      const [selected] = nextImages.splice(index, 1);
      nextImages.unshift(selected);
      return { ...prev, images: nextImages, image: nextImages[0] };
    });
  };

  const removeEditImage = (index: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const currentImages = (prev.images?.length ? prev.images : [prev.image]).filter(Boolean);
      if (currentImages.length <= 1) {
        toast({
          title: "At least one image required",
          description: "A product must have at least one image.",
          variant: "destructive",
        });
        return prev;
      }
      const nextImages = currentImages.filter((_, i) => i !== index);
      return { ...prev, images: nextImages, image: nextImages[0] };
    });
  };

  const removeEditVideo = (index: number) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const currentVideos = prev.videos?.length ? prev.videos : [];
      const nextVideos = currentVideos.filter((_, i) => i !== index);
      return { ...prev, videos: nextVideos };
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    if (isVideoProcessing || isImageProcessing) {
      toast({
        title: "Media still processing",
        description: "Please wait for uploads to finish before saving.",
        variant: "destructive",
      });
      return;
    }
    const normalizedImages = (editing.images?.length ? editing.images : [editing.image])
      .map((img) => img.trim())
      .filter(Boolean);
    const normalizedVideos = (editing.videos?.length ? editing.videos : [])
      .map((video) => video.trim())
      .filter(Boolean);

    if (!editing.name.trim() || !editing.description.trim() || !editing.category.trim()) {
      toast({
        title: "Missing required fields",
        description: "Name, category, and description are required.",
        variant: "destructive",
      });
      return;
    }
    if (normalizedImages.length === 0 || normalizedImages.length > 10) {
      toast({
        title: "Invalid images",
        description: "Each product must have 1-10 images.",
        variant: "destructive",
      });
      return;
    }
    if (normalizedVideos.length > MAX_PRODUCT_VIDEOS) {
      toast({
        title: "Invalid videos",
        description: `Each product can have up to ${MAX_PRODUCT_VIDEOS} videos.`,
        variant: "destructive",
      });
      return;
    }
    const invalidImage = normalizedImages.find(
      (img) => !(img.startsWith("data:") || img.startsWith("http") || img.startsWith("/assets/"))
    );
    if (invalidImage) {
      toast({
        title: "Invalid image",
        description: "Images must be valid uploaded media.",
        variant: "destructive",
      });
      return;
    }
    const invalidVideo = normalizedVideos.find(
      (video) => !(video.startsWith("data:") || video.startsWith("http") || video.startsWith("/assets/"))
    );
    if (invalidVideo) {
      toast({
        title: "Invalid video",
        description: "Videos must be valid uploaded media.",
        variant: "destructive",
      });
      return;
    }
    if (Number.isNaN(Number(editing.price))) {
      toast({
        title: "Invalid price",
        description: "Enter a valid price.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({
      id: editing.id,
      data: {
        name: editing.name.trim(),
        description: editing.description.trim(),
        price: editing.price,
        originalPrice: editing.originalPrice === undefined ? undefined : editing.originalPrice,
        category: editing.category.trim(),
        sku: editing.sku.trim(),
        badge: editing.badge === undefined ? undefined : editing.badge,
        rating: editing.rating === undefined ? undefined : editing.rating,
        reviewCount: editing.reviewCount === undefined ? undefined : editing.reviewCount,
        freeShipping: editing.freeShipping === undefined ? undefined : editing.freeShipping,
        inStock: editing.inStock === undefined ? undefined : editing.inStock,
        images: normalizedImages,
        videos: normalizedVideos,
        stock: editing.stock,
        lowStockThreshold: editing.lowStockThreshold,
        sellerName: editing.sellerName === undefined ? undefined : editing.sellerName,
        sellerEmail: editing.sellerEmail === undefined ? undefined : editing.sellerEmail,
        country: editing.country === undefined ? undefined : editing.country,
        status: editing.status,
      },
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        {usingMockApi && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Mock API is enabled. Product changes will not persist after refresh or server restart.
            Configure a real database to make products permanent.
          </div>
        )}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">Create, update, and manage products</p>
          </div>
          <Button onClick={() => setShowForm(true)}>Add Product</Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Search name, SKU, seller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {(categories as CategoryItem[]).map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="in-stock">In stock</SelectItem>
                <SelectItem value="out-of-stock">Out of stock</SelectItem>
                <SelectItem value="low-stock">Low stock</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Input
                placeholder="Max"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setSearch((prev) => prev.trim())}
              disabled={!search.trim().length}
            >
              Search
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage products.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading products...</div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] ?? product.image}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.status}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const normalizedImages = product.images?.length ? product.images : [product.image];
                          setEditing({
                            ...product,
                            image: normalizedImages[0] ?? product.image,
                            images: normalizedImages,
                            videos: product.videos ?? [],
                            badge: product.badge ?? null,
                            sellerName: product.sellerName ?? null,
                            sellerEmail: product.sellerEmail ?? null,
                            freeShipping: product.freeShipping ?? false,
                            inStock: product.inStock ?? (product.stock ?? 0) > 0,
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(product.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setForm({ ...emptyForm });
          }
        }}
      >
        <DialogContent className="flex flex-col h-[92vh] w-[96vw] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="SKU (optional)"
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
              />
              <Input
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
              />
              <Input
                placeholder="Original price (optional)"
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
              />
              <Select value={form.category} onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories as CategoryItem[]).map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              />
              <Input
                placeholder="Low stock threshold"
                type="number"
                value={form.lowStockThreshold}
                onChange={(e) => setForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
              />
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label htmlFor="create-free-shipping">Free shipping</Label>
                <Switch
                  id="create-free-shipping"
                  checked={form.freeShipping}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, freeShipping: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <Label htmlFor="create-in-stock">In stock</Label>
                <Switch
                  id="create-in-stock"
                  checked={form.inStock}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, inStock: checked }))}
                />
              </div>
              <Input
                placeholder="Badge (optional)"
                value={form.badge}
                onChange={(e) => setForm((prev) => ({ ...prev, badge: e.target.value }))}
              />
              <Input
                placeholder="Rating (0-5)"
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
              />
              <Input
                placeholder="Review count"
                type="number"
                value={form.reviewCount}
                onChange={(e) => setForm((prev) => ({ ...prev, reviewCount: e.target.value }))}
              />
              <Input
                placeholder="Seller name"
                value={form.sellerName}
                onChange={(e) => setForm((prev) => ({ ...prev, sellerName: e.target.value }))}
              />
              <Input
                placeholder="Seller email"
                value={form.sellerEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, sellerEmail: e.target.value }))}
              />
              <Input
                placeholder="Country"
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Input type="file" accept="image/*" multiple onChange={(e) => handleImagesUpload(e.target.files)} />
                <p className="text-xs text-muted-foreground">
                  {form.images.length}/10 images - click a thumbnail to set cover
                </p>
              </div>
              {isImageProcessing && (
                <p className="text-xs text-muted-foreground">Processing images...</p>
              )}
              {form.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {form.images.map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className="relative h-16 w-16 overflow-hidden rounded-md border border-border cursor-pointer"
                      onClick={() => setCreateCoverImage(idx)}
                      role="button"
                      tabIndex={0}
                    >
                      <img src={img} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs text-foreground shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCreateImage(idx);
                        }}
                        aria-label="Remove image"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Input type="file" accept="video/*" multiple onChange={(e) => handleVideosUpload(e.target.files)} />
                <p className="text-xs text-muted-foreground">
                  {form.videos.length}/{MAX_PRODUCT_VIDEOS} videos - max {VIDEO_MAX_DURATION_SECONDS}s each
                </p>
              </div>
              {isVideoProcessing && (
                <p className="text-xs text-muted-foreground">Processing videos...</p>
              )}
              {form.videos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {form.videos.map((video, idx) => (
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
                        onClick={() => removeCreateVideo(idx)}
                        aria-label="Remove video"
                      >
                        ?
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="min-h-[120px]"
              rows={4}
            />
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setShowForm(false)}>Exit</Button>
            <Button onClick={handleCreate} disabled={!canCreate || isImageProcessing || isVideoProcessing || createMutation.isPending}>
              {isImageProcessing || isVideoProcessing ? "Processing..." : createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="flex flex-col h-[92vh] w-[96vw] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                <Input value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
                <Input
                  type="number"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Original price (optional)"
                  value={editing.originalPrice ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      originalPrice: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <Select value={editing.category} onValueChange={(value) => setEditing({ ...editing, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories as CategoryItem[]).map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={editing.status} onValueChange={(value) => setEditing({ ...editing, status: value as "active" | "inactive" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={editing.stock}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  value={editing.lowStockThreshold}
                  onChange={(e) => setEditing({ ...editing, lowStockThreshold: Number(e.target.value) })}
                />
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <Label htmlFor="edit-free-shipping">Free shipping</Label>
                  <Switch
                    id="edit-free-shipping"
                    checked={Boolean(editing.freeShipping)}
                    onCheckedChange={(checked) => setEditing({ ...editing, freeShipping: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <Label htmlFor="edit-in-stock">In stock</Label>
                  <Switch
                    id="edit-in-stock"
                    checked={Boolean(editing.inStock)}
                    onCheckedChange={(checked) => setEditing({ ...editing, inStock: checked })}
                  />
                </div>
                <Input
                  placeholder="Badge (optional)"
                  value={editing.badge ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      badge: e.target.value.trim().length ? e.target.value : null,
                    })
                  }
                />
                <Input
                  placeholder="Rating (0-5)"
                  type="number"
                  step="0.1"
                  value={editing.rating ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      rating: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
                <Input
                  placeholder="Review count"
                  type="number"
                  value={editing.reviewCount ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      reviewCount: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
                <Input
                  placeholder="Seller name (optional)"
                  value={editing.sellerName ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sellerName: e.target.value.trim().length ? e.target.value : null,
                    })
                  }
                />
                <Input
                  placeholder="Seller email (optional)"
                  value={editing.sellerEmail ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sellerEmail: e.target.value.trim().length ? e.target.value : null,
                    })
                  }
                />
                <Input
                  placeholder="Country"
                  value={editing.country ?? ""}
                  onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input type="file" accept="image/*" multiple onChange={(e) => handleEditImagesUpload(e.target.files)} />
                  <p className="text-xs text-muted-foreground">
                    {(editing.images?.length ? editing.images : [editing.image]).filter(Boolean).length}/10 images - click a thumbnail to set cover
                  </p>
                </div>
                {isImageProcessing && (
                  <p className="text-xs text-muted-foreground">Processing images...</p>
                )}
                <div className="grid grid-cols-5 gap-2">
                  {(editing.images?.length ? editing.images : [editing.image])
                    .filter(Boolean)
                    .map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        className="relative h-16 w-16 overflow-hidden rounded-md border border-border cursor-pointer"
                        onClick={() => setEditCoverImage(idx)}
                        role="button"
                        tabIndex={0}
                      >
                        <img src={img} alt={`Product image ${idx + 1}`} className="h-full w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-background/80 px-1 text-xs text-foreground shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEditImage(idx);
                          }}
                          aria-label="Remove image"
                        >
                          X
                        </button>
                      </div>
                    ))}
                </div>

                <div className="space-y-2">
                  <Input type="file" accept="video/*" multiple onChange={(e) => handleEditVideosUpload(e.target.files)} />
                  <p className="text-xs text-muted-foreground">
                    {(editing.videos?.length ?? 0)}/{MAX_PRODUCT_VIDEOS} videos - max {VIDEO_MAX_DURATION_SECONDS}s each
                  </p>
                </div>
                {isVideoProcessing && (
                  <p className="text-xs text-muted-foreground">Processing videos...</p>
                )}
                {editing.videos && editing.videos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {editing.videos.map((video, idx) => (
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
                          onClick={() => removeEditVideo(idx)}
                          aria-label="Remove video"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                placeholder="Description"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={4}
              />
            </div>
          )}
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setEditing(null)}>Exit</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
