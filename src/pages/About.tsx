import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Shield, Truck, Headphones, Globe, Users, Target, Heart, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Global Reach",
    description: "Access products and markets in 11 different countries.",
  },
  {
    icon: Shield,
    title: "Secure Transactions",
    description: "Your payments and data are protected with top-tier security.",
  },
  {
    icon: Truck,
    title: "Reliable Logistics",
    description: "We partner with trusted shipping providers to ensure timely delivery.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Our dedicated team is available to assist you every step of the way.",
  },
];

const steps = [
  {
    number: "1",
    title: "Register",
    description: "Create an account as a buyer or seller from any of our supported countries.",
  },
  {
    number: "2",
    title: "Browse or List",
    description: "Browse products from different countries or list your own products for sale.",
  },
  {
    number: "3",
    title: "Secure Payment",
    description: "Make secure payments through our integrated payment system.",
  },
  {
    number: "4",
    title: "Delivery",
    description: "Receive your products through our trusted international shipping partners.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              About <span className="text-accent">IMK-Market</span>
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Connecting buyers and sellers across borders, creating a seamless and secure international marketplace.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-bold">Our Mission</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  IMK-Market is dedicated to connecting buyers and sellers across borders, creating a seamless and secure international marketplace. Our mission is to empower businesses and individuals in Somalia, UAE, China, USA, UK, Ethiopia, Djibouti, Kenya, South Africa, Saudi Arabia, and Tanzania by providing a reliable platform for trade and commerce. We believe in the power of connection and the potential of global trade to uplift communities.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-6 w-6 text-accent" />
                  <h2 className="text-2xl font-bold">Our Story</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Founded with a vision to bridge the gap between East Africa and the global market, IMK-Market has grown into a trusted name in international e-commerce. We started with a simple idea: to make it easy for anyone, anywhere, to buy and sell quality products with confidence. Today, we serve thousands of customers and partner with hundreds of verified sellers to bring you the best products from around the world.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
              <p className="text-muted-foreground">Experience the difference with IMK-Market</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-card p-6 rounded-xl shadow-sm text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How IMK-Market Works</h2>
              <p className="text-muted-foreground">Simple steps to get started</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-card p-6 rounded-xl shadow-sm text-center border-2 border-accent/20">
                    <div className="w-12 h-12 mx-auto bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xl font-bold mb-4">
                      {step.number}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-accent/30" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
