import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";

export default function SellerRegistration() {
    const navigate = useNavigate();
    const { registerSeller } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        phone: "",
        businessName: "",
        ownerName: "",
        businessAddress: "",
        productCategory: "",
        description: "",
        tradeLicense: "",
        emiratesId: "",
        bankDetails: {
            accountName: "",
            accountNumber: "",
            bankName: "",
            iban: "",
            swiftCode: "",
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await registerSeller(formData);
            if (result.success) {
                toast.success("Registration successful! Your account is pending approval.");
                setTimeout(() => navigate("/login?tab=seller"), 2000);
            } else {
                toast.error(result.message || "Registration failed");
            }
        } catch (error) {
            toast.error("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <Store className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Seller Registration</CardTitle>
                    <CardDescription className="text-center">
                        Register your business to start selling on IMK-Market
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Account Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Account Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+232-XX-XXX-XXX"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Business Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="businessName">Business Name *</Label>
                                    <Input
                                        id="businessName"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="ownerName">Owner Name *</Label>
                                    <Input
                                        id="ownerName"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="businessAddress">Business Address *</Label>
                                <Input
                                    id="businessAddress"
                                    value={formData.businessAddress}
                                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="productCategory">Product Category *</Label>
                                    <Input
                                        id="productCategory"
                                        value={formData.productCategory}
                                        onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                                        placeholder="e.g., Electronics, Fashion"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="tradeLicense">Trade License</Label>
                                    <Input
                                        id="tradeLicense"
                                        value={formData.tradeLicense}
                                        onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="description">Business Description *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your business and products..."
                                    required
                                    minLength={20}
                                />
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Bank Details (Optional)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="accountName">Account Name</Label>
                                    <Input
                                        id="accountName"
                                        value={formData.bankDetails.accountName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                bankDetails: { ...formData.bankDetails, accountName: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bankName">Bank Name</Label>
                                    <Input
                                        id="bankName"
                                        value={formData.bankDetails.bankName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input
                                    id="accountNumber"
                                    value={formData.bankDetails.accountNumber}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Registering..." : "Register as Seller"}
                        </Button>

                        <p className="text-sm text-center text-muted-foreground">
                            Already have an account?{" "}
                            <Button
                                type="button"
                                variant="link"
                                className="p-0"
                                onClick={() => navigate("/login?tab=seller")}
                            >
                                Sign in
                            </Button>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
