import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Category } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoryGrid() {
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });
  const categoryList = categories as Category[];
  const [brokenCategoryImages, setBrokenCategoryImages] = useState<Record<string, boolean>>({});
  const [brokenCategoryVideos, setBrokenCategoryVideos] = useState<Record<string, boolean>>({});

  const isImageUrl = (value: unknown) =>
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:"));

  return (
    <section className="py-6">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <p className="text-muted-foreground mt-1">Explore our wide range of products</p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1 text-primary font-medium hover:text-accent transition-colors"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isLoading &&
            Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/70 w-full animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-[4/3] p-1.5 bg-secondary/20">
                  <Skeleton className="h-full w-full rounded-lg border border-border/70" />
                </div>
                <div className="p-2 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}

          {isError && (
            <div className="col-span-full">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="font-medium text-destructive">Couldn't load categories.</p>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {error instanceof Error ? error.message : "API unavailable"}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && categoryList.length === 0 && (
            <div className="col-span-full">
              <div className="rounded-xl border bg-card p-6 text-center">
                <p className="font-medium">No categories found</p>
                <p className="text-sm text-muted-foreground mt-1">Add categories to start browsing.</p>
              </div>
            </div>
          )}

          {!isLoading &&
            !isError &&
            categoryList.map((category, index) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fade-in border border-border/70 w-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-[4/3] bg-secondary/20 p-1.5">
                  <div className="h-full w-full overflow-hidden rounded-lg border border-border/70 bg-background/90">
                    {isImageUrl(category.video) && !brokenCategoryVideos[category.id] ? (
                      <video
                        src={category.video}
                        className="w-full h-full object-contain p-1.5"
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                        onError={() =>
                          setBrokenCategoryVideos((prev) => ({
                            ...prev,
                            [category.id]: true,
                          }))
                        }
                      />
                    ) : isImageUrl(category.image) && !brokenCategoryImages[category.id] ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-contain p-1.5"
                        onError={() =>
                          setBrokenCategoryImages((prev) => ({
                            ...prev,
                            [category.id]: true,
                          }))
                        }
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted/20 text-muted-foreground">
                        <span className="text-[10px] font-semibold" aria-hidden>
                          IMK MARKET
                        </span>
                        <span className="text-[9px]">No category image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <h3 className="font-semibold text-[10px] leading-tight">{category.name}</h3>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {category.productCount.toLocaleString()} items
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
