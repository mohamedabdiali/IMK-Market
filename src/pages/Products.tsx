import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/products/ProductCardSkeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Category, Product } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchParams } from "react-router-dom";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "featured");
  const [priceRange, setPriceRange] = useState<string>(searchParams.get("price") || "all");
  const [minRating, setMinRating] = useState<string>(searchParams.get("rating") || "all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(searchParams.get("inStock") === "true");
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get("q") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  const { data: categories = [], isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.getCategories(),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (!searchTerm.trim() || selectedCategory !== "all") return;
    const query = searchTerm.trim().toLowerCase();
    const synonyms: Record<string, string[]> = {
      clothes: ["clothing", "fashion", "apparel", "wear", "outfit"],
      clothing: ["clothes", "fashion", "apparel", "wear", "outfit"],
      shoes: ["sneakers", "footwear"],
      perfume: ["fragrance", "scent"],
      mobile: ["phone", "smartphone", "electronics"],
      phone: ["mobile", "smartphone"],
      electronics: ["gadgets", "tech", "device"],
    };
    const categorySynonyms: Record<string, string[]> = {
      "Fashion & Clothing": ["clothes", "clothing", "fashion", "apparel", "wear", "outfit"],
      Electronics: ["mobile", "phone", "smartphone", "gadgets", "tech", "device"],
      "Beauty & Personal Care": ["perfume", "fragrance", "scent", "cosmetics", "skincare"],
      "Home & Lifestyle": ["home", "lifestyle", "decor", "house", "kitchen"],
      "Sports & Outdoors": ["sport", "sports", "outdoor", "fitness", "gym"],
      "Jewelry & Watches": ["jewelry", "watch", "watches", "accessories"],
      "Food & Beverages": ["food", "drink", "beverage", "snack", "snacks", "coffee", "tea"],
      "Office & Stationery": ["office", "stationery", "desk", "work"],
      "Health & Wellness": ["health", "wellness", "vitamin", "medical", "fitness"],
      Automotive: ["car", "auto", "vehicle"],
      "Baby & Kids": ["baby", "kids", "children", "toy"],
      "Pet Supplies": ["pet", "pets", "dog", "cat"],
    };
    const tokens = query.split(/\s+/).filter(Boolean);
    const expandedTokens = tokens.reduce<string[]>((acc, token) => {
      acc.push(token);
      const extra = synonyms[token];
      if (extra) acc.push(...extra);
      if (token.endsWith("s")) acc.push(token.slice(0, -1));
      return acc;
    }, []);
    const matchedCategory = (categories as Category[]).find((cat) => {
      const name = cat.name.toLowerCase();
      if (name.includes(query)) return true;
      const syns = categorySynonyms[cat.name] || [];
      return expandedTokens.some((token) => syns.includes(token));
    });
    if (matchedCategory) {
      setSelectedCategory(matchedCategory.name);
    }
  }, [categories, searchTerm, selectedCategory]);

  useEffect(() => {
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "featured";
    const price = searchParams.get("price") || "all";
    const q = searchParams.get("q") || "";
    if (category !== selectedCategory) setSelectedCategory(category);
    if (sort !== sortBy) setSortBy(sort);
    if (price !== priceRange) setPriceRange(price);
    if (q !== searchTerm) setSearchTerm(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const updateParam = (key: string, value: string | boolean, defaultValue: string | boolean) => {
      const strValue = String(value);
      const strDefault = String(defaultValue);
      if (!strValue || strValue === strDefault) {
        next.delete(key);
      } else {
        next.set(key, strValue);
      }
    };
    updateParam("category", selectedCategory, "all");
    updateParam("sort", sortBy, "featured");
    updateParam("price", priceRange, "all");
    updateParam("rating", minRating, "all");
    updateParam("inStock", inStockOnly, false);
    updateParam("q", searchTerm.trim(), "");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedCategory, sortBy, priceRange, minRating, inStockOnly, searchTerm, searchParams, setSearchParams]);

  const filteredProducts = useMemo(() => {
    let result = [...(products as Product[])];
    const query = searchTerm.trim().toLowerCase();
    const searchIndex = (product: Product) =>
      `${product.name} ${product.description} ${product.category}`.toLowerCase();
    const synonyms: Record<string, string[]> = {
      clothes: ["clothing", "fashion", "apparel", "wear", "outfit"],
      clothing: ["clothes", "fashion", "apparel", "wear", "outfit"],
      shoes: ["sneakers", "footwear"],
      perfume: ["fragrance", "scent"],
      mobile: ["phone", "smartphone", "electronics"],
      phone: ["mobile", "smartphone"],
      electronics: ["gadgets", "tech", "device"],
    };
    const tokens = query ? query.split(/\s+/).filter(Boolean) : [];
    const expandedTokens = tokens.reduce<string[]>((acc, token) => {
      acc.push(token);
      const extra = synonyms[token];
      if (extra) acc.push(...extra);
      if (token.endsWith("s")) acc.push(token.slice(0, -1));
      return acc;
    }, []);
    const categorySynonyms: Record<string, string[]> = {
      "Fashion & Clothing": ["clothes", "clothing", "fashion", "apparel", "wear", "outfit"],
      Electronics: ["mobile", "phone", "smartphone", "gadgets", "tech", "device"],
      "Beauty & Personal Care": ["perfume", "fragrance", "scent", "cosmetics", "skincare"],
      "Home & Lifestyle": ["home", "lifestyle", "decor", "house", "kitchen"],
      "Sports & Outdoors": ["sport", "sports", "outdoor", "fitness", "gym"],
      "Jewelry & Watches": ["jewelry", "watch", "watches", "accessories"],
      "Food & Beverages": ["food", "drink", "beverage", "snack", "snacks", "coffee", "tea"],
      "Office & Stationery": ["office", "stationery", "desk", "work"],
      "Health & Wellness": ["health", "wellness", "vitamin", "medical", "fitness"],
      Automotive: ["car", "auto", "vehicle"],
      "Baby & Kids": ["baby", "kids", "children", "toy"],
      "Pet Supplies": ["pet", "pets", "dog", "cat"],
    };
    const matchedCategories = (categories as Category[])
      .filter((cat) => {
        if (!query) return false;
        const name = cat.name.toLowerCase();
        if (name.includes(query)) return true;
        const syns = categorySynonyms[cat.name] || [];
        return expandedTokens.some((token) => syns.includes(token));
      })
      .map((cat) => cat.name);
    const autoCategory = selectedCategory === "all" ? matchedCategories[0] || "all" : selectedCategory;
    const isCategoryDriven = selectedCategory === "all" && matchedCategories.length > 0;

    if (autoCategory !== "all") {
      result = result.filter((p) => p.category === autoCategory);
    }

    if (query && !isCategoryDriven) {
      result = result.filter((product) => {
        const index = searchIndex(product);
        const matchesText = expandedTokens.some((token) => index.includes(token));
        return matchesText;
      });
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      result = result.filter((p) => p.price >= min && (max ? p.price <= max : true));
    }

    // Filter by minimum rating
    if (minRating !== "all") {
      const rating = parseFloat(minRating);
      result = result.filter((p) => p.rating >= rating);
    }

    // Filter by stock status
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "best-sellers":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [products, categories, selectedCategory, sortBy, priceRange, minRating, inStockOnly, searchTerm]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
    setMinRating("all");
    setInStockOnly(false);
    setSortBy("featured");
    setFiltersOpen(false);
  };

  const FiltersForm = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Search</label>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Category</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger disabled={categoriesLoading || categoriesError}>
            <SelectValue placeholder={categoriesLoading ? "Loading..." : "All Categories"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories as Category[]).map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categoriesError && (
          <p className="text-xs text-muted-foreground mt-2">
            Categories failed to load. You can still browse all products.
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Price Range</label>
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="0-50">Under Le 50</SelectItem>
            <SelectItem value="50-100">Le 50 - Le 100</SelectItem>
            <SelectItem value="100-200">Le 100 - Le 200</SelectItem>
            <SelectItem value="200-500">Le 200 - Le 500</SelectItem>
            <SelectItem value="500-">Le 500+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger>
            <SelectValue placeholder="All Ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="inStock"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="inStock" className="text-sm font-medium cursor-pointer">
          In Stock Only
        </label>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-8">
          <div className="container">
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              All <span className="text-accent">Products</span>
            </h1>
            <p className="text-primary-foreground/70 mt-1">
              Browse our collection of {productsLoading ? "..." : (products as Product[]).length} products
            </p>
          </div>
        </section>

        <div className="container py-8">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent side="left" className="w-full sm:max-w-sm">
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Filters
                </SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FiltersForm />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filters */}
            <aside className="hidden lg:block w-full lg:w-64 shrink-0 space-y-6">
              <div className="p-4 bg-card rounded-xl shadow-sm border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Filters
                </h3>

                <FiltersForm />
              </div>
            </aside>

            {/* Product grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl shadow-sm border border-border">
                <span className="text-sm text-muted-foreground">
                  {productsLoading ? "Loading products..." : `${filteredProducts.length} products found`}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {productsError ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Could not load products. Please refresh and try again.</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Reset filters
                  </Button>
                </div>
              ) : productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No products found matching your filters.</p>
                      <Button variant="link" className="text-accent" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
