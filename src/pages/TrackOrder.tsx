import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Clock3, MapPin, PackageSearch, Truck } from "lucide-react";
import type { OrderTrackingDetails } from "@/types/tracking";
import { useAuth } from "@/context/AuthContext";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

export default function TrackOrder() {
  const { user, loginAsTrackingCustomer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    orderTrackingId:
      searchParams.get("orderTrackingId") || searchParams.get("trackingNumber") || searchParams.get("orderId") || "",
  });
  const [result, setResult] = useState<OrderTrackingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoRequested = useRef(false);

  const loadTracking = useCallback(async (payload?: Partial<typeof formData>) => {
    const request = {
      orderTrackingId: (payload?.orderTrackingId ?? formData.orderTrackingId).trim(),
    };

    if (!request.orderTrackingId) {
      toast({
        title: "Order reference required",
        description: "Provide your Order Tracking ID.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const tracked = await api.trackOrder(request);
      setResult(tracked);
      if (!user) {
        loginAsTrackingCustomer(
          tracked.id || request.orderTrackingId,
          tracked.orderTrackingId || tracked.trackingNumber || request.orderTrackingId
        );
      }
      const next = new URLSearchParams();
      if (request.orderTrackingId) next.set("orderTrackingId", request.orderTrackingId);
      setSearchParams(next, { replace: true });
    } catch {
      setResult(null);
      toast({
        title: "Tracking not found",
        description: "Check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, loginAsTrackingCustomer, setSearchParams, user]);

  useEffect(() => {
    if (hasAutoRequested.current) return;
    const orderTrackingId =
      searchParams.get("orderTrackingId") || searchParams.get("trackingNumber") || searchParams.get("orderId") || "";
    if (!orderTrackingId && !(user?.source === "tracking" && (user.trackingNumber || user.trackingOrderId))) return;
    hasAutoRequested.current = true;
    void loadTracking({
      orderTrackingId: orderTrackingId || user?.trackingNumber || user?.trackingOrderId || "",
    });
  }, [searchParams, loadTracking, user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="container text-center">
            <PackageSearch className="h-12 w-12 mx-auto text-accent mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              Track Your <span className="text-accent">Order</span>
            </h1>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              Enter your order information to view live delivery progress and shipment updates.
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container max-w-5xl space-y-8">
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void loadTracking();
                }}
              >
                <div>
                  <label className="text-sm font-medium mb-2 block">Order Tracking ID</label>
                  <Input
                    required
                    placeholder="TRK-XXXXXXXXXX or ORD-XXXXXX"
                    value={formData.orderTrackingId}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, orderTrackingId: event.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="gold" disabled={isLoading}>
                    {isLoading ? "Checking..." : user ? "Track Order" : "Login & Track Order"}
                  </Button>
                  <Link to="/order">
                    <Button type="button" variant="outline">
                      Back to Checkout
                    </Button>
                  </Link>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    Enter a valid tracking ID to sign in automatically and view your tracking timeline.
                  </p>
                )}
              </form>
            </div>

            {result && (
              <div className="space-y-6">
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8 space-y-5">
                  <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Order</p>
                      <p className="text-lg font-semibold">{result.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tracking ID: {result.orderTrackingId || result.trackingNumber || result.id}
                      </p>
                    </div>
                    <Badge
                      className={statusColors[result.status] || "bg-muted text-foreground"}
                      variant="outline"
                    >
                      {statusLabels[result.status] || result.status}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Progress</span>
                      <span className="font-medium">{Math.round(result.progress || 0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, result.progress || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Order Tracking ID</div>
                      <div className="font-medium">{result.orderTrackingId || result.trackingNumber || result.id}</div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Carrier</div>
                      <div className="font-medium">{result.trackingCarrier || "IMK Logistics"}</div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Estimated Delivery</div>
                      <div className="font-medium">{formatDate(result.estimatedDelivery)}</div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <div className="text-xs text-muted-foreground mb-1">Order Total</div>
                      <div className="font-medium">{formatCurrency(result.total)}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Approval Status</span>
                      <Badge
                        variant="outline"
                        className={
                          result.approvedToProceed
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {result.approvedToProceed ? "Approved to Proceed" : "Awaiting Payment Approval"}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                      <MapPin className="h-4 w-4 text-accent" />
                      Current Location
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.currentLocation || "Awaiting next update"}
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
                  <h2 className="font-semibold text-lg mb-4">Tracking Timeline</h2>
                  <div className="space-y-4">
                    {result.events.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="mt-1">
                          {event.status === "delivered" ? (
                            <PackageSearch className="h-4 w-4 text-green-600" />
                          ) : event.status === "shipped" ? (
                            <Truck className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Clock3 className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{event.message}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {event.location ? `${event.location} • ` : ""}
                            {formatDate(event.eventAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
                  <h2 className="font-semibold text-lg mb-4">Order Items</h2>
                  <div className="space-y-2">
                    {result.items.map((item) => (
                      <div key={`${item.productName}-${item.quantity}`} className="flex justify-between text-sm">
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
