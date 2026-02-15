import { useEffect, useState } from "react";

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type ProductImageSlideshowProps = {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
};

const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#eef2ff'/><stop offset='100%' stop-color='#e2e8f0'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><rect x='70' y='50' width='260' height='200' rx='16' fill='#ffffff' stroke='#cbd5e1' stroke-width='2'/><circle cx='145' cy='120' r='22' fill='#cbd5e1'/><path d='M90 220L170 145L220 190L265 160L310 220Z' fill='#94a3b8'/><text x='200' y='270' text-anchor='middle' fill='#475569' font-family='Arial,sans-serif' font-size='18' font-weight='700'>IMK MARKET</text></svg>"
  );

export function ProductImageSlideshow({ images, alt, className, imageClassName }: ProductImageSlideshowProps) {
  const normalizedImages = images
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter((src) => src.length > 0 && src !== "undefined" && src !== "null");
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!api || normalizedImages.length <= 1) return;
    const intervalId = window.setInterval(() => api.scrollNext(), 60_000);
    return () => window.clearInterval(intervalId);
  }, [api, normalizedImages.length]);

  const onImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    if (target.src === FALLBACK_PRODUCT_IMAGE) return;
    target.onerror = null;
    target.src = FALLBACK_PRODUCT_IMAGE;
  };

  if (normalizedImages.length === 0) {
    return (
      <img
        src={FALLBACK_PRODUCT_IMAGE}
        alt={`${alt} placeholder`}
        className={cn("h-full w-full object-contain", imageClassName, className)}
      />
    );
  }

  if (normalizedImages.length <= 1) {
    const src = normalizedImages[0] ?? FALLBACK_PRODUCT_IMAGE;
    return (
      <img
        src={src}
        alt={alt}
        onError={onImageError}
        className={cn("h-full w-full object-cover", imageClassName, className)}
      />
    );
  }

  return (
    <Carousel className={cn("h-full w-full", className)} opts={{ loop: true }} setApi={setApi}>
      <CarouselContent className="ml-0">
        {normalizedImages.map((src, idx) => (
          <CarouselItem key={`${src}-${idx}`} className="pl-0">
            <img
              src={src}
              alt={alt}
              onError={onImageError}
              className={cn("h-full w-full object-cover", imageClassName)}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
