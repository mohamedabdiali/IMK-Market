import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image as ImageIcon, Package, Video, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { categories } from "@/data/products";
import { api } from "@/lib/api";

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 8 * 1024 * 1024;
const IMAGE_MAX_DIMENSION = 1400;

const createInitialForm = () => ({
  productName: "",
  category: "",
  price: "",
  description: "",
  location: "",
  name: "",
  email: "",
  phone: "",
});

const getSellErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return "Unable to submit your product. Please try again.";
  const message = error.message || "";
  if (/request entity too large/i.test(message)) {
    return "Selected media files are too large. Use a smaller image/video and try again.";
  }
  if (/invalid payload/i.test(message)) {
    return "Please check the form fields and upload a valid image/video file.";
  }
  if (message.includes("<!DOCTYPE")) {
    return "The server rejected the upload. Please reduce file size and try again.";
  }
  return "Unable to submit your product right now. Please try again.";
};

export default function Sell() {
  const [formData, setFormData] = useState(createInitialForm);
  const [productImage, setProductImage] = useState("");
  const [productImageName, setProductImageName] = useState("");
  const [productVideo, setProductVideo] = useState("");
  const [productVideoName, setProductVideoName] = useState("");
  const [productVideoPreviewUrl, setProductVideoPreviewUrl] = useState("");
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (productVideoPreviewUrl) URL.revokeObjectURL(productVideoPreviewUrl);
    };
  }, [productVideoPreviewUrl]);

  const resetUploads = () => {
    setProductImage("");
    setProductImageName("");
    setProductVideo("");
    setProductVideoName("");
    if (productVideoPreviewUrl) URL.revokeObjectURL(productVideoPreviewUrl);
    setProductVideoPreviewUrl("");
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  const prepareImage = async (file: File) => {
    const rawDataUrl = await readFileAsDataUrl(file);
    if (!rawDataUrl.startsWith("data:image/")) return rawDataUrl;
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Unable to process image."));
    });
    img.src = rawDataUrl;
    await loaded;

    const scale = Math.min(1, IMAGE_MAX_DIMENSION / Math.max(img.width, img.height));
    if (scale === 1) return rawDataUrl;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  };

  const clearImage = () => {
    setProductImage("");
    setProductImageName("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const clearVideo = () => {
    setProductVideo("");
    setProductVideoName("");
    if (productVideoPreviewUrl) URL.revokeObjectURL(productVideoPreviewUrl);
    setProductVideoPreviewUrl("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid image file",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > IMAGE_MAX_FILE_SIZE) {
      toast({
        title: "Image too large",
        description: "Use an image smaller than 5MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setIsImageProcessing(true);
    try {
      const prepared = await prepareImage(file);
      setProductImage(prepared);
      setProductImageName(file.name);
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try another image.",
        variant: "destructive",
      });
    } finally {
      setIsImageProcessing(false);
      event.target.value = "";
    }
  };

  const handleVideoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid video file",
        description: "Please select a valid video file.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (file.size > VIDEO_MAX_FILE_SIZE) {
      toast({
        title: "Video too large",
        description: "Use a video smaller than 8MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    setIsVideoProcessing(true);
    try {
      const encodedVideo = await readFileAsDataUrl(file);
      if (!encodedVideo.startsWith("data:video/")) {
        throw new Error("Unsupported video format.");
      }

      if (productVideoPreviewUrl) URL.revokeObjectURL(productVideoPreviewUrl);
      setProductVideoPreviewUrl(URL.createObjectURL(file));
      setProductVideo(encodedVideo);
      setProductVideoName(file.name);
    } catch (error) {
      toast({
        title: "Video upload failed",
        description: error instanceof Error ? error.message : "Please try another video.",
        variant: "destructive",
      });
    } finally {
      setIsVideoProcessing(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      toast({
        title: "Category required",
        description: "Please select a category before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!productImage) {
      toast({
        title: "Product image required",
        description: "Upload at least one product image.",
        variant: "destructive",
      });
      return;
    }

    if (isImageProcessing || isVideoProcessing) {
      toast({
        title: "Media is still processing",
        description: "Please wait for upload processing to complete.",
        variant: "destructive",
      });
      return;
    }

    const price = Number.parseFloat(formData.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    const selectedCategory = categories.find((cat) => cat.id === formData.category);
    const categoryName = selectedCategory?.name || formData.category;

    setIsSubmitting(true);
    try {
      await api.submitSellerProduct({
        name: formData.productName.trim(),
        category: categoryName,
        price,
        description: formData.description.trim(),
        location: formData.location.trim(),
        sellerName: formData.name.trim(),
        sellerEmail: formData.email.trim(),
        phone: formData.phone.trim(),
        image: productImage,
        video: productVideo || undefined,
      });

      toast({
        title: "Product Submitted!",
        description: "Your product has been submitted for review. We'll notify you once approved.",
      });
      setFormData(createInitialForm());
      resetUploads();
    } catch (error) {
      toast({
        title: "Submission failed",
        description: getSellErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-12">
          <div className="container text-center">
            <Package className="h-12 w-12 mx-auto text-accent mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              Sell Your <span className="text-accent">Products</span>
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              List your products on IMK-Market and reach thousands of customers across the globe.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-3xl">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm p-6 md:p-8 space-y-6 border border-border">
              <h2 className="text-xl font-bold border-b pb-4">Product Information</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Name *</label>
                  <Input
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category *</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
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
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price (Le) *</label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location *</label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Product Description *</label>
                <Textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product in detail..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Image *</label>
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent/50 transition-colors"
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt="Selected product"
                        className="mx-auto h-36 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="py-5">
                        <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload image</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">Max 5MB</p>
                      </div>
                    )}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {productImageName || "No image selected"}
                    </p>
                    {productImage && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearImage} className="h-7 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Video (Optional)</label>
                  <Input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent/50 transition-colors"
                  >
                    {productVideoPreviewUrl ? (
                      <video
                        src={productVideoPreviewUrl}
                        controls
                        className="mx-auto h-36 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="py-5">
                        <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload video</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">MP4/MOV/WebM, max 8MB</p>
                      </div>
                    )}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {productVideoName || "No video selected"}
                    </p>
                    {productVideo && (
                      <Button type="button" variant="ghost" size="sm" onClick={clearVideo} className="h-7 px-2 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold border-b pb-4 pt-4">Seller Information</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isSubmitting || isImageProcessing || isVideoProcessing}
              >
                {isSubmitting ? "Submitting Product..." : isImageProcessing || isVideoProcessing ? "Processing Media..." : "Submit Product for Review"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
