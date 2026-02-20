import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Shield, Store, User } from "lucide-react";

declare global {
    interface Window {
        google?: {
            accounts?: {
                id?: {
                    initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
                    renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; width?: string }) => void;
                };
            };
        };
    }
}

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleIdentityScript = () =>
    new Promise<void>((resolve, reject) => {
        if (typeof window === "undefined") {
            resolve();
            return;
        }
        if (window.google?.accounts?.id) {
            resolve();
            return;
        }
        const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`) as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("Google script failed to load")));
            return;
        }
        const script = document.createElement("script");
        script.src = GOOGLE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Google script failed to load"));
        document.head.appendChild(script);
    });

export default function EnhancedLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, login, loginSuperAdmin, loginSeller, loginSellerWithGoogle, loginCustomer, registerCustomer, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("customer");
    const googleButtonRef = useRef<HTMLDivElement | null>(null);
    const [googleReady, setGoogleReady] = useState(false);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    const demoCustomerPhone = (import.meta.env.VITE_DEMO_CUSTOMER_PHONE as string | undefined) || "+23270000000";
    const demoCustomerPassword = (import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD as string | undefined) || "Demo@12345";
    const resolveRedirect = useCallback(
        (fallback: string) => {
            const state = location.state as { from?: { pathname?: string; search?: string } } | null;
            const targetPath = state?.from?.pathname;
            if (targetPath && targetPath !== "/login") {
                return `${targetPath}${state?.from?.search || ""}`;
            }
            return fallback;
        },
        [location.state],
    );

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
                    navigate(resolveRedirect("/super-admin"));
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
                    navigate(resolveRedirect("/admin"));
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
                toast.success("Welcome back, Partner!");
                if (result.mustReset) {
                    navigate("/reset-password");
                } else {
                    navigate(resolveRedirect("/seller"));
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

    const handleGoogleCredential = useCallback(
        async (credential: string) => {
            if (!credential) {
                toast.error("Google sign-in failed");
                return;
            }
            setIsLoading(true);
            try {
                const result = await loginSellerWithGoogle(credential);
                if (result.success) {
                toast.success("Welcome back, Partner!");
                    if (result.mustReset) {
                        navigate("/reset-password");
                    } else {
                        navigate(resolveRedirect("/seller"));
                    }
                    return;
                }
                if (result.status === "pending") {
                    toast.error("Your account is pending approval");
                    return;
                }
                if (result.status === "rejected") {
                    toast.error(`Your account was rejected: ${result.message || "No reason provided"}`);
                    return;
                }
                if (result.status === "not_registered") {
                    toast.error("No partner account found. Please register first.");
                    return;
                }
                toast.error(result.message || "Google sign-in failed");
            } catch {
                toast.error("Google sign-in failed");
            } finally {
                setIsLoading(false);
            }
        },
        [loginSellerWithGoogle, navigate, resolveRedirect],
    );

    useEffect(() => {
        let active = true;
        if (activeTab !== "seller" || !googleClientId) {
            return undefined;
        }
        loadGoogleIdentityScript()
            .then(() => {
                if (active) setGoogleReady(true);
            })
            .catch(() => {
                if (active) setGoogleReady(false);
            });
        return () => {
            active = false;
        };
    }, [activeTab, googleClientId]);

    useEffect(() => {
        if (!googleReady || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) {
            return;
        }
        window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
                if (response.credential) {
                    handleGoogleCredential(response.credential);
                }
            },
        });
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
        });
    }, [googleReady, googleClientId, handleGoogleCredential]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && ["customer", "seller", "admin", "super-admin"].includes(tab)) {
            setActiveTab(tab);
        }
        const mode = params.get("mode");
        if (tab === "customer" && (mode === "register" || mode === "login")) {
            setCustomerMode(mode);
        }
    }, [location.search]);

    // Customer Login
    const [customerData, setCustomerData] = useState({ phone: "", password: "" });
    const [customerRegisterData, setCustomerRegisterData] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [customerMode, setCustomerMode] = useState<"login" | "register">("login");

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
                    navigate("/account");
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

    const handleCustomerRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (customerRegisterData.password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        if (customerRegisterData.password !== customerRegisterData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }
        setIsLoading(true);
        try {
            const success = await registerCustomer({
                name: customerRegisterData.name.trim(),
                email: customerRegisterData.email.trim() || undefined,
                phone: customerRegisterData.phone.trim(),
                password: customerRegisterData.password,
            });
            if (success) {
                toast.success("Account created successfully.");
                navigate("/account");
            } else {
                toast.error("Registration failed");
            }
        } catch (error) {
            toast.error("Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setIsLoading(true);
        try {
            const result = await loginCustomer(demoCustomerPhone, demoCustomerPassword);
            if (result.success) {
                toast.success("Signed in with demo account");
                navigate("/account");
            } else {
                toast.error("Demo login failed");
            }
        } catch {
            toast.error("Demo login failed");
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
                    {isAuthenticated && user && (
                        <div className="mb-4 rounded-lg border border-border bg-secondary/20 p-3 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-medium">{user.name || user.email || "Signed in"}</p>
                                    <p className="text-muted-foreground">
                                        {user.roles?.length ? user.roles.join(", ") : "Account active"}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={logout}>
                                    Logout
                                </Button>
                            </div>
                        </div>
                    )}
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
                            {customerMode === "login" ? (
                                <form onSubmit={handleCustomerLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-phone">Phone Number</Label>
                                        <Input
                                            id="customer-phone"
                                            type="tel"
                                            placeholder="+232-XX-XXX-XXX"
                                            value={customerData.phone}
                                            onChange={(e) =>
                                                setCustomerData({ ...customerData, phone: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-password">Password</Label>
                                        <Input
                                            id="customer-password"
                                            type="password"
                                            value={customerData.password}
                                            onChange={(e) =>
                                                setCustomerData({ ...customerData, password: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sign in as Customer
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleDemoLogin}
                                        disabled={isLoading}
                                    >
                                        Use Demo Customer
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Demo: {demoCustomerPhone} / {demoCustomerPassword}
                                    </p>
                                    <p className="text-sm text-center text-muted-foreground">
                                        Don&apos;t have an account?{" "}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="p-0"
                                            onClick={() => setCustomerMode("register")}
                                        >
                                            Sign up
                                        </Button>
                                    </p>
                                </form>
                            ) : (
                                <form onSubmit={handleCustomerRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-name">Full Name</Label>
                                        <Input
                                            id="customer-name"
                                            placeholder="Full name"
                                            value={customerRegisterData.name}
                                            onChange={(e) =>
                                                setCustomerRegisterData({
                                                    ...customerRegisterData,
                                                    name: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-phone-register">Phone Number</Label>
                                        <Input
                                            id="customer-phone-register"
                                            type="tel"
                                            placeholder="+232-XX-XXX-XXX"
                                            value={customerRegisterData.phone}
                                            onChange={(e) =>
                                                setCustomerRegisterData({
                                                    ...customerRegisterData,
                                                    phone: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-email-register">Email (Optional)</Label>
                                        <Input
                                            id="customer-email-register"
                                            type="email"
                                            placeholder="email@example.com"
                                            value={customerRegisterData.email}
                                            onChange={(e) =>
                                                setCustomerRegisterData({
                                                    ...customerRegisterData,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-password-register">Password</Label>
                                        <Input
                                            id="customer-password-register"
                                            type="password"
                                            value={customerRegisterData.password}
                                            onChange={(e) =>
                                                setCustomerRegisterData({
                                                    ...customerRegisterData,
                                                    password: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer-confirm-password">Confirm Password</Label>
                                        <Input
                                            id="customer-confirm-password"
                                            type="password"
                                            value={customerRegisterData.confirmPassword}
                                            onChange={(e) =>
                                                setCustomerRegisterData({
                                                    ...customerRegisterData,
                                                    confirmPassword: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Customer Account
                                    </Button>
                                    <p className="text-sm text-center text-muted-foreground">
                                        Already have an account?{" "}
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="p-0"
                                            onClick={() => setCustomerMode("login")}
                                        >
                                            Sign in
                                        </Button>
                                    </p>
                                </form>
                            )}
                        </TabsContent>

                        {/* Seller Login */}
                        <TabsContent value="seller">
                            <form onSubmit={handleSellerLogin} className="space-y-4">
                                <div className="space-y-3">
                                    {googleClientId ? (
                                        <div className={isLoading ? "pointer-events-none opacity-60" : ""}>
                                            <div ref={googleButtonRef} />
                                        </div>
                                    ) : (
                                        <Button type="button" variant="outline" className="w-full" disabled>
                                            Google OAuth not configured
                                        </Button>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="h-px flex-1 bg-border" />
                                        <span className="text-xs text-muted-foreground">or</span>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>
                                </div>
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
                                    Sign in as Partner
                                </Button>
                                <p className="text-sm text-center text-muted-foreground">
                                    Want to sell or supply on IMK-Market?{" "}
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="p-0"
                                        onClick={() => navigate("/seller/register")}
                                    >
                                        Register as Partner
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
