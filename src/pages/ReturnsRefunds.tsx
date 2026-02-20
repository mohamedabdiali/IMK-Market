import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReturnsRefunds() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              Returns & Refunds
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Returns, Refunds & Disputes
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              IMK-Market protects buyers with clear refund and after‑sales procedures.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-8">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Refund Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Late shipment beyond the estimated delivery window.</li>
                  <li>Damaged items confirmed with evidence.</li>
                  <li>Items not as described or missing components.</li>
                </ul>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Return Procedure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Submit a return request with order ID and evidence.</li>
                    <li>IMK support reviews and confirms eligibility.</li>
                    <li>Ship items back using approved logistics where required.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Refund Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Refunds are processed after verification.</li>
                    <li>Funds return to the original payment method.</li>
                    <li>Status updates are shared by email and dashboard.</li>
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
