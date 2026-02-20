import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProtectedRoute as RBACProtectedRoute } from "@/components/ProtectedRoute";
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
import CustomerDashboard from "./pages/CustomerDashboard";
import Policies from "./pages/Policies";
import Solutions from "./pages/Solutions";
import Partners from "./pages/Partners";
import Suppliers from "./pages/Suppliers";
import Manufacturers from "./pages/Manufacturers";
import ShippingInfo from "./pages/ShippingInfo";
import ReturnsRefunds from "./pages/ReturnsRefunds";
import Protections from "./pages/Protections";

import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminProductManagement from "./pages/admin/AdminProductManagement";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBulkOperations from "./pages/admin/AdminBulkOperations";
import AdminEmail from "./pages/admin/AdminEmail";
import AdminFlashDeals from "./pages/admin/AdminFlashDeals";
import AdminFlashAds from "./pages/admin/AdminFlashAds";

// New RBAC Components
import EnhancedLogin from "./pages/EnhancedLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import SellerRegistration from "./pages/SellerRegistration";
import Unauthorized from "./pages/Unauthorized";
import ResetPassword from "./pages/ResetPassword";

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
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/account" element={<CustomerDashboard />} />
                <Route path="/solutions" element={<Solutions />} />
                <Route path="/partners" element={<Partners />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/manufacturers" element={<Manufacturers />} />
                <Route path="/shipping" element={<ShippingInfo />} />
                <Route path="/returns" element={<ReturnsRefunds />} />
                <Route path="/protections" element={<Protections />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/order" element={<Order />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/market-prices" element={<MarketPrices />} />
                <Route path="/policies" element={<Policies />} />

                {/* Enhanced Authentication Routes */}
                <Route path="/login" element={<EnhancedLogin />} />
                <Route path="/seller/register" element={<SellerRegistration />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/reset-password" element={<RBACProtectedRoute allowPasswordReset><ResetPassword /></RBACProtectedRoute>} />

                {/* Super Admin Routes */}
                <Route path="/super-admin" element={<RBACProtectedRoute requireSuperAdmin><SuperAdminDashboard /></RBACProtectedRoute>} />

                {/* Seller Routes */}
                <Route path="/seller" element={<RBACProtectedRoute requireSeller><SellerDashboard /></RBACProtectedRoute>} />

                {/* Legacy Admin Routes */}
                <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/product-management" element={<ProtectedRoute><AdminProductManagement /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
                <Route path="/admin/flash-deals" element={<ProtectedRoute><AdminFlashDeals /></ProtectedRoute>} />
                <Route path="/admin/flash-ads" element={<ProtectedRoute><AdminFlashAds /></ProtectedRoute>} />
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
