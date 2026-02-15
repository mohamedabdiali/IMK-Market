import { Globe, Truck, ShoppingCart, Plane, Package, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function WorldDeliverySection() {
  return (
    <section className="py-14 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <p className="text-muted-foreground text-lg">
              IMK-Market connects buyers and sellers across continents with fast shipping,
              verified sellers, and real-time order tracking.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 shadow-sm border border-border">
                <ShoppingCart className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold">Shop 24/7</span>
              </div>
              <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 shadow-sm border border-border">
                <Truck className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 shadow-sm border border-border">
                <Package className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold">Secure Packaging</span>
              </div>
              <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 shadow-sm border border-border">
                <Clock className="h-5 w-5 text-accent" />
                <span className="text-sm font-semibold">14-30 Day Delivery</span>
              </div>
            </div>
            <Link to="/products">
              <Button variant="hero" size="lg" className="gap-2">
                Explore Products
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden p-6">
              <div className="relative">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/BlankMap-World.svg/960px-BlankMap-World.svg.png"
                  alt="World map"
                  className="w-full h-auto opacity-95"
                  loading="lazy"
                  decoding="async"
                />
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 1000 500"
                  preserveAspectRatio="none"
                >
                  {/* Shipping routes to Sierra Leone */}
                  <path
                    d="M240 190 C320 210, 380 230, 455 285"
                    stroke="hsl(var(--accent))"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="6 8"
                    opacity="0.75"
                  />
                  <path
                    d="M460 160 C470 200, 470 240, 455 285"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 10"
                    opacity="0.7"
                  />
                  <path
                    d="M600 230 C560 250, 520 270, 455 285"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5 9"
                    opacity="0.7"
                  />
                  <path
                    d="M740 200 C670 230, 580 260, 455 285"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="6 8"
                    opacity="0.6"
                  />

                  {/* Origin markers */}
                  <circle cx="240" cy="190" r="6" fill="hsl(var(--accent))" />
                  <circle cx="460" cy="160" r="6" fill="hsl(var(--primary))" />
                  <circle cx="600" cy="230" r="6" fill="hsl(var(--primary))" />
                  <circle cx="740" cy="200" r="6" fill="hsl(var(--accent))" />

                  {/* Destination marker: Sierra Leone */}
                  <circle cx="455" cy="285" r="7" fill="hsl(var(--accent))" />
                  <circle cx="455" cy="285" r="12" fill="hsl(var(--accent))" opacity="0.2" />
                </svg>

                <div className="absolute left-16 top-32 bg-accent text-accent-foreground p-2 rounded-full shadow-lg animate-bounce-subtle">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div
                  className="absolute right-24 top-20 bg-primary text-primary-foreground p-2 rounded-full shadow-lg animate-bounce-subtle"
                  style={{ animationDelay: "0.2s" }}
                >
                  <Plane className="h-4 w-4" />
                </div>
                <div
                  className="absolute right-32 bottom-16 bg-accent text-accent-foreground p-2 rounded-full shadow-lg animate-bounce-subtle"
                  style={{ animationDelay: "0.4s" }}
                >
                  <Truck className="h-4 w-4" />
                </div>
                <div
                  className="absolute left-24 bottom-12 bg-primary text-primary-foreground p-2 rounded-full shadow-lg animate-bounce-subtle"
                  style={{ animationDelay: "0.6s" }}
                >
                  <Package className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-semibold">
              Delivered in 14-30 days
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
