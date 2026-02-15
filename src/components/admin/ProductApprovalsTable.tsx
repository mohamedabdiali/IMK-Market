import { PendingProduct, ProductStatus } from "@/types/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface ProductApprovalsTableProps {
  products: PendingProduct[];
  onApprove: (productId: string) => void;
  onReject: (productId: string) => void;
}

const statusColors: Record<ProductStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function ProductApprovalsTable({ products, onApprove, onReject }: ProductApprovalsTableProps) {
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(product.price)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.sellerName}</p>
                    <p className="text-sm text-muted-foreground">{product.sellerEmail}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[product.status]} variant="outline">
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(product.submittedAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {product.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onApprove(product.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onReject(product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                <p className="text-gold font-bold">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Description</h4>
                <p>{selectedProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Category</h4>
                  <p>{selectedProduct.category}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Seller</h4>
                  <p>{selectedProduct.sellerName}</p>
                </div>
              </div>
              {selectedProduct.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onApprove(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      onReject(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
