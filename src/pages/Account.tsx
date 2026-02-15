import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Account() {
  const { user, isAuthenticated, isAdmin, loginCustomer, registerCustomer, logout } = useAuth();
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginData, setLoginData] = useState({
    phone: "",
    password: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password correctly.",
        variant: "destructive",
      });
      return;
    }
    if (registerData.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Use at least 6 characters for your password.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    try {
      const success = await registerCustomer({
        name: registerData.name.trim(),
        email: registerData.email.trim() || undefined,
        phone: registerData.phone.trim(),
        password: registerData.password,
      });
      if (!success) {
        toast({
          title: "Registration failed",
          description: "Phone number may already be used or input is invalid.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Account created",
        description: "Your customer account was created successfully.",
      });
      setRegisterData({
        name: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    try {
      const success = await loginCustomer(loginData.phone.trim(), loginData.password);
      if (!success) {
        toast({
          title: "Login failed",
          description: "Invalid phone number or password.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Signed in",
        description: "You are now signed in to your customer account.",
      });
      setLoginData({ phone: "", password: "" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 md:p-8">
            <h1 className="text-3xl font-bold">Customer Account</h1>
            <p className="text-muted-foreground mt-2">
              Create your account with phone number or sign in to continue.
            </p>
            {isAuthenticated && user && !isAdmin && (
              <div className="mt-4 rounded-lg border border-border bg-secondary/20 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{user.name || "Customer"}</p>
                  <p className="text-sm text-muted-foreground">{user.phone || user.email}</p>
                </div>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <form onSubmit={handleRegister} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold">Create Account</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name *</label>
                <Input
                  required
                  value={registerData.name}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                <Input
                  required
                  value={registerData.phone}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+232-xx-xxxxxx"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email (Optional)</label>
                <Input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password *</label>
                <Input
                  required
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password *</label>
                <Input
                  required
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Repeat password"
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <form onSubmit={handleLogin} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-semibold">Sign In</h2>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone Number *</label>
                <Input
                  required
                  value={loginData.phone}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+232-xx-xxxxxx"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password *</label>
                <Input
                  required
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Your password"
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
