import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProductDetailGalleryProps = {
  images: string[];
  alt: string;
  badge?: string;
  discountPercentage?: number | null;
  className?: string;
};

const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#eef2ff'/><stop offset='100%' stop-color='#e2e8f0'/></linearGradient></defs><rect width='400' height='400' fill='url(#g)'/><rect x='70' y='70' width='260' height='260' rx='16' fill='#ffffff' stroke='#cbd5e1' stroke-width='2'/><circle cx='150' cy='155' r='24' fill='#cbd5e1'/><path d='M95 280L175 195L225 240L275 200L320 280Z' fill='#94a3b8'/><text x='200' y='350' text-anchor='middle' fill='#475569' font-family='Arial,sans-serif' font-size='18' font-weight='700'>IMK MARKET</text></svg>"
  );

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function ProductDetailGallery({
  images,
  alt,
  badge,
  discountPercentage,
  className,
}: ProductDetailGalleryProps) {
  const galleryImages = useMemo(() => {
    const normalized = images
      .map((src) => (typeof src === "string" ? src.trim() : ""))
      .filter((src) => src.length > 0 && src !== "undefined" && src !== "null");
    return normalized.length ? normalized : [FALLBACK_PRODUCT_IMAGE];
  }, [images]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [hoverPoint, setHoverPoint] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);

  useEffect(() => {
    setSelectedIndex((prev) => clamp(prev, 0, galleryImages.length - 1));
  }, [galleryImages.length]);

  const activeImage = galleryImages[selectedIndex] || FALLBACK_PRODUCT_IMAGE;

  const goToImage = (index: number) => {
    setSelectedIndex(clamp(index, 0, galleryImages.length - 1));
    setHoverZoom(false);
    setLightboxScale(1);
  };

  const showPrev = () => goToImage((selectedIndex - 1 + galleryImages.length) % galleryImages.length);
  const showNext = () => goToImage((selectedIndex + 1) % galleryImages.length);

  const handleMainMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setHoverPoint({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) });
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.src === FALLBACK_PRODUCT_IMAGE) return;
    target.onerror = null;
    target.src = FALLBACK_PRODUCT_IMAGE;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="hidden sm:flex w-16 shrink-0 flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
          {galleryImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => goToImage(index)}
              className={cn(
                "h-14 w-14 overflow-hidden rounded-md border bg-background transition-all",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/60"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={src}
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
            </button>
          ))}
        </div>

        <div className="relative flex-1 aspect-square overflow-hidden rounded-2xl border border-border bg-secondary/20">
          <button
            type="button"
            className="group relative h-full w-full cursor-zoom-in"
            onMouseMove={handleMainMouseMove}
            onMouseEnter={() => setHoverZoom(true)}
            onMouseLeave={() => setHoverZoom(false)}
            onClick={() => setLightboxOpen(true)}
            aria-label="Open full image view"
          >
            <img
              src={activeImage}
              alt={alt}
              onError={handleImageError}
              className={cn(
                "h-full w-full object-cover transition-transform duration-150",
                hoverZoom ? "scale-[2.1]" : "scale-100"
              )}
              style={hoverZoom ? { transformOrigin: `${hoverPoint.x}% ${hoverPoint.y}%` } : undefined}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 text-left text-white text-xs">
              Hover to zoom | Click for full view
            </div>
          </button>

          {badge && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-md">
              {badge}
            </span>
          )}
          {discountPercentage ? (
            <span className="absolute top-3 right-3 px-3 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-md">
              -{discountPercentage}% OFF
            </span>
          ) : null}

          {galleryImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={showPrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={showNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="sm:hidden flex gap-2 overflow-x-auto pb-1">
        {galleryImages.map((src, index) => (
          <button
            key={`${src}-mobile-${index}`}
            type="button"
            onClick={() => goToImage(index)}
            className={cn(
              "h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-background transition-all",
              selectedIndex === index
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/60"
            )}
            aria-label={`View image ${index + 1}`}
          >
            <img
              src={src}
              alt={`${alt} thumbnail ${index + 1}`}
              className="h-full w-full object-cover"
              onError={handleImageError}
            />
          </button>
        ))}
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-[96vw] max-w-6xl p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-medium">
              {selectedIndex + 1} / {galleryImages.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setLightboxScale((prev) => clamp(prev - 0.2, 1, 3))}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setLightboxScale((prev) => clamp(prev + 0.2, 1, 3))}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative bg-black/95">
            {galleryImages.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10"
                  onClick={showPrev}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 z-10 -translate-y-1/2 h-10 w-10"
                  onClick={showNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            <div className="max-h-[80vh] overflow-auto p-4">
              <img
                src={activeImage}
                alt={`${alt} full view`}
                onError={handleImageError}
                className="mx-auto max-h-[76vh] w-auto object-contain transition-transform duration-200"
                style={{ transform: `scale(${lightboxScale})` }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



