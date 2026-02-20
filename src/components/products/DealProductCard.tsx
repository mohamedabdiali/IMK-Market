import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { ProductImageSlideshow } from "@/components/products/ProductImageSlideshow";
import { MIN_ORDER_QUANTITY } from "@/lib/constants";
import { Link } from "react-router-dom";

interface DealProductCardProps {
  product: Product;
  discountCap?: number;
}

export function DealProductCard({ product, discountCap }: DealProductCardProps) {
  const { addToCart } = useCart();
  const hasDiscount =
    typeof product.originalPrice === "number" && product.originalPrice > product.price;
  const rawDiscount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const discount = discountCap ? Math.min(rawDiscount, discountCap) : rawDiscount;

  const normalizedImages = (product.images ?? [])
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter((src) => src.length > 0);
  const fallbackImage = typeof product.image === "string" ? product.image.trim() : "";
  const images = normalizedImages.length ? normalizedImages : fallbackImage.length ? [fallbackImage] : [];

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-border/60">
      <div className="relative aspect-square bg-secondary/20 p-2">
        <Link
          to={`/product/${product.id}`}
          className="block h-full w-full overflow-hidden rounded-xl border border-border/70 bg-background/90"
        >
          <ProductImageSlideshow
            images={images}
            alt={product.name}
            className="h-full w-full overflow-hidden"
            imageClassName="h-full w-full object-cover"
          />
        </Link>
        {hasDiscount && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-destructive text-destructive-foreground text-sm font-bold rounded">
            -{discount}%
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          MOQ {MIN_ORDER_QUANTITY} pcs
        </p>
        <Button variant="cart" size="sm" className="w-full mt-3" onClick={() => addToCart(product)}>
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
