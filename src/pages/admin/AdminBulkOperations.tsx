import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ProductManagementItem } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

function toCsv(products: ProductManagementItem[]) {
  const header = [
    "Name",
    "Price",
    "Category",
    "Description",
    "Seller",
    "Country",
    "InStock",
    "Image",
    "Stock",
    "LowStockThreshold",
  ];
  const rows = products.map((p) => [
    p.name,
    p.price.toFixed(2),
    p.category,
    p.description.replace(/"/g, '""'),
    p.sellerName || "",
    p.country || "",
    p.stock > 0 ? "Yes" : "No",
    p.image,
    String(p.stock),
    String(p.lowStockThreshold),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  if (!header) return [];
  return rows.map((line) => line.split(",").map((value) => value.replace(/^"|"$/g, "").replace(/""/g, '"')));
}

export default function AdminBulkOperations() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => api.getAdminProducts(token || ""),
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => api.createAdminProduct(token || "", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const handleExport = () => {
    const csv = toCsv(products as ProductManagementItem[]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imk-market-products-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleTemplate = () => {
    const template = `Name,Price,Category,Description,Seller,Country,InStock,Image,Stock,LowStockThreshold
"iPhone 15 Pro","999.00","Electronics","Latest iPhone with advanced camera","Apple Store","USA","Yes","https://example.com/iphone.jpg","20","5"`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Choose a CSV file to import.", variant: "destructive" });
      return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    let success = 0;
    for (const row of rows) {
      const [name, price, category, description, sellerName, country, , image, stock, lowStockThreshold] = row;
      if (!name || !price || !category || !description || !image) continue;
      await createMutation.mutateAsync({
        name,
        price: Number(price),
        category,
        description,
        image,
        stock: Number(stock || 0),
        lowStockThreshold: Number(lowStockThreshold || 10),
        sellerName: sellerName || undefined,
        country: country || undefined,
      });
      success += 1;
    }
    toast({ title: "Import complete", description: `${success} product(s) imported.` });
    setFile(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bulk Operations</h1>
          <p className="text-muted-foreground">Export products or import from CSV</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Button onClick={handleExport} disabled={!token}>
            Export Products
          </Button>
          <Button variant="outline" onClick={handleTemplate}>
            Download Template
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button onClick={handleImport} disabled={!token}>
            Import CSV
          </Button>
        </div>
      </main>
    </div>
  );
}
