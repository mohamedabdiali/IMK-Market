import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { categories } from "@/data/products";

export default function Sell() {
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    price: "",
    description: "",
    location: "",
    name: "",
    email: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Product Submitted!",
      description: "Your product has been submitted for review. We'll notify you once approved.",
    });
    setFormData({
      productName: "",
      category: "",
      price: "",
      description: "",
      location: "",
      name: "",
      email: "",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-12">
          <div className="container text-center">
            <Package className="h-12 w-12 mx-auto text-accent mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              Sell Your <span className="text-accent">Products</span>
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              List your products on IMK-Market and reach thousands of customers across the globe.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container max-w-3xl">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm p-6 md:p-8 space-y-6 border border-border">
              <h2 className="text-xl font-bold border-b pb-4">Product Information</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Name *</label>
                  <Input
                    required
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category *</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price (Le) *</label>
                  <Input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location *</label>
                  <Input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Product Description *</label>
                <Textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product in detail..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Image</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Video (Optional)</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload video</p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold border-b pb-4 pt-4">Seller Information</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Name *</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <Button type="submit" variant="gold" size="lg" className="w-full">
                Submit Product for Review
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
