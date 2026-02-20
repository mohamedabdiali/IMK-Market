import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { PromoSection } from "@/components/home/PromoSection";
import { MIN_ORDER_QUANTITY } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Protections() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              Protections & Policies
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Order Protections & Marketplace Policies
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              Coverage across shipping, payments, refunds, and after‑sales support, plus the full IMK‑Market
              policies and procedures.
            </p>
          </div>
        </section>

        <PromoSection />

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-10">
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-2">Minimum Order Quantity (MOQ)</h2>
              <p className="text-muted-foreground">
                All products on IMK-Market have a minimum order quantity of{" "}
                <span className="font-semibold text-foreground">{MIN_ORDER_QUANTITY} pcs</span>.
                Orders below MOQ are automatically adjusted to meet the minimum.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Partner Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Sellers, suppliers, and manufacturers register through the partner application.</li>
                    <li>Admin review and approval before activation.</li>
                    <li>Profiles must include valid documents and business details.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Product Listing Procedure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Accurate product name, pricing, category, and media.</li>
                    <li>Listings may be reviewed or paused for compliance.</li>
                    <li>Misleading listings can be removed.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Order & Payment Procedure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Orders are confirmed after payment verification.</li>
                    <li>Payment proof is reviewed when required.</li>
                    <li>Tracking updates are provided after fulfillment begins.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Shipping & Logistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Estimated delivery windows are displayed at checkout.</li>
                    <li>Tracking IDs are issued when parcels are dispatched.</li>
                    <li>Delays are communicated through order notifications.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Returns & Money-Back</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Eligible refunds for late, damaged, or mismatched items.</li>
                    <li>Return requests must include evidence and order details.</li>
                    <li>Approved refunds are processed to the original method.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>After‑Sales Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Warranty and maintenance support where applicable.</li>
                    <li>Replacement parts coordinated through partners.</li>
                    <li>Escalation path for unresolved issues.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Compliance & Prohibited Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>No counterfeit, restricted, or illegal goods.</li>
                  <li>Accurate origin, certification, and safety details required.</li>
                  <li>Partners must maintain valid licenses and records.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Customer and partner data is handled securely with role-based access, audit logging, and
                compliance reviews.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
