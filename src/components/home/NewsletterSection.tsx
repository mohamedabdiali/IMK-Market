import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "You'll receive our best deals and updates.",
      });
      setEmail("");
    }
  };

  return (
    <section className="py-16 bg-foreground">
      <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex p-3 bg-primary/10 rounded-full mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">
            Get Exclusive Deals
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            Subscribe to our newsletter and be the first to know about special offers, 
            new arrivals, and insider-only discounts.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-primary-foreground text-foreground placeholder:text-muted-foreground"
              required
            />
            <Button type="submit" variant="hero" className="h-12 px-8">
              Subscribe
            </Button>
          </form>
          
          <p className="text-xs text-primary-foreground/50 mt-4">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
