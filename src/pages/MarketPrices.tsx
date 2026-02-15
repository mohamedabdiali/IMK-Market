import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { marketPrices } from "@/data/products";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

const priceItems = [
  { 
    name: "Gold", 
    icon: "\u{1F947}", 
    data: marketPrices.gold,
    description: "24K Pure Gold",
    color: "from-yellow-500/20 to-yellow-600/20",
    borderColor: "border-yellow-500/50"
  },
  { 
    name: "Diamond", 
    icon: "\u{1F48E}", 
    data: marketPrices.diamond,
    description: "Natural Diamonds",
    color: "from-blue-400/20 to-blue-500/20",
    borderColor: "border-blue-400/50"
  },
  { 
    name: "Silver", 
    icon: "\u{1F948}", 
    data: marketPrices.silver,
    description: "Sterling Silver",
    color: "from-gray-400/20 to-gray-500/20",
    borderColor: "border-gray-400/50"
  },
];

export default function MarketPricesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-12">
          <div className="container text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              Current <span className="text-accent">Market Prices</span>
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Real-time prices for precious metals and gemstones
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary-foreground/60">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-accent">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {priceItems.map((item, index) => (
                <div
                  key={item.name}
                  className={`relative bg-card rounded-2xl p-8 border-2 ${item.borderColor} shadow-lg hover:shadow-xl transition-all animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl`} />
                  <div className="relative text-center">
                    <span className="text-6xl mb-4 block">{item.icon}</span>
                    <h2 className="text-2xl font-bold mb-1">{item.name}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    
                    <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                      <p className="text-4xl font-bold text-accent">
                        {formatCurrency(item.data.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">per {item.data.unit}</p>
                    </div>
                    
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      item.data.change >= 0 
                        ? "bg-success/10 text-success" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {item.data.change >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span>{item.data.change >= 0 ? "+" : ""}{item.data.change}% Today</span>
                    </div>
                    
                    <Link to={`/order?product=${item.name.toLowerCase()}`} className="block mt-6">
                      <Button variant="gold" className="w-full">
                        Order {item.name}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Info section */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="font-bold mb-4">About Our Pricing</h3>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                  <li>Prices are updated in real-time based on international market rates</li>
                  <li>All prices are in Sierra Leone leones (SLE) and include standard quality verification</li>
                  <li>Final price may vary based on quantity, purity, and delivery location</li>
                  <li>Contact us for bulk orders and special pricing</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

