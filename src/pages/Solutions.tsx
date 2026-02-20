import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const solutionGroups = [
  {
    key: "start",
    title: "Start",
    description: "Build your brand and set up your store on IMK-Market.",
    items: [
      { title: "Start your business", subtitle: "Build your brand" },
      { title: "Create your website", subtitle: "Online store editor" },
      { title: "Customize your store", subtitle: "Store themes" },
      { title: "Find business apps", subtitle: "IMK app marketplace" },
      { title: "Own your site domain", subtitle: "Domains & hosting" },
      { title: "Explore free business tools", subtitle: "Tools to run your business" },
    ],
  },
  {
    key: "sell",
    title: "Sell",
    description: "Sell online, in person, and across channels with IMK tools.",
    items: [
      { title: "Sell your products", subtitle: "Sell online or in person" },
      { title: "Check out customers", subtitle: "Fast, secure checkout" },
      { title: "Sell online", subtitle: "Grow your business online" },
      { title: "Sell across channels", subtitle: "Reach more shoppers and boost sales" },
      { title: "Sell globally", subtitle: "International sales" },
      { title: "Sell wholesale & direct", subtitle: "Business-to-business (B2B)" },
    ],
  },
  {
    key: "market",
    title: "Market",
    description: "Reach, retain, and grow your customer base.",
    items: [
      { title: "Market your business", subtitle: "Reach & retain customers" },
      { title: "Market across social", subtitle: "Social media integrations" },
      { title: "Nurture customers", subtitle: "IMK Messaging" },
      { title: "Know your audience", subtitle: "Gain customer insights" },
    ],
  },
  {
    key: "manage",
    title: "Manage",
    description: "Track performance, inventory, and operations in one place.",
    items: [
      { title: "Manage your business", subtitle: "Track sales, orders & analytics" },
      { title: "Measure your performance", subtitle: "Analytics and reporting" },
      { title: "Manage your stock & orders", subtitle: "Inventory & order management" },
      { title: "IMK Developers", subtitle: "Build with IMK Market APIs" },
      { title: "IMK Plus", subtitle: "Commerce for growing digital brands" },
      { title: "All Products", subtitle: "Explore all IMK features" },
    ],
  },
];

export default function Solutions() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 text-center">
            <Badge className="mb-3" variant="secondary">
              IMK-Market Solutions
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Solutions for Every Stage
            </h1>
            <p className="text-primary-foreground/80 mt-2 max-w-2xl mx-auto">
              Everything you need to start, sell, market, and manage your business on IMK-Market.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 space-y-8">
            {solutionGroups.map((group) => (
              <Card key={group.key} className="border-border/70">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">{group.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <p className="font-semibold text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
