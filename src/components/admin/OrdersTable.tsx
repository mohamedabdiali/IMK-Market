import { useEffect, useState } from "react";
import { AdminOrder, AdminTrackingUpdatePayload, OrderStatus } from "@/types/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrdersTableProps {
  orders: AdminOrder[];
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onTrackingUpdate: (orderId: string, payload: AdminTrackingUpdatePayload) => Promise<void>;
  onApprovePayment: (orderId: string) => Promise<void>;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const toDateInputValue = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return format(date, "MMM dd, yyyy HH:mm");
};

export function OrdersTable({ orders, onStatusChange, onTrackingUpdate, onApprovePayment }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [isApprovingPayment, setIsApprovingPayment] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: "",
    trackingCarrier: "",
    trackingUrl: "",
    currentLocation: "",
    estimatedDelivery: "",
    note: "",
  });

  useEffect(() => {
    if (!selectedOrder) return;
    setTrackingForm({
      trackingNumber: selectedOrder.trackingNumber || "",
      trackingCarrier: selectedOrder.trackingCarrier || "",
      trackingUrl: selectedOrder.trackingUrl || "",
      currentLocation: selectedOrder.currentLocation || "",
      estimatedDelivery: toDateInputValue(selectedOrder.estimatedDelivery),
      note: "",
    });
  }, [selectedOrder]);

  const handleTrackingSave = async () => {
    if (!selectedOrder) return;

    const payload: AdminTrackingUpdatePayload = {};
    const trackingNumber = trackingForm.trackingNumber.trim();
    const trackingCarrier = trackingForm.trackingCarrier.trim();
    const trackingUrl = trackingForm.trackingUrl.trim();
    const currentLocation = trackingForm.currentLocation.trim();
    const note = trackingForm.note.trim();

    if (trackingNumber && trackingNumber !== (selectedOrder.trackingNumber || "")) {
      payload.trackingNumber = trackingNumber;
    }
    if (trackingCarrier && trackingCarrier !== (selectedOrder.trackingCarrier || "")) {
      payload.trackingCarrier = trackingCarrier;
    }
    if (trackingUrl && trackingUrl !== (selectedOrder.trackingUrl || "")) {
      payload.trackingUrl = trackingUrl;
    }
    if (currentLocation && currentLocation !== (selectedOrder.currentLocation || "")) {
      payload.currentLocation = currentLocation;
    }
    if (trackingForm.estimatedDelivery) {
      const estimateIso = new Date(`${trackingForm.estimatedDelivery}T12:00:00.000Z`).toISOString();
      if (estimateIso !== selectedOrder.estimatedDelivery) {
        payload.estimatedDelivery = estimateIso;
      }
    }
    if (note) {
      payload.note = note;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: "No changes detected",
        description: "Update at least one tracking field before saving.",
      });
      return;
    }

    try {
      setIsSavingTracking(true);
      await onTrackingUpdate(selectedOrder.id, payload);
      setSelectedOrder(null);
    } catch {
      toast({
        title: "Tracking update failed",
        description: "Please check the fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingTracking(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Tracking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.orderTrackingId || order.trackingNumber || order.id}</div>
                  <div className="text-xs text-muted-foreground">Order: {order.id}</div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                  </div>
                </TableCell>
                <TableCell>{order.items.length} item(s)</TableCell>
                <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                <TableCell>{order.cargoType || "Standard"}</TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) => onStatusChange(order.id, value as OrderStatus)}
                  >
                    <SelectTrigger className="w-32">
                      <Badge className={statusColors[order.status]} variant="outline">
                        {order.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="h-[92vh] w-[96vw] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl">
              Order Management - {selectedOrder?.orderTrackingId || selectedOrder?.trackingNumber || selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="h-[calc(92vh-78px)] overflow-y-auto px-6 py-5 space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">Order Tracking ID</div>
                  <div className="font-semibold">{selectedOrder.orderTrackingId || selectedOrder.trackingNumber || selectedOrder.id}</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">Order ID</div>
                  <div className="font-semibold">{selectedOrder.id}</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">Placed On</div>
                  <div className="font-semibold">{formatDateTime(selectedOrder.createdAt)}</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">Items</div>
                  <div className="font-semibold">{selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} units</div>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <div className="text-xs text-muted-foreground">Order Total</div>
                  <div className="font-semibold">{formatCurrency(selectedOrder.total)}</div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="text-sm"><span className="text-muted-foreground">Name:</span> {selectedOrder.customerName}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Email:</span> {selectedOrder.customerEmail}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Phone:</span> {selectedOrder.customerPhone || "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Shipping Address:</span> {selectedOrder.shippingAddress}</div>
                </div>

                <div className="rounded-xl border border-border/60 p-4 space-y-2">
                  <h4 className="font-semibold">Order & Shipment Information</h4>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge className={statusColors[selectedOrder.status]} variant="outline">
                      {selectedOrder.status}
                    </Badge>
                    {selectedOrder.paymentStatus && (
                      <Badge variant="outline" className="capitalize">
                        Payment: {selectedOrder.paymentStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm"><span className="text-muted-foreground">Cargo Type:</span> {selectedOrder.cargoType || "Standard"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Carrier:</span> {selectedOrder.trackingCarrier || "IMK Logistics"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Tracking Number:</span> {selectedOrder.trackingNumber || "Not assigned"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Current Location:</span> {selectedOrder.currentLocation || "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Estimated Delivery:</span> {formatDateTime(selectedOrder.estimatedDelivery)}</div>
                </div>

                <div className="rounded-xl border border-border/60 p-4 space-y-3">
                  <h4 className="font-semibold">Payment Information & Proof</h4>
                  <div className="text-sm"><span className="text-muted-foreground">Method:</span> {selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replace(/_/g, " ") : "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Status:</span> {selectedOrder.paymentStatus || "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Reference:</span> {selectedOrder.paymentReference || "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Payment ID:</span> {selectedOrder.paymentId || "N/A"}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Proof Submitted:</span> {formatDateTime(selectedOrder.paymentProofSubmittedAt)}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Proof Approved:</span> {formatDateTime(selectedOrder.paymentProofApprovedAt)}</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border/60 p-2">
                      <p className="text-xs text-muted-foreground mb-2">Payment Image Proof</p>
                      {selectedOrder.paymentProofImage ? (
                        <a href={selectedOrder.paymentProofImage} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={selectedOrder.paymentProofImage}
                            alt="Payment proof"
                            className="h-40 w-full rounded-md bg-muted/30 object-contain"
                          />
                        </a>
                      ) : (
                        <div className="h-40 w-full rounded-md border border-dashed border-border/70 bg-muted/20 grid place-items-center text-xs text-muted-foreground">
                          No payment image uploaded
                        </div>
                      )}
                    </div>
                    <div className="rounded-md border border-border/60 p-2">
                      <p className="text-xs text-muted-foreground mb-2">Payment Video Proof</p>
                      {selectedOrder.paymentProofVideo ? (
                        <video
                          src={selectedOrder.paymentProofVideo}
                          controls
                          className="h-40 w-full rounded-md bg-muted/30 object-contain"
                        />
                      ) : (
                        <div className="h-40 w-full rounded-md border border-dashed border-border/70 bg-muted/20 grid place-items-center text-xs text-muted-foreground">
                          No payment video uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOrder.paymentMethod !== "cod" && selectedOrder.paymentStatus !== "paid" && (
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsApprovingPayment(true);
                          await onApprovePayment(selectedOrder.id);
                          setSelectedOrder(null);
                        } catch {
                          toast({
                            title: "Payment approval failed",
                            description: "Confirm that payment proof is uploaded, then try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsApprovingPayment(false);
                        }
                      }}
                      disabled={isApprovingPayment}
                    >
                      {isApprovingPayment ? "Approving..." : "Approve Payment"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3">
                <h4 className="font-semibold">Full Order Items</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, idx) => (
                        <TableRow key={`${item.productName}-${idx}`}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-2 border-t pt-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Total Quantity:</span>{" "}
                    <span className="font-semibold">{selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} units</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-muted-foreground">Grand Total:</span>{" "}
                    <span className="font-semibold">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 p-4 space-y-3">
                <h4 className="font-semibold">Tracking Control</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tracking Number</label>
                    <Input
                      value={trackingForm.trackingNumber}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, trackingNumber: event.target.value }))
                      }
                      placeholder="TRK-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Carrier</label>
                    <Input
                      value={trackingForm.trackingCarrier}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, trackingCarrier: event.target.value }))
                      }
                      placeholder="IMK Logistics"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Estimated Delivery</label>
                    <Input
                      type="date"
                      value={trackingForm.estimatedDelivery}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, estimatedDelivery: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tracking URL</label>
                    <Input
                      value={trackingForm.trackingUrl}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, trackingUrl: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Current Location</label>
                    <Input
                      value={trackingForm.currentLocation}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, currentLocation: event.target.value }))
                      }
                      placeholder="Transit hub"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tracking Note</label>
                  <Textarea
                    value={trackingForm.note}
                    onChange={(event) =>
                      setTrackingForm((prev) => ({ ...prev, note: event.target.value }))
                    }
                    placeholder="Optional update visible in customer tracking timeline..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" onClick={handleTrackingSave} disabled={isSavingTracking}>
                    {isSavingTracking ? "Saving..." : "Save Tracking Update"}
                  </Button>
                </div>
              </div>

              {selectedOrder.trackingEvents && selectedOrder.trackingEvents.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4">
                  <h4 className="font-semibold mb-3">Tracking Timeline</h4>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {selectedOrder.trackingEvents.map((event) => (
                      <div key={event.id} className="rounded-md border border-border/60 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{event.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(event.eventAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.message}</p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-1">Location: {event.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
