import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketPrices } from "@/data/products";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";

const priceItems = [
  { 
    name: "Gold", 
    icon: "🥇", 
    data: marketPrices.gold,
    color: "from-yellow-500/20 to-yellow-600/20",
    borderColor: "border-yellow-500/30"
  },
  { 
    name: "Diamond", 
    icon: "💎", 
    data: marketPrices.diamond,
    color: "from-blue-400/20 to-blue-500/20",
    borderColor: "border-blue-400/30"
  },
  { 
    name: "Silver", 
    icon: "🥈", 
    data: marketPrices.silver,
    color: "from-gray-400/20 to-gray-500/20",
    borderColor: "border-gray-400/30"
  },
];

export function MarketPrices() {
  return (
    <section className="py-12 bg-secondary/50">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Current Market Prices</h2>
          <p className="text-muted-foreground mt-2">Live prices updated in real-time</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {priceItems.map((item, index) => (
            <div
              key={item.name}
              className={`relative bg-card rounded-xl p-6 border-2 ${item.borderColor} shadow-md hover:shadow-lg transition-all animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-xl`} />
              <div className="relative">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl">{item.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{item.name}</h3>
                <p className="text-3xl font-bold text-center text-accent">
                  {formatCurrency(item.data.price)}/{item.data.unit}
                </p>
                <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${
                  item.data.change >= 0 ? "text-success" : "text-destructive"
                }`}>
                  {item.data.change >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{item.data.change >= 0 ? "+" : ""}{item.data.change}% Today</span>
                </div>
                <Link to={`/order?product=${item.name.toLowerCase()}`} className="block mt-4">
                  <Button variant="navy" size="sm" className="w-full">
                    Order {item.name}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
