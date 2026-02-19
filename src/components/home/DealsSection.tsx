import { Clock, Flame, Gift, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Product } from "@/types/product";
import { DealProductCard } from "@/components/products/DealProductCard";

const FLASH_DEAL_DISCOUNT_CAP = 30;
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
  const discountedProducts = productList.filter(
    (p) => typeof p.originalPrice === "number" && p.originalPrice > p.price
  );
  const dealProducts = (discountedProducts.length ? discountedProducts : productList).slice(0, 6);

  return (
    <section className="py-12">
      <div className="container">
        <div className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-primary/10 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg animate-pulse">
                <Flame className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Flash Deals</h2>
                <p className="text-muted-foreground">Limited time offers - up to 30% off.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-sm">
              <Clock className="h-5 w-5 text-destructive" />
              <span className="font-mono font-bold text-lg">23:59:42</span>
              <span className="text-sm text-muted-foreground">remaining</span>
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

            {isError && (
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

            {!isLoading && !isError && dealProducts.length === 0 && (
              <div className="col-span-full">
                <div className="rounded-xl border bg-card p-6 text-center">
                  <p className="font-medium">No deals available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon.</p>
                </div>
              </div>
            )}

            {!isLoading &&
              !isError &&
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
    </section>
  );
}
