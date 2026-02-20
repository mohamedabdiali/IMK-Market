import { CreditCard, Headphones, ShieldCheck, Truck } from "lucide-react";

const protections = [
  {
    icon: Truck,
    title: "Shipping & logistics services",
    description: "Coordinated shipping options with tracking and delivery support on eligible orders.",
  },
  {
    icon: CreditCard,
    title: "Secure and diverse payment options",
    description: "Pay by card, bank transfer, or local methods with encrypted checkout.",
  },
  {
    icon: ShieldCheck,
    title: "Money-back policy",
    description: "Refund support for eligible orders if shipments are late, damaged, or not as described.",
  },
  {
    icon: Headphones,
    title: "After-sales protection",
    description: "Ongoing support for installation, maintenance, and replacement parts where available.",
  },
];

export function PromoSection() {
  return (
    <section className="py-12">
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Order Protections</h2>
          <p className="text-muted-foreground mt-1">
            Coverage across shipping, payments, refunds, and after-sales support.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {protections.map((feature, index) => (
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
