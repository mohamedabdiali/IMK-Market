import { Bolt, BadgePercent, ShieldCheck, Globe2, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ads = [
  {
    icon: Bolt,
    title: "Fast Delivery",
    description: "Get products delivered quickly with priority shipping.",
    cta: "Shop Fast",
    href: "/products",
  },
  {
    icon: Globe2,
    title: "Global Shipping",
    description: "Door-to-door delivery in 14-30 days worldwide.",
    cta: "See Regions",
    href: "/about",
  },
  {
    icon: BadgePercent,
    title: "Weekly Deals",
    description: "Save up to 35% on top categories every week.",
    cta: "View Deals",
    href: "/products",
  },
  {
    icon: ShieldCheck,
    title: "Verified Sellers",
    description: "Shop confidently with trusted merchants and secure payments.",
    cta: "Learn More",
    href: "/about",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Chat with IMK-Market support anytime you need help.",
    cta: "Contact Us",
    href: "/contact",
  },
];

export function AdBanners() {
  return (
    <section className="py-10">
      <div className="container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {ads.map((ad, index) => (
            <div
              key={ad.title}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
              <div className="relative space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <ad.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{ad.title}</h3>
                  <p className="text-sm text-muted-foreground">{ad.description}</p>
                </div>
                <Link to={ad.href}>
                  <Button variant="outline">{ad.cta}</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
