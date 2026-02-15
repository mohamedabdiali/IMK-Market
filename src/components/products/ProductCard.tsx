import { Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatCurrency } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ProductImageSlideshow } from "@/components/products/ProductImageSlideshow";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const normalizedImages = (product.images ?? [])
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter((src) => src.length > 0);
  const fallbackImage = typeof product.image === "string" ? product.image.trim() : "";
  const images = normalizedImages.length ? normalizedImages : fallbackImage.length ? [fallbackImage] : [];

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in border border-border/70 h-full flex flex-col min-h-[170px]">
      <div className="relative aspect-[4/3] bg-secondary/20 p-1.5">
        <Link
          to={`/product/${product.id}`}
          className="block h-full w-full overflow-hidden rounded-lg border border-border/70 bg-background/90"
        >
          <ProductImageSlideshow
            images={images}
            alt={product.name}
            className="h-full w-full"
            imageClassName="h-full w-full object-contain p-1.5"
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {product.badge && (
            <span className="px-1.5 py-0.5 bg-accent text-accent-foreground text-[8px] font-semibold rounded-md">
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground text-[8px] font-semibold rounded-md">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-1.5 right-1.5 p-1.5 bg-card/90 backdrop-blur-sm rounded-full opacity-100 transition-opacity hover:bg-card shadow-sm"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              wishlisted ? "fill-destructive text-destructive" : "text-foreground"
            }`}
          />
        </button>
      </div>

      <div className="p-2 space-y-1 flex-1 flex flex-col">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-[10px] line-clamp-2 hover:text-accent transition-colors min-h-[24px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-2.5 w-2.5 ${
                  i < Math.floor(product.rating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="text-xs font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[9px] text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        <Button variant="cart" size="sm" className="w-full h-7 mt-1" onClick={() => addToCart(product)}>
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
