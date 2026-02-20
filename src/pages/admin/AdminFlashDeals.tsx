import { useEffect, useMemo, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { ProductManagementItem } from "@/types/admin";

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 8 * 1024 * 1024;

interface FlashDealCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  cta?: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  animation?: "none" | "pulse" | "float" | "zoom";
}

interface FlashDealsSetting {
  title: string;
  subtitle: string;
  endsAt: string | null;
  productIds: string[];
  cards: FlashDealCard[];
}

const defaultFlashDeals: FlashDealsSetting = {
  title: "Flash Deals",
  subtitle: "Limited time offers - up to 30% off.",
  endsAt: null,
  productIds: [],
  cards: [],
};

const emptyCard: FlashDealCard = {
  id: "",
  title: "",
  subtitle: "",
  badge: "",
  price: "",
  cta: "",
  mediaType: "image",
  mediaUrl: "",
  animation: "none",
};

export default function AdminFlashDeals() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<FlashDealsSetting>(defaultFlashDeals);
  const [cardForm, setCardForm] = useState<FlashDealCard>({ ...emptyCard });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isCardMediaProcessing, setIsCardMediaProcessing] = useState(false);

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
      cards: Array.isArray(setting.cards) ? (setting.cards as FlashDealCard[]) : [],
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

  const createCardId = () =>
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  const handleCardImageUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid image", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > IMAGE_MAX_FILE_SIZE) {
      toast({ title: "Image too large", description: "Use an image smaller than 5MB.", variant: "destructive" });
      return;
    }
    setIsCardMediaProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCardForm((prev) => ({ ...prev, mediaUrl: dataUrl, mediaType: "image" }));
    } catch (error) {
      toast({
        title: "Image upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCardMediaProcessing(false);
    }
  };

  const handleCardVideoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid video", description: "Please upload a video file.", variant: "destructive" });
      return;
    }
    if (file.size > VIDEO_MAX_FILE_SIZE) {
      toast({ title: "Video too large", description: "Use a video smaller than 8MB.", variant: "destructive" });
      return;
    }
    setIsCardMediaProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCardForm((prev) => ({ ...prev, mediaUrl: dataUrl, mediaType: "video" }));
    } catch (error) {
      toast({
        title: "Video upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCardMediaProcessing(false);
    }
  };

  const handleSaveCard = () => {
    if (!cardForm.mediaUrl) {
      toast({ title: "Media required", description: "Upload an image or video for the card.", variant: "destructive" });
      return;
    }
    const id = editingCardId || createCardId();
    const nextCard: FlashDealCard = {
      ...cardForm,
      id,
      title: cardForm.title?.trim() || "Flash Deal",
      subtitle: cardForm.subtitle?.trim() || "",
      badge: cardForm.badge?.trim() || "",
      price: cardForm.price?.trim() || "",
      cta: cardForm.cta?.trim() || "",
      animation: cardForm.animation || "none",
    };
    setDraft((prev) => {
      const cards = editingCardId
        ? prev.cards.map((card) => (card.id === editingCardId ? nextCard : card))
        : [...prev.cards, nextCard];
      return { ...prev, cards };
    });
    setCardForm({ ...emptyCard });
    setEditingCardId(null);
  };

  const handleEditCard = (card: FlashDealCard) => {
    setEditingCardId(card.id);
    setCardForm({ ...card });
  };

  const handleRemoveCard = (id: string) => {
    setDraft((prev) => ({ ...prev, cards: prev.cards.filter((card) => card.id !== id) }));
    if (editingCardId === id) {
      setEditingCardId(null);
      setCardForm({ ...emptyCard });
    }
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
                <CardTitle>Custom Flash Deal Cards</CardTitle>
                <CardDescription>Create promotional cards with media, text, and animations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="card-title">Title</Label>
                    <Input
                      id="card-title"
                      placeholder="Flash Deal"
                      value={cardForm.title}
                      onChange={(e) => setCardForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="card-badge">Badge</Label>
                    <Input
                      id="card-badge"
                      placeholder="RAMADAN DISCOUNT"
                      value={cardForm.badge}
                      onChange={(e) => setCardForm((prev) => ({ ...prev, badge: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="card-price">Price Text</Label>
                    <Input
                      id="card-price"
                      placeholder="Le 25.00"
                      value={cardForm.price}
                      onChange={(e) => setCardForm((prev) => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="card-cta">CTA Text</Label>
                    <Input
                      id="card-cta"
                      placeholder="Shop Now"
                      value={cardForm.cta}
                      onChange={(e) => setCardForm((prev) => ({ ...prev, cta: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="card-subtitle">Subtitle</Label>
                  <Textarea
                    id="card-subtitle"
                    placeholder="Customer bonus ads, rewards, and seasonal savings."
                    rows={2}
                    value={cardForm.subtitle}
                    onChange={(e) => setCardForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Card Media</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm">
                        <label className="cursor-pointer">
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleCardImageUpload(e.target.files)}
                          />
                        </label>
                      </Button>
                      <Button type="button" variant="outline" size="sm">
                        <label className="cursor-pointer">
                          Upload Video
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) => handleCardVideoUpload(e.target.files)}
                          />
                        </label>
                      </Button>
                      {cardForm.mediaUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCardForm((prev) => ({ ...prev, mediaUrl: "" }))}
                        >
                          Clear Media
                        </Button>
                      )}
                    </div>
                    {isCardMediaProcessing && (
                      <p className="text-xs text-muted-foreground">Processing media...</p>
                    )}
                    {cardForm.mediaUrl && (
                      <div className="rounded-lg border border-border/60 overflow-hidden">
                        {cardForm.mediaType === "video" ? (
                          <video
                            src={cardForm.mediaUrl}
                            className="h-36 w-full object-cover"
                            muted
                            loop
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <img src={cardForm.mediaUrl} alt="Flash card" className="h-36 w-full object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Animation</Label>
                    <Select
                      value={cardForm.animation || "none"}
                      onValueChange={(value) =>
                        setCardForm((prev) => ({
                          ...prev,
                          animation: value as FlashDealCard["animation"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="pulse">Pulse</SelectItem>
                        <SelectItem value="float">Float</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Animation applies to the promo card on the homepage.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleSaveCard}
                    disabled={isCardMediaProcessing || !cardForm.mediaUrl}
                  >
                    {editingCardId ? "Update Card" : "Add Card"}
                  </Button>
                  {editingCardId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingCardId(null);
                        setCardForm({ ...emptyCard });
                      }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </div>

                {draft.cards.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {draft.cards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-lg border border-border/60 p-3 flex gap-3 items-start"
                      >
                        <div className="h-16 w-16 rounded-md overflow-hidden border border-border/60">
                          {card.mediaType === "video" ? (
                            <video
                              src={card.mediaUrl}
                              className="h-full w-full object-cover"
                              muted
                              loop
                              playsInline
                              autoPlay
                            />
                          ) : (
                            <img src={card.mediaUrl} alt={card.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{card.title}</p>
                          <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Animation: {card.animation || "none"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCard(card)}>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleRemoveCard(card.id)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
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
