import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over Le 50",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated support team",
  },
];

export function PromoSection() {
  return (
    <section className="py-12">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
