import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
const VIDEO_MAX_FILE_SIZE = 8 * 1024 * 1024;

type AdAnimation = "none" | "pulse" | "float" | "zoom";

interface FlashAd {
  id: string;
  slot: "left" | "right";
  title: string;
  subtitle?: string;
  text?: string;
  badge?: string;
  cta?: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  animation?: AdAnimation;
}

interface FlashAdsSetting {
  ads: FlashAd[];
}

const createEmptyAd = (slot: "left" | "right"): FlashAd => ({
  id: "",
  slot,
  title: "",
  subtitle: "",
  text: "",
  badge: "",
  cta: "",
  mediaType: "image",
  mediaUrl: "",
  animation: "none",
});

export default function AdminFlashAds() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [leftAd, setLeftAd] = useState<FlashAd>(() => createEmptyAd("left"));
  const [rightAd, setRightAd] = useState<FlashAd>(() => createEmptyAd("right"));
  const [isProcessingLeft, setIsProcessingLeft] = useState(false);
  const [isProcessingRight, setIsProcessingRight] = useState(false);

  const { data: adsSetting } = useQuery({
    queryKey: ["admin-flash-ads"],
    queryFn: () => api.getFlashAdsAdmin(token || ""),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!adsSetting || typeof adsSetting !== "object") return;
    const ads = (adsSetting as FlashAdsSetting).ads || [];
    const left = ads.find((ad) => ad.slot === "left");
    const right = ads.find((ad) => ad.slot === "right");
    setLeftAd(left ? { ...createEmptyAd("left"), ...left, slot: "left" } : createEmptyAd("left"));
    setRightAd(right ? { ...createEmptyAd("right"), ...right, slot: "right" } : createEmptyAd("right"));
  }, [adsSetting]);

  const saveMutation = useMutation({
    mutationFn: (payload: FlashAdsSetting) => api.updateFlashAdsAdmin(token || "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flash-ads"] });
      toast({ title: "Flash ads updated", description: "Homepage ad holders were saved." });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });

  const handleMediaUpload = async (
    slot: "left" | "right",
    type: "image" | "video",
    files: FileList | null,
  ) => {
    const file = files?.[0];
    if (!file) return;
    if (type === "image" && !file.type.startsWith("image/")) {
      toast({ title: "Invalid image", description: "Upload a valid image.", variant: "destructive" });
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      toast({ title: "Invalid video", description: "Upload a valid video.", variant: "destructive" });
      return;
    }
    if (type === "image" && file.size > IMAGE_MAX_FILE_SIZE) {
      toast({ title: "Image too large", description: "Use an image smaller than 5MB.", variant: "destructive" });
      return;
    }
    if (type === "video" && file.size > VIDEO_MAX_FILE_SIZE) {
      toast({ title: "Video too large", description: "Use a video smaller than 8MB.", variant: "destructive" });
      return;
    }
    slot === "left" ? setIsProcessingLeft(true) : setIsProcessingRight(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (slot === "left") {
        setLeftAd((prev) => ({ ...prev, mediaUrl: dataUrl, mediaType: type }));
      } else {
        setRightAd((prev) => ({ ...prev, mediaUrl: dataUrl, mediaType: type }));
      }
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      slot === "left" ? setIsProcessingLeft(false) : setIsProcessingRight(false);
    }
  };

  const handleSave = () => {
    const ads = [leftAd, rightAd].filter((ad) => ad.mediaUrl);
    saveMutation.mutate({ ads });
  };

  const renderMediaPreview = (ad: FlashAd) => {
    if (!ad.mediaUrl) {
      return (
        <div className="h-32 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
          No media selected
        </div>
      );
    }
    return (
      <div className="h-32 rounded-lg overflow-hidden border border-border/60">
        {ad.mediaType === "video" ? (
          <video src={ad.mediaUrl} className="h-full w-full object-cover" muted loop playsInline autoPlay />
        ) : (
          <img src={ad.mediaUrl} alt={ad.title || "Ad preview"} className="h-full w-full object-cover" />
        )}
      </div>
    );
  };

  const renderForm = (slot: "left" | "right", ad: FlashAd, onChange: (next: FlashAd) => void, isProcessing: boolean) => (
    <Card>
      <CardHeader>
        <CardTitle>{slot === "left" ? "Left Ad Holder" : "Right Ad Holder"}</CardTitle>
        <CardDescription>Upload media and edit overlay text for this slot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={ad.title} onChange={(e) => onChange({ ...ad, title: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Badge</Label>
            <Input value={ad.badge || ""} onChange={(e) => onChange({ ...ad, badge: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Subtitle</Label>
            <Input value={ad.subtitle || ""} onChange={(e) => onChange({ ...ad, subtitle: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>CTA</Label>
            <Input value={ad.cta || ""} onChange={(e) => onChange({ ...ad, cta: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea
            rows={2}
            value={ad.text || ""}
            onChange={(e) => onChange({ ...ad, text: e.target.value })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Media</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm">
                <label className="cursor-pointer">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleMediaUpload(slot, "image", e.target.files)}
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
                    onChange={(e) => handleMediaUpload(slot, "video", e.target.files)}
                  />
                </label>
              </Button>
              {ad.mediaUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...ad, mediaUrl: "" })}>
                  Clear
                </Button>
              )}
            </div>
            {isProcessing && <p className="text-xs text-muted-foreground">Processing media...</p>}
            {renderMediaPreview(ad)}
          </div>
          <div className="grid gap-2">
            <Label>Animation</Label>
            <Select
              value={ad.animation || "none"}
              onValueChange={(value) =>
                onChange({ ...ad, animation: value as AdAnimation })
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
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Flash Deal Ads</h1>
          <p className="text-muted-foreground">
            Manage the left and right advertisement holders around the Flash Deals section.
          </p>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to manage flash ads.</div>
        ) : (
          <div className="space-y-6">
            {renderForm("left", leftAd, setLeftAd, isProcessingLeft)}
            {renderForm("right", rightAd, setRightAd, isProcessingRight)}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Flash Ads"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
