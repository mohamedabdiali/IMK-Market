import { Search, ShoppingCart, User, Menu, Globe, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const baseNavItems = [
  { label: "Home", href: "/" },
  { label: "Category", href: "/products" },
  { label: "Market Prices", href: "/market-prices" },
  { label: "Sell Products", href: "/sell" },
  { label: "Order Products", href: "/order" },
  { label: "Track Order", href: "/track-order" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const { totalItems: cartItemsCount, setIsCartOpen } = useCart();
  const { user, isAdmin, isSuperAdmin, isSeller, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCustomerAuthenticated = isAuthenticated && !isAdmin && !isSuperAdmin && !isSeller && user?.source === "customer";

  const navItems = isCustomerAuthenticated
    ? [...baseNavItems.slice(0, 6), { label: "Wishlist", href: "/wishlist" }, ...baseNavItems.slice(6)]
    : baseNavItems;

  useEffect(() => {
    if (location.pathname !== "/products") return;
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("q") || "");
  }, [location.pathname, location.search]);

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?q=${encodeURIComponent(query)}`);
    } else {
      navigate("/products");
    }
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== "/products") return;
    const query = searchQuery.trim();
    const params = new URLSearchParams(location.search);
    const current = params.get("q") || "";
    if (query === current) return;
    const timer = window.setTimeout(() => {
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      const suffix = params.toString();
      navigate(`/products${suffix ? `?${suffix}` : ""}`, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery, location.pathname, location.search, navigate]);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 flex h-10 items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              +232-76-123-456
            </span>
            <span className="hidden sm:inline">info@imkmarket.com</span>
          </div>
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <Link to="/super-admin" className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors">
                Super Admin
              </Link>
            )}
            {isAdmin && !isSuperAdmin && (
              <Link to="/admin" className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors">
                Admin Dashboard
              </Link>
            )}
            {isSeller && (
              <Link to="/seller" className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors">
                Seller Dashboard
              </Link>
            )}
            {isAuthenticated && (
              <button
                className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors underline decoration-dotted"
                onClick={logout}
              >
                Logout
              </button>
            )}
            <button className="flex items-center gap-1 hover:text-accent transition-colors">
              <Globe className="h-3 w-3" />
              English
            </button>
            {!isAuthenticated && (
              <Link to="/login" className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors">
                Login / Sign Up
              </Link>
            )}
            {isCustomerAuthenticated && (
              <Link to="/account" className="hidden sm:inline text-primary-foreground/80 hover:text-accent transition-colors">
                {user?.name || user?.phone || "My Account"}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-card shadow-md">
        <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6 flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/branding/imk-market-header.png"
              alt="IMK-Market"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <form
              className="relative flex w-full rounded-lg bg-gradient-to-r from-primary to-accent p-[2px]"
              onSubmit={handleSearch}
            >
              <div className="flex w-full bg-card rounded-[calc(0.5rem-2px)] overflow-hidden">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  size="icon"
                  className="h-10 w-12 rounded-none bg-accent hover:bg-accent/90"
                  type="submit"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => navigate(isCustomerAuthenticated ? "/account" : "/login")}
              aria-label={isCustomerAuthenticated ? "My Account" : "Login or Sign Up"}
              title={isCustomerAuthenticated ? "My Account" : "Login / Sign Up"}
            >
              <User className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              className="relative"
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-primary hidden md:block">
        <div className="mx-auto w-full max-w-[1920px] px-2 sm:px-4 lg:px-6">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${location.pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-primary-foreground hover:bg-primary/80"
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card border-t shadow-lg animate-fade-in">
          {/* Mobile search */}
          <div className="p-4 border-b">
            <form
              className="relative flex rounded-lg bg-gradient-to-r from-primary to-accent p-[2px]"
              onSubmit={handleSearch}
            >
              <div className="flex w-full bg-card rounded-[calc(0.5rem-2px)] overflow-hidden">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 rounded-none border-0"
                />
                <Button size="icon" className="h-10 w-12 rounded-none bg-accent" type="submit">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>

          <ul className="py-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${location.pathname === item.href
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-secondary"
                    }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
