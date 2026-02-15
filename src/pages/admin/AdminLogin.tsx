import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/admin");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="absolute inset-0 pointer-events-none opacity-30 [background-image:radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_70%_65%,rgba(255,215,0,0.12),transparent_50%)]" />
      <Card className="w-full max-w-md relative border-border/50 bg-background/90 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to manage products, orders, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@imkmarket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Back to store
            </button>
          </div>
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Demo credentials:</strong><br />
              Email: admin@imkmarket.com<br />
              Password: admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
