import { Clock, Flame, Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product } from "@/types/product";
import { DealProductCard } from "@/components/products/DealProductCard";

const FLASH_DEAL_DISCOUNT_CAP = 30;
const animationClasses: Record<string, string> = {
  none: "",
  pulse: "animate-pulse",
  float: "animate-flash-float",
  zoom: "animate-flash-zoom",
};

interface FlashDealCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  price?: string;
  cta?: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  animation?: "none" | "pulse" | "float" | "zoom";
}

interface FlashAd {
  id: string;
  slot: "left" | "right";
  title?: string;
  subtitle?: string;
  text?: string;
  badge?: string;
  cta?: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  animation?: "none" | "pulse" | "float" | "zoom";
}

function FlashDealPromoCard({ card }: { card: FlashDealCard }) {
  const animationClass = animationClasses[card.animation || "none"] || "";
  return (
    <div className={`group bg-card rounded-xl overflow-hidden shadow-sm border border-border/70 ${animationClass}`}>
      <div className="relative aspect-square">
        {card.mediaType === "video" ? (
          <video
            src={card.mediaUrl}
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <img src={card.mediaUrl} alt={card.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5" />
        <div className="absolute inset-x-2 bottom-2 text-white space-y-1">
          {card.badge && (
            <span className="inline-flex rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {card.badge}
            </span>
          )}
          <p className="text-sm font-semibold leading-tight">{card.title}</p>
          {card.subtitle && <p className="text-[11px] text-white/80">{card.subtitle}</p>}
          {card.price && <p className="text-sm font-bold">{card.price}</p>}
          {card.cta && (
            <span className="inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {card.cta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_FLASH_ADS: Record<"left" | "right", FlashAd> = {
  left: {
    id: "default-left",
    slot: "left",
    title: "Advertise with IMK-Market",
    subtitle: "Premium placement near Flash Deals",
    text: "Launch your next promotion with high-visibility placement and rich media.",
    badge: "Ad Space",
    cta: "Book this slot",
    mediaType: "image",
    mediaUrl: "",
    animation: "float",
  },
  right: {
    id: "default-right",
    slot: "right",
    title: "Sponsor Spotlight",
    subtitle: "Showcase your best offers",
    text: "Feature a video, animation, or hero image to convert new shoppers.",
    badge: "Sponsored",
    cta: "Promote now",
    mediaType: "image",
    mediaUrl: "",
    animation: "zoom",
  },
};

function FlashAdPanel({ ad }: { ad: FlashAd }) {
  const hasMedia = Boolean(ad.mediaUrl);
  const animationClass = animationClasses[ad.animation || "none"] || "";
  const badge = ad.badge || (hasMedia ? "Sponsored" : "Ad Space");
  const title =
    ad.title || (ad.slot === "left" ? "Advertise with IMK-Market" : "Sponsor Spotlight");
  const subtitle =
    ad.subtitle ||
    (ad.slot === "left" ? "Premium placement near Flash Deals" : "Showcase your best offers");
  const description =
    ad.text ||
    (ad.slot === "left"
      ? "Launch your next promotion with high-visibility placement and rich media."
      : "Feature a video, animation, or hero image to convert new shoppers.");
  const cta = ad.cta || (hasMedia ? "Learn more" : "Book this slot");

  return (
    <div
      className={`relative h-full min-h-[360px] xl:min-h-[520px] overflow-hidden rounded-2xl border border-border/60 shadow-lg ${animationClass}`}
    >
      <div className="absolute inset-0">
        {hasMedia ? (
          ad.mediaType === "video" ? (
            <video
              src={ad.mediaUrl}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
          ) : (
            <img src={ad.mediaUrl} alt={title} className="h-full w-full object-cover" />
          )
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/40" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
      <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex rounded-full bg-destructive/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {badge}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/70">
            {ad.slot === "left" ? "Left Ad" : "Right Ad"}
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-sm text-white/85">{subtitle}</p>
          <p className="text-xs text-white/70">{description}</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          {cta}
        </span>
      </div>
    </div>
  );
}
const RAMADAN_FEATURES = [
  {
    title: "Ramadan Discount",
    detail: "Up to 30% off",
    Icon: Sparkles,
  },
  {
    title: "Night Ads",
    detail: "Fresh offers daily",
    Icon: Gift,
  },
  {
    title: "Before Iftar Delivery",
    detail: "Priority shipping",
    Icon: Truck,
  },
  {
    title: "Secure Checkout",
    detail: "Buyer protection",
    Icon: ShieldCheck,
  },
];

export function DealsSection() {
  const { data: flashDeals } = useQuery({
    queryKey: ["flash-deals"],
    queryFn: () => api.getFlashDeals(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
  const { data: flashAds } = useQuery({
    queryKey: ["flash-ads"],
    queryFn: () => api.getFlashAds(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
  const productList = products as Product[];
  const customCards = useMemo(() => {
    if (!flashDeals || typeof flashDeals !== "object") return [] as FlashDealCard[];
    const cards = (flashDeals as { cards?: FlashDealCard[] }).cards;
    if (!Array.isArray(cards)) return [];
    return cards.filter((card) => card && card.mediaUrl);
  }, [flashDeals]);
  const { leftAd, rightAd } = useMemo(() => {
    if (!flashAds || typeof flashAds !== "object") {
      return { leftAd: DEFAULT_FLASH_ADS.left, rightAd: DEFAULT_FLASH_ADS.right };
    }
    const ads = (flashAds as { ads?: FlashAd[] }).ads;
    if (!Array.isArray(ads)) {
      return { leftAd: DEFAULT_FLASH_ADS.left, rightAd: DEFAULT_FLASH_ADS.right };
    }
    const left = ads.find((ad) => ad.slot === "left" && ad.mediaUrl) || DEFAULT_FLASH_ADS.left;
    const right = ads.find((ad) => ad.slot === "right" && ad.mediaUrl) || DEFAULT_FLASH_ADS.right;
    return { leftAd: { ...DEFAULT_FLASH_ADS.left, ...left }, rightAd: { ...DEFAULT_FLASH_ADS.right, ...right } };
  }, [flashAds]);
  const flashDealIds = useMemo(() => {
    if (!flashDeals || typeof flashDeals !== "object") return new Set<string>();
    const ids = (flashDeals as { productIds?: string[] }).productIds || [];
    return new Set(ids.filter((id) => typeof id === "string"));
  }, [flashDeals]);
  const manualDeals = flashDealIds.size
    ? productList.filter((p) => flashDealIds.has(p.id))
    : [];
  const discountedProducts = productList.filter(
    (p) => typeof p.originalPrice === "number" && p.originalPrice > p.price
  );
  const dealProducts = (manualDeals.length ? manualDeals : discountedProducts.length ? discountedProducts : productList).slice(0, 6);
  const dealTitle =
    flashDeals && typeof flashDeals === "object" && "title" in flashDeals && typeof flashDeals.title === "string"
      ? flashDeals.title
      : "Flash Deals";
  const dealSubtitle =
    flashDeals && typeof flashDeals === "object" && "subtitle" in flashDeals && typeof flashDeals.subtitle === "string"
      ? flashDeals.subtitle
      : "Limited time offers - up to 30% off.";
  const dealCountdown =
    flashDeals && typeof flashDeals === "object" && "endsAt" in flashDeals && typeof flashDeals.endsAt === "string"
      ? new Date(flashDeals.endsAt as string).toLocaleDateString()
      : "23:59:42";

  return (
    <section className="pt-4 pb-2">
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
        <div className="grid gap-4 items-stretch lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)]">
          <div className="order-2 lg:order-none h-full">
            <FlashAdPanel ad={leftAd} />
          </div>

          <div className="order-1 lg:order-none">
            <div className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-primary/10 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg animate-pulse">
                    <Flame className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">{dealTitle}</h2>
                    <p className="text-muted-foreground">{dealSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-sm">
                  <Clock className="h-5 w-5 text-destructive" />
                  <span className="font-mono font-bold text-lg">{dealCountdown}</span>
                  <span className="text-sm text-muted-foreground">
                    {dealCountdown === "23:59:42" ? "remaining" : "ends"}
                  </span>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-accent/30 bg-gradient-to-r from-accent/20 via-accent/10 to-primary/15 p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
                    RAMADAN DISCOUNT
                  </span>
                  <p className="text-sm font-medium text-foreground/90">
                    Customer bonus ads, rewards, and seasonal savings across top categories.
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {RAMADAN_FEATURES.map(({ title, detail, Icon }) => (
                    <div key={title} className="rounded-lg border border-border/60 bg-card/90 px-2.5 py-2">
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 text-accent mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold leading-tight">{title}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {isLoading &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-card rounded-xl overflow-hidden shadow-sm">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    </div>
                  ))}

                {isError && customCards.length === 0 && (
                  <div className="col-span-full">
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                      <p className="font-medium text-destructive">Couldn't load deals.</p>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {error instanceof Error ? error.message : "API unavailable"}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                        Retry
                      </Button>
                    </div>
                  </div>
                )}

                {!isLoading && !isError && dealProducts.length === 0 && customCards.length === 0 && (
                  <div className="col-span-full">
                    <div className="rounded-xl border bg-card p-6 text-center">
                      <p className="font-medium">No deals available yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Check back soon.</p>
                    </div>
                  </div>
                )}

                {customCards.map((card) => (
                  <FlashDealPromoCard key={card.id} card={card} />
                ))}

                {!isError &&
                  dealProducts.map((product) => (
                    <DealProductCard
                      key={product.id}
                      product={product}
                      discountCap={FLASH_DEAL_DISCOUNT_CAP}
                    />
                  ))}
              </div>
            </div>
          </div>

          <div className="order-3 lg:order-none h-full">
            <FlashAdPanel ad={rightAd} />
          </div>
        </div>
      </div>
    </section>
  );
}
