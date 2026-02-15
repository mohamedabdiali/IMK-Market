import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailGallery } from "@/components/products/ProductDetailGallery";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.getProduct(id || ""),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const relatedProducts = (allProducts as Product[])
    .filter((p) => p.category === (product as Product | undefined)?.category && p.id !== id)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading product...</div>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <Link to="/" className="text-accent hover:underline">
              Return to homepage
            </Link>
          </div>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  const typedProduct = product as Product;

  const discount = typedProduct.originalPrice
    ? Math.round(((typedProduct.originalPrice - typedProduct.price) / typedProduct.originalPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addToCart(typedProduct, quantity);
  };

  const handleBuyNow = () => {
    addToCart(typedProduct, quantity);
    navigate("/order");
  };

  const wishlisted = isWishlisted(typedProduct.id);

  const normalizedImages = (typedProduct.images ?? [])
    .map((src) => (typeof src === "string" ? src.trim() : ""))
    .filter((src) => src.length > 0);
  const fallbackImage = typeof typedProduct.image === "string" ? typedProduct.image.trim() : "";
  const productImages = normalizedImages.length
    ? normalizedImages
    : fallbackImage.length
      ? [fallbackImage]
      : [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-accent">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`/products?category=${typedProduct.category}`} className="hover:text-accent capitalize">
              {typedProduct.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>

        {/* Product Details */}
        <section className="container pb-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              <ProductDetailGallery
                images={productImages}
                alt={typedProduct.name}
                badge={typedProduct.badge}
                discountPercentage={discount}
              />
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{typedProduct.name}</h1>
                <p className="text-muted-foreground mt-2">{typedProduct.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(typedProduct.rating)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{typedProduct.rating}</span>
                <span className="text-muted-foreground">
                  ({typedProduct.reviewCount.toLocaleString()} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-accent">
                  {formatCurrency(typedProduct.price)}
                </span>
                {typedProduct.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatCurrency(typedProduct.originalPrice)}
                  </span>
                )}
                {discount && (
                  <span className="px-2 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded">
                    Save {formatCurrency(typedProduct.originalPrice! - typedProduct.price)}
                  </span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="gold" size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => toggleWishlist(typedProduct)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        wishlisted ? "fill-destructive text-destructive" : ""
                      }`}
                    />
                  </Button>
                </div>

                <Button variant="navy" size="lg" className="w-full" onClick={handleBuyNow}>
                  Buy Now
                </Button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex flex-col items-center text-center gap-2">
                  <Truck className="h-6 w-6 text-accent" />
                  <span className="text-xs font-medium">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <Shield className="h-6 w-6 text-accent" />
                  <span className="text-xs font-medium">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <RotateCcw className="h-6 w-6 text-accent" />
                  <span className="text-xs font-medium">30-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-secondary/30">
            <div className="container">
              <h2 className="text-2xl font-bold mb-6">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
