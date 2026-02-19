import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Shield, Store, User } from "lucide-react";

export default function EnhancedLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, loginSuperAdmin, loginSeller, loginCustomer } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("customer");

    // Super Admin Login
    const [superAdminData, setSuperAdminData] = useState({ email: "", password: "" });
    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await loginSuperAdmin(superAdminData.email, superAdminData.password);
            if (result.success) {
                toast.success("Welcome, Super Admin!");
                if (result.mustReset) {
                    navigate("/reset-password");
                } else {
                    navigate("/super-admin");
                }
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error) {
            toast.error("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Admin/Manager Login
    const [adminData, setAdminData] = useState({ email: "", password: "" });
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await login(adminData.email, adminData.password);
            if (result.success) {
                toast.success("Welcome back!");
                if (result.mustReset) {
                    navigate("/reset-password");
                } else {
                    const state = location.state as { from?: { pathname?: string } } | null;
                    const from = state?.from?.pathname || "/admin";
                    navigate(from);
                }
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error) {
            toast.error("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    // Seller Login
    const [sellerData, setSellerData] = useState({ email: "", password: "" });
    const handleSellerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await loginSeller(sellerData.email, sellerData.password);
            if (result.success) {
                toast.success("Welcome back, Seller!");
                if (result.mustReset) {
                    navigate("/reset-password");
                } else {
                    navigate("/seller");
                }
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error: unknown) {
            const errorData = error && typeof error === "object" && "response" in error
                ? (error as { response?: { data?: { status?: string; reason?: string } } }).response?.data
                : undefined;
            const status = errorData?.status;
            if (status === "pending") {
                toast.error("Your account is pending approval");
            } else if (status === "rejected") {
                toast.error("Your account has been rejected: " + (errorData?.reason || "No reason provided"));
            } else {
                toast.error("Login failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Customer Login
    const [customerData, setCustomerData] = useState({ phone: "", password: "" });
    const handleCustomerLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await loginCustomer(customerData.phone, customerData.password);
            if (result.success) {
                toast.success("Welcome back!");
                if (result.mustReset) {
                    navigate("/reset-password");
                } else {
                    navigate("/");
                }
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error) {
            toast.error("Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Sign in to IMK-Market</CardTitle>
                    <CardDescription className="text-center">
                        Choose your account type to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="customer">
                                <User className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="seller">
                                <Store className="h-4 w-4" />
                            </TabsTrigger>
                            <TabsTrigger value="admin">Admin</TabsTrigger>
                            <TabsTrigger value="super-admin">
                                <Shield className="h-4 w-4" />
                            </TabsTrigger>
                        </TabsList>

                        {/* Customer Login */}
                        <TabsContent value="customer">
                            <form onSubmit={handleCustomerLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer-phone">Phone Number</Label>
                                    <Input
                                        id="customer-phone"
                                        type="tel"
                                        placeholder="+232-XX-XXX-XXX"
                                        value={customerData.phone}
                                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="customer-password">Password</Label>
                                    <Input
                                        id="customer-password"
                                        type="password"
                                        value={customerData.password}
                                        onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in as Customer
                                </Button>
                                <p className="text-sm text-center text-muted-foreground">
                                    Don't have an account?{" "}
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0"
                                        onClick={() => navigate("/register")}
                                    >
                                        Sign up
                                    </Button>
                                </p>
                            </form>
                        </TabsContent>

                        {/* Seller Login */}
                        <TabsContent value="seller">
                            <form onSubmit={handleSellerLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="seller-email">Email</Label>
                                    <Input
                                        id="seller-email"
                                        type="email"
                                        placeholder="seller@example.com"
                                        value={sellerData.email}
                                        onChange={(e) => setSellerData({ ...sellerData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="seller-password">Password</Label>
                                    <Input
                                        id="seller-password"
                                        type="password"
                                        value={sellerData.password}
                                        onChange={(e) => setSellerData({ ...sellerData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in as Seller
                                </Button>
                                <p className="text-sm text-center text-muted-foreground">
                                    Want to sell on IMK-Market?{" "}
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0"
                                        onClick={() => navigate("/seller/register")}
                                    >
                                        Register as Seller
                                    </Button>
                                </p>
                            </form>
                        </TabsContent>

                        {/* Admin Login */}
                        <TabsContent value="admin">
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-email">Email</Label>
                                    <Input
                                        id="admin-email"
                                        type="email"
                                        placeholder="admin@imk-market.com"
                                        value={adminData.email}
                                        onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-password">Password</Label>
                                    <Input
                                        id="admin-password"
                                        type="password"
                                        value={adminData.password}
                                        onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in as Admin
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Super Admin Login */}
                        <TabsContent value="super-admin">
                            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="super-admin-email">Email</Label>
                                    <Input
                                        id="super-admin-email"
                                        type="email"
                                        placeholder="admin@primmesisc.com"
                                        value={superAdminData.email}
                                        onChange={(e) => setSuperAdminData({ ...superAdminData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="super-admin-password">Password</Label>
                                    <Input
                                        id="super-admin-password"
                                        type="password"
                                        value={superAdminData.password}
                                        onChange={(e) => setSuperAdminData({ ...superAdminData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Sign in as Super Admin
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
