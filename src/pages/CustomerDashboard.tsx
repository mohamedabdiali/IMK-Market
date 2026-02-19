import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { Heart, Package, ShieldCheck, ShoppingBag, Truck, User } from "lucide-react";

export default function CustomerDashboard() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useWishlist();
  const isCustomer = user?.source === "customer";

  if (!isCustomer) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1">
          <section className="container py-16">
            <div className="mx-auto max-w-xl rounded-xl border bg-card p-8 text-center">
              <h1 className="text-2xl font-bold">Customer Account Required</h1>
              <p className="text-muted-foreground mt-2">
                {isAuthenticated
                  ? "You're signed in with a non-customer account. Please switch to a customer account to access your dashboard."
                  : "Please sign in to your customer account to access your dashboard."}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login?tab=customer" state={{ from: location }}>
                  <Button variant="gold">Login / Sign Up</Button>
                </Link>
                {isAuthenticated && (
                  <Button variant="outline" onClick={logout}>
                    Logout
                  </Button>
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-10">
          <div className="container flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-primary-foreground/70">Welcome back</p>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                {user?.name || "Customer"} Dashboard
              </h1>
              <p className="text-primary-foreground/80 mt-2">
                Manage your orders, wishlist, and account preferences in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-accent text-accent-foreground">Customer</Badge>
              <Badge variant="outline" className="border-primary-foreground/40 text-primary-foreground/80">
                Account Active
              </Badge>
            </div>
          </div>
        </section>

        <section className="container py-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Items</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Items in wishlist</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Order history will appear here</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Live tracking updates</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Secure Account</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Enabled</div>
                <p className="text-xs text-muted-foreground">Customer protections active</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump straight to what you need.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Link to="/products">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </Link>
                <Link to="/order">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Start New Order
                  </Button>
                </Link>
                <Link to="/track-order">
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="mr-2 h-4 w-4" />
                    Track an Order
                  </Button>
                </Link>
                <Link to="/wishlist">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="mr-2 h-4 w-4" />
                    View Wishlist
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>Keep your profile up to date.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.name || "Customer"}</span>
                </div>
                <div className="text-muted-foreground">Email: {user?.email || "Not set"}</div>
                <div className="text-muted-foreground">Phone: {user?.phone || "Not set"}</div>
                <Button variant="outline" className="w-full" disabled>
                  Profile updates coming soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest purchases and delivery updates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground/60" />
                <div>
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground">
                    Place an order to see tracking details and delivery updates here.
                  </p>
                </div>
                <Link to="/products">
                  <Button variant="gold">Start Shopping</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
