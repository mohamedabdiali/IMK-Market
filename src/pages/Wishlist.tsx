import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Product } from "@/types/product";

export default function Wishlist() {
  const location = useLocation();
  const { ids, clearWishlist } = useWishlist();
  const { user, isAdmin } = useAuth();
  const canAccessWishlist = Boolean(
    user && !isAdmin && user.role === "user" && user.source !== "tracking"
  );
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    enabled: canAccessWishlist,
  });

  const { items, missingCount } = useMemo(() => {
    const byId = new Map((products as Product[]).map((p) => [p.id, p]));
    const resolved = ids.map((id) => byId.get(id)).filter(Boolean) as Product[];
    return { items: resolved, missingCount: Math.max(0, ids.length - resolved.length) };
  }, [ids, products]);

  if (!canAccessWishlist) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <section className="container py-16">
            <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold">Login Required</h1>
              <p className="text-muted-foreground mt-2">
                Please sign in to your customer account to use Wishlist.
              </p>
              <Link to="/login?tab=customer" state={{ from: location }}>
                <Button variant="gold" className="mt-6">Go to Login / Sign Up</Button>
              </Link>
            </div>
          </section>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-8">
          <div className="container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                Your <span className="text-accent">Wishlist</span>
              </h1>
              <p className="text-primary-foreground/70 mt-1">
                {ids.length} saved item{ids.length === 1 ? "" : "s"}
              </p>
            </div>

            {ids.length > 0 && (
              <Button
                variant="outline"
                className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={clearWishlist}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear wishlist
              </Button>
            )}
          </div>
        </section>

        <section className="container py-8">
          {ids.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <Heart className="h-14 w-14 text-muted-foreground/50" />
              <div>
                <h2 className="text-xl font-bold">Your wishlist is empty</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tap the heart on any product to save it for later.
                </p>
              </div>
              <Link to="/products">
                <Button variant="gold">Browse products</Button>
              </Link>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Could not load products. Please refresh and try again.</p>
              <Link to="/products">
                <Button variant="link" className="text-accent">
                  Browse products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {missingCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  {missingCount} saved item{missingCount === 1 ? "" : "s"} are no longer available.
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
