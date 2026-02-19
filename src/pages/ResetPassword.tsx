import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ResetPassword() {
    const navigate = useNavigate();
    const { user, refreshToken } = useAuth();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const requiresCurrent = !user?.mustResetPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        setIsLoading(true);
        try {
            await api.post("/auth/password/reset", {
                newPassword,
                ...(requiresCurrent ? { currentPassword } : {}),
            });
            toast.success("Password updated");
            await refreshToken();
            navigate("/");
        } catch (error) {
            console.error("Password reset failed", error);
            toast.error("Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">
                        {requiresCurrent
                            ? "Update your password to continue."
                            : "A password reset is required before you can continue."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {requiresCurrent && (
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
