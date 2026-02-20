import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MIN_ORDER_QUANTITY } from "@/lib/constants";

export default function Manufacturers() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              Manufacturer Program
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              IMK-Market Manufacturers
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              Partner with IMK-Market to manufacture high-quality products and grow private-label opportunities.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-8">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Manufacturer Policies & Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide factory registration, certifications, and compliance records.</li>
                  <li>Follow IMK quality standards, packaging, and labeling requirements.</li>
                  <li>MOQ is {MIN_ORDER_QUANTITY} pcs for all catalog items.</li>
                  <li>Share production lead times and capacity planning.</li>
                  <li>Provide QC inspection reports where required.</li>
                  <li>Maintain traceability for raw materials and components.</li>
                </ul>
                <Button asChild variant="link" className="p-0 text-accent">
                  <Link to="/policies">Read full Policies & Procedures</Link>
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Manufacturing Workflow</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Submit product samples and specifications for review.</li>
                    <li>Agree on production schedules and delivery windows.</li>
                    <li>Provide batch-level QC reports for releases.</li>
                    <li>Coordinate shipping and export documentation.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle>Compliance & Safety</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Meet local and international regulatory requirements.</li>
                    <li>Ensure product safety testing and certifications.</li>
                    <li>Maintain audit-ready documentation.</li>
                    <li>Non-compliance may result in suspension.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="gold">
                <Link to="/seller/register">Register as Manufacturer</Link>
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
