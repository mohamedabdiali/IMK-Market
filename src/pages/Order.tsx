import { useEffect, useMemo, useState } from "react";
import { ChangeEvent, useRef } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Image as ImageIcon, Minus, Package, Plus, ShieldCheck, ShoppingCart, Video, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

const cargoTypes = [
  { value: "air", label: "Air Cargo" },
  { value: "sea", label: "Sea Cargo" },
  { value: "land", label: "Land Cargo" },
];

const paymentOptions = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "orange_money", label: "Orange Money" },
  { value: "afrimoney", label: "Africell Money (AfriMoney)" },
  { value: "qmoney", label: "QMoney" },
  { value: "paystack", label: "Card / Bank (Paystack)" },
];

const paymentLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  orange_money: "Orange Money",
  afrimoney: "Africell Money",
  qmoney: "QMoney",
  paystack: "Card / Bank (Paystack)",
};

const paymentNumbers: Record<string, string> = {
  orange_money: "+23272213586",
  afrimoney: "+232-76-123-456",
  qmoney: "+232-76-123-456",
};

const PAYMENT_PROOF_IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const PAYMENT_PROOF_VIDEO_MAX_FILE_SIZE = 8 * 1024 * 1024;
const PAYMENT_PROOF_IMAGE_MAX_DIMENSION = 1400;

type PaymentSession = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  reference: string;
  paymentMethod: string;
  instructions?: string[];
  paymentUrl?: string | null;
  requiresRedirect?: boolean;
  orderId?: string;
  trackingNumber?: string | null;
  updatedAt?: string;
};

const paymentGuides: Record<string, { title: string; steps: string[] }> = {
  cod: {
    title: "Pay on Delivery",
    steps: [
      "Place your order now and pay when it arrives.",
      "Our team will call to confirm delivery details.",
    ],
  },
  orange_money: {
    title: "Orange Money",
    steps: [
      "Send payment to +23272213586 (IMK-MARKET).",
      "A payment reference will be generated after you proceed.",
      "Your order will be created once payment is confirmed.",
    ],
  },
  afrimoney: {
    title: "Africell Money",
    steps: [
      "Send payment to +232-76-123-456 (IMK-MARKET).",
      "A payment reference will be generated after you proceed.",
      "Your order will be created once payment is confirmed.",
    ],
  },
  qmoney: {
    title: "QMoney",
    steps: [
      "Send payment to +232-76-123-456 (IMK-MARKET).",
      "A payment reference will be generated after you proceed.",
      "Your order will be created once payment is confirmed.",
    ],
  },
  paystack: {
    title: "Card / Bank Payment",
    steps: [
      "Proceed to payment to generate a secure card payment link.",
      "Your order will be created once payment is confirmed.",
    ],
  },
};

export default function Order() {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [formData, setFormData] = useState({
    cargoType: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ id: string; total: number; paymentStatus: string; trackingNumber?: string | null } | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentSession | null>(null);
  const [paymentProofImage, setPaymentProofImage] = useState("");
  const [paymentProofImageName, setPaymentProofImageName] = useState("");
  const [paymentProofVideo, setPaymentProofVideo] = useState("");
  const [paymentProofVideoName, setPaymentProofVideoName] = useState("");
  const [paymentProofVideoPreviewUrl, setPaymentProofVideoPreviewUrl] = useState("");
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const isPaymentPending = paymentState?.status === "pending";

  const orderItems = useMemo(
    () =>
      items.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    [items]
  );

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedPaymentNumber = paymentNumbers[formData.paymentMethod] || "+232-76-123-456";

  const clearPaymentProofImage = () => {
    setPaymentProofImage("");
    setPaymentProofImageName("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const clearPaymentProofVideo = () => {
    setPaymentProofVideo("");
    setPaymentProofVideoName("");
    if (paymentProofVideoPreviewUrl) URL.revokeObjectURL(paymentProofVideoPreviewUrl);
    setPaymentProofVideoPreviewUrl("");
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const clearPaymentProofs = () => {
    clearPaymentProofImage();
    clearPaymentProofVideo();
  };

  useEffect(() => {
    if (!paymentState || paymentState.status !== "pending") return;
    const interval = window.setInterval(async () => {
      try {
        const latest = (await api.getPaymentStatus(paymentState.id)) as PaymentSession;
        setPaymentState((prev) => ({ ...(prev || paymentState), ...latest }));
        const paid = latest.status === "paid";
        const orderId = latest.orderId;
        if (paid && orderId) {
          setOrderResult({
            id: orderId,
            total: latest.amount,
            paymentStatus: "paid",
            trackingNumber: latest.trackingNumber || null,
          });
          clearCart();
        }
      } catch {
        // keep polling silently
      }
    }, 4000);
    return () => window.clearInterval(interval);
  }, [paymentState, clearCart]);

  useEffect(() => {
    return () => {
      if (paymentProofVideoPreviewUrl) URL.revokeObjectURL(paymentProofVideoPreviewUrl);
    };
  }, [paymentProofVideoPreviewUrl]);

  useEffect(() => {
    if (formData.paymentMethod === "cod") {
      clearPaymentProofs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.paymentMethod]);

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

    const scale = Math.min(1, PAYMENT_PROOF_IMAGE_MAX_DIMENSION / Math.max(img.width, img.height));
    if (scale === 1) return rawDataUrl;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  };

  const handleProofImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > PAYMENT_PROOF_IMAGE_MAX_FILE_SIZE) {
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
      setPaymentProofImage(prepared);
      setPaymentProofImageName(file.name);
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

  const handleProofVideoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > PAYMENT_PROOF_VIDEO_MAX_FILE_SIZE) {
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

      if (paymentProofVideoPreviewUrl) URL.revokeObjectURL(paymentProofVideoPreviewUrl);
      setPaymentProofVideoPreviewUrl(URL.createObjectURL(file));
      setPaymentProofVideo(encodedVideo);
      setPaymentProofVideoName(file.name);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products before placing an order.",
        variant: "destructive",
      });
      return;
    }

    if (isImageProcessing || isVideoProcessing) {
      toast({
        title: "Media is still processing",
        description: "Please wait until payment proof upload finishes.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.paymentMethod === "cod") {
        const result = await api.createOrder({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          paymentMethod: formData.paymentMethod,
          cargoType: formData.cargoType || undefined,
          paymentProofImage: paymentProofImage || undefined,
          paymentProofVideo: paymentProofVideo || undefined,
          items: orderItems,
        });
        setOrderResult(result as { id: string; total: number; paymentStatus: string; trackingNumber?: string | null });
        setPaymentState(null);
        clearPaymentProofs();
        clearCart();
        toast({
          title: "Order Placed!",
          description: "Your order has been placed successfully. You'll receive a confirmation email shortly.",
        });
      } else {
        const payment = await api.initiatePayment({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          paymentMethod: formData.paymentMethod,
          cargoType: formData.cargoType || undefined,
          paymentProofImage: paymentProofImage || undefined,
          paymentProofVideo: paymentProofVideo || undefined,
          items: orderItems,
        });
        setPaymentState(payment as PaymentSession);
        setOrderResult(null);
        toast({
          title: "Payment initiated",
          description: "Complete the payment to create your order.",
        });
      }
    } catch (error) {
      toast({
        title: "Order failed",
        description: "Please try again or contact support.",
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
        <section className="bg-primary py-12">
          <div className="container text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-accent mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              Checkout <span className="text-accent">Order</span>
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Review your cart and complete payment to place your order.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-6xl">
            {items.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm p-10 text-center border border-border">
                <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Add products to continue checkout.</p>
                <Link to="/products">
                  <Button variant="gold">Browse Products</Button>
                </Link>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-card rounded-xl shadow-sm p-6 md:p-8 border border-border">
                    <h2 className="text-xl font-bold mb-4">Cart Items</h2>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 border border-border/60 rounded-lg p-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm p-6 md:p-8 space-y-6 border border-border">
                    <h2 className="text-xl font-bold border-b pb-4">Shipping Information</h2>
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
                        placeholder="+232-76-123-456"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Shipping Address *</label>
                      <Input
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Full shipping address"
                      />
                    </div>

                    <h2 className="text-xl font-bold border-b pb-4 pt-4">Shipping & Payment</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Cargo Type</label>
                        <Select
                          value={formData.cargoType}
                          onValueChange={(value) => setFormData({ ...formData, cargoType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cargo type" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargoTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Payment Method *</label>
                        <Select
                          value={formData.paymentMethod}
                          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="bg-secondary/30 border border-border rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CreditCard className="h-4 w-4 text-accent" />
                        {paymentGuides[formData.paymentMethod].title}
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                        {paymentGuides[formData.paymentMethod].steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ul>
                      <div className="text-xs text-muted-foreground">
                        You will receive a payment reference after you proceed.
                      </div>
                    </div>

                    {formData.paymentMethod !== "cod" && (
                      <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
                        <div>
                          <h3 className="text-sm font-semibold">Payment Proof Upload (Optional)</h3>
                          <p className="text-xs text-muted-foreground">
                            Upload a receipt screenshot or transaction video for faster verification.
                          </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Proof Image</label>
                            <Input
                              ref={imageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProofImageSelect}
                            />
                            <button
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-accent/50 transition-colors"
                            >
                              {paymentProofImage ? (
                                <img
                                  src={paymentProofImage}
                                  alt="Payment proof"
                                  className="mx-auto h-28 w-full rounded-md object-cover"
                                />
                              ) : (
                                <div className="py-4">
                                  <ImageIcon className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-xs text-muted-foreground">Upload image (max 5MB)</p>
                                </div>
                              )}
                            </button>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {paymentProofImageName || "No image selected"}
                              </p>
                              {paymentProofImage && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearPaymentProofImage} className="h-7 px-2 text-xs">
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Proof Video</label>
                            <Input
                              ref={videoInputRef}
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleProofVideoSelect}
                            />
                            <button
                              type="button"
                              onClick={() => videoInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-accent/50 transition-colors"
                            >
                              {paymentProofVideoPreviewUrl ? (
                                <video
                                  src={paymentProofVideoPreviewUrl}
                                  controls
                                  className="mx-auto h-28 w-full rounded-md object-cover"
                                />
                              ) : (
                                <div className="py-4">
                                  <Video className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-xs text-muted-foreground">Upload video (max 8MB)</p>
                                </div>
                              )}
                            </button>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate">
                                {paymentProofVideoName || "No video selected"}
                              </p>
                              {paymentProofVideo && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearPaymentProofVideo} className="h-7 px-2 text-xs">
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting || isPaymentPending || isImageProcessing || isVideoProcessing}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : isImageProcessing || isVideoProcessing
                          ? "Processing Media..."
                          : formData.paymentMethod === "cod"
                          ? "Place Order"
                          : "Proceed to Payment"}
                    </Button>
                  </form>

                  {paymentState && paymentState.status === "pending" && (
                    <div className="bg-secondary/40 border border-border rounded-xl p-6 space-y-3">
                      <h3 className="font-semibold text-lg">Payment Pending</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete the payment to finalize your order. We will create the order automatically after confirmation.
                      </p>
                      <div className="text-sm space-y-1">
                        <p>
                          Amount: <span className="font-semibold">{formatCurrency(paymentState.amount)} ({paymentState.currency})</span>
                        </p>
                        <p>
                          Reference: <span className="font-semibold">{paymentState.reference}</span>
                        </p>
                      </div>
                      {paymentState.instructions && (
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                          {paymentState.instructions.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {paymentState.requiresRedirect && paymentState.paymentUrl && (
                          <Button asChild variant="gold">
                            <a href={paymentState.paymentUrl} target="_blank" rel="noreferrer">
                              Pay Now
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const latest = (await api.getPaymentStatus(paymentState.id)) as PaymentSession;
                              setPaymentState((prev) => ({ ...(prev || paymentState), ...latest }));
                              if (latest.status === "paid" && latest.orderId) {
                                setOrderResult({
                                  id: latest.orderId,
                                  total: latest.amount,
                                  paymentStatus: "paid",
                                  trackingNumber: latest.trackingNumber || null,
                                });
                                clearCart();
                              }
                            } catch {
                              toast({
                                title: "Unable to check status",
                                description: "Please try again in a moment.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Refresh Status
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentState && paymentState.status === "failed" && (
                    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-sm">
                      <div className="font-semibold mb-2 text-destructive">Payment Failed</div>
                      <p className="text-muted-foreground">
                        We could not confirm the payment. Please try again or choose another payment method.
                      </p>
                    </div>
                  )}

                  {orderResult && (
                    <div className="space-y-4">
                      <div className="bg-success/10 border border-success/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <ShieldCheck className="h-5 w-5 text-success" />
                          <h3 className="font-semibold">Order Confirmed</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order ID: <span className="font-semibold text-foreground">{orderResult.id}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Payment Status: <span className="font-semibold text-foreground">{orderResult.paymentStatus}</span>
                        </p>
                        <Link
                          to={`/track-order?orderId=${encodeURIComponent(orderResult.id)}${
                            orderResult.trackingNumber
                              ? `&trackingNumber=${encodeURIComponent(orderResult.trackingNumber)}`
                              : ""
                          }`}
                        >
                          <Button variant="outline" className="mt-4">
                            Track This Order
                          </Button>
                        </Link>
                      </div>

                      {formData.paymentMethod !== "cod" && (
                        <div className="bg-secondary/40 border border-border rounded-xl p-6 text-sm">
                          <div className="font-semibold mb-2">Payment Instructions</div>
                          {formData.paymentMethod === "paystack" ? (
                            <p className="text-muted-foreground">
                              We will send a secure payment link to <span className="font-medium">{formData.email}</span>.
                              Complete the payment to confirm your order.
                            </p>
                          ) : (
                            <div className="text-muted-foreground space-y-1">
                              <p>
                                Send payment via <span className="font-medium">{paymentLabels[formData.paymentMethod]}</span> to
                                <span className="font-medium"> {selectedPaymentNumber}</span>.
                              </p>
                              <p>
                                Use reference: <span className="font-medium">{paymentState?.reference || orderResult.id}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="bg-card rounded-xl shadow-sm p-6 border border-border sticky top-32">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-accent" />
                      Order Summary
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Items</span>
                        <span>{totalItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-success">Calculated at checkout</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-accent">{formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 text-xs text-muted-foreground">
                      Need help? Call +232-76-123-456 or email info@imkmarket.com
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}


