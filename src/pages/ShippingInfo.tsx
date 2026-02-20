import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ShippingInfo() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              Shipping Info
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Shipping & Logistics
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              IMK-Market coordinates shipping options that match your delivery needs and budget.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-8">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Shipping Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Choose cargo type (air, sea, or land) during checkout.</li>
                  <li>Orders are confirmed after payment verification.</li>
                  <li>Tracking IDs are issued once parcels are dispatched.</li>
                  <li>Delivery estimates vary by destination and carrier.</li>
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Tracking & Updates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Real-time tracking updates on the Track Order page.</li>
                    <li>Email and in-app notifications for key milestones.</li>
                    <li>Support team available for shipment escalations.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Customs & Duties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Customs fees are determined by destination regulations.</li>
                    <li>Partners must provide accurate invoices and documents.</li>
                    <li>Delays may occur if documentation is incomplete.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
