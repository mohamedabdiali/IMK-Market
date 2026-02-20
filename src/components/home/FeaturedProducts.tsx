import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product } from "@/types/product";
import { DealProductCard } from "@/components/products/DealProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedProducts() {
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
  const featuredProducts = products as Product[];

  return (
    <section className="py-12 bg-secondary/30">
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">All Products</h2>
          <p className="text-muted-foreground mt-1">Browse the full IMK-Market catalog</p>
          <div className="mt-3 hidden sm:flex justify-center">
            <Link to="/products">
              <Button variant="outline">
                View All Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {isLoading &&
            Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-xl overflow-hidden shadow-sm animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}

          {isError && (
            <div className="col-span-full">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-medium text-destructive">Couldn't load products.</p>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {error instanceof Error ? error.message : "API unavailable"}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && featuredProducts.length === 0 && (
            <div className="col-span-full">
              <div className="rounded-xl border bg-card p-6 text-center">
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add products or start the API server to see items here.
                </p>
              </div>
            </div>
          )}

          {!isLoading &&
            !isError &&
            featuredProducts.map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <DealProductCard product={product} discountCap={30} />
              </div>
            ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/products">
            <Button variant="outline">
              View All Products
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
