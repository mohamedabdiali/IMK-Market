import { useState } from "react";
import { InventoryItem } from "@/types/admin";
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
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface InventoryTableProps {
  inventory: InventoryItem[];
  onUpdateStock: (itemId: string, newStock: number) => void;
}

export function InventoryTable({ inventory, onUpdateStock }: InventoryTableProps) {
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockAmount, setRestockAmount] = useState("");

  const handleRestock = () => {
    if (restockItem && restockAmount) {
      onUpdateStock(restockItem.id, restockItem.stock + parseInt(restockAmount));
      setRestockItem(null);
      setRestockAmount("");
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Restocked</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => {
              const isLowStock = item.stock <= item.lowStockThreshold;
              const isOutOfStock = item.stock === 0;
              
              return (
                <TableRow key={item.id} className={cn(isLowStock && "bg-red-50/50")}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{item.productName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold",
                        isOutOfStock && "text-red-600",
                        isLowStock && !isOutOfStock && "text-yellow-600"
                      )}>
                        {item.stock}
                      </span>
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isOutOfStock ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : isLowStock ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(item.lastRestocked), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRestockItem(item)}
                    >
                      Restock
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!restockItem} onOpenChange={() => setRestockItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockItem?.productName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{restockItem?.stock} units</p>
            </div>
            <div>
              <label className="text-sm font-medium">Add Stock</label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestock} disabled={!restockAmount}>
              Confirm Restock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
