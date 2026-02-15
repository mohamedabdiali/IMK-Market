import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Sell from "./pages/Sell";
import Order from "./pages/Order";
import TrackOrder from "./pages/TrackOrder";
import MarketPrices from "./pages/MarketPrices";
import Wishlist from "./pages/Wishlist";
import Account from "./pages/Account";

import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminProductManagement from "./pages/admin/AdminProductManagement";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBulkOperations from "./pages/admin/AdminBulkOperations";
import AdminEmail from "./pages/admin/AdminEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/account" element={<Account />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/order" element={<Order />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/market-prices" element={<MarketPrices />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/product-management" element={<ProtectedRoute><AdminProductManagement /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/bulk-operations" element={<ProtectedRoute><AdminBulkOperations /></ProtectedRoute>} />
                <Route path="/admin/email" element={<ProtectedRoute><AdminEmail /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
