import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const partnerTypes = [
  {
    title: "Sellers",
    description: "List products, manage inventory, and fulfill orders with IMK tools.",
    link: "/seller/register",
    cta: "Register as Seller",
  },
  {
    title: "Suppliers",
    description: "Supply bulk inventory to IMK businesses and approved sellers.",
    link: "/suppliers",
    cta: "Supplier Policies",
  },
  {
    title: "Manufacturers",
    description: "Produce goods to IMK standards and support private-label partnerships.",
    link: "/manufacturers",
    cta: "Manufacturer Policies",
  },
];

export default function Partners() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              IMK-Market Partners
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Partner with IMK-Market
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              Join as a seller, supplier, or manufacturer. All partners go through verification and approval
              before going live.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-10">
            <div className="grid gap-6 md:grid-cols-3">
              {partnerTypes.map((partner) => (
                <Card key={partner.title} className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>{partner.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{partner.description}</p>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={partner.link}>{partner.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Policies & Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  All partners follow IMK-Market onboarding, compliance, and quality procedures to protect customers
                  and maintain marketplace standards.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Complete business profile and required documentation.</li>
                  <li>Admin review and approval before activation.</li>
                  <li>Product listings must follow IMK content and pricing rules.</li>
                  <li>Minimum order quantity (MOQ) applies to all products.</li>
                  <li>Violations may result in suspension or removal.</li>
                </ul>
                <Button asChild variant="link" className="p-0 text-accent">
                  <Link to="/policies">Read full Policies & Procedures</Link>
                </Button>
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
