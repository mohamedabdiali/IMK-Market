import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { HeroBanner } from "@/components/home/HeroBanner";
import { MarketPrices } from "@/components/home/MarketPrices";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { DealsSection } from "@/components/home/DealsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <div className="relative z-10 bg-background">
          <DealsSection />
          <CategoryGrid />
          <FeaturedProducts />
          <MarketPrices />
          <NewsletterSection />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default Index;
