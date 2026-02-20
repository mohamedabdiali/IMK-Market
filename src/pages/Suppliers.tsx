import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MIN_ORDER_QUANTITY } from "@/lib/constants";

export default function Suppliers() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              Supplier Program
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              IMK-Market Suppliers
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              Supply inventory to IMK-Market partners with verified sourcing and dependable fulfillment.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-8">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Supplier Policies & Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide valid business registration, tax, and trade documentation.</li>
                  <li>Maintain consistent quality, packaging, and lead times.</li>
                  <li>MOQ is {MIN_ORDER_QUANTITY} pcs for all catalog items.</li>
                  <li>Stock availability must be updated in real time.</li>
                  <li>Pricing must remain competitive and transparent.</li>
                  <li>All shipments must include tracking and delivery confirmation.</li>
                </ul>
                <Button asChild variant="link" className="p-0 text-accent">
                  <Link to="/policies">Read full Policies & Procedures</Link>
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Onboarding Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Business profile and compliance documentation.</li>
                    <li>Product catalog with pricing, MOQ, and lead times.</li>
                    <li>Warehouse and logistics coverage details.</li>
                    <li>Point of contact for operations and support.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Service Expectations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fulfill orders within agreed SLAs.</li>
                    <li>Handle returns and replacements promptly.</li>
                    <li>Provide clear documentation for compliance audits.</li>
                    <li>Support IMK campaigns and promotions when needed.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="gold">
                <Link to="/seller/register">Register as Supplier</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/partners">Back to Partners</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
