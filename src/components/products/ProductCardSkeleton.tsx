import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border/70 h-full flex flex-col min-h-[170px]">
      <div className="aspect-[4/3] p-1.5 bg-secondary/20">
        <Skeleton className="h-full w-full rounded-lg border border-border/70" />
      </div>
      <div className="p-2 space-y-1.5 flex-1 flex flex-col">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
        <div className="mt-auto">
          <Skeleton className="h-3 w-2/5" />
        </div>
        <div>
          <Skeleton className="h-7 w-full" />
        </div>
      </div>
    </div>
  );
}
