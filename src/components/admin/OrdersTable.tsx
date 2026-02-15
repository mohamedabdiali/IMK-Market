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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.orderTrackingId || selectedOrder?.trackingNumber || selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Customer</h4>
                <p>{selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                {selectedOrder.customerPhone && (
                  <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Shipping Address</h4>
                <p>{selectedOrder.shippingAddress}</p>
              </div>
              {(selectedOrder.paymentMethod || selectedOrder.paymentStatus) && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Payment</h4>
                  {selectedOrder.paymentMethod && (
                    <p className="capitalize">Method: {selectedOrder.paymentMethod.replace(/_/g, " ")}</p>
                  )}
                  {selectedOrder.paymentStatus && <p>Status: {selectedOrder.paymentStatus}</p>}
                  {selectedOrder.paymentReference && (
                    <p className="text-sm text-muted-foreground">
                      Reference: {selectedOrder.paymentReference}
                    </p>
                  )}
                  {selectedOrder.paymentId && (
                    <p className="text-sm text-muted-foreground">
                      Payment ID: {selectedOrder.paymentId}
                    </p>
                  )}
                  {selectedOrder.paymentProofSubmittedAt && (
                    <p className="text-sm text-muted-foreground">
                      Proof Submitted: {format(new Date(selectedOrder.paymentProofSubmittedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                  {selectedOrder.paymentProofApprovedAt && (
                    <p className="text-sm text-muted-foreground">
                      Proof Approved: {format(new Date(selectedOrder.paymentProofApprovedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  )}
                  {(selectedOrder.paymentProofImage || selectedOrder.paymentProofVideo) && (
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      {selectedOrder.paymentProofImage && (
                        <a href={selectedOrder.paymentProofImage} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={selectedOrder.paymentProofImage}
                            alt="Payment proof"
                            className="h-28 w-full rounded-md border border-border/60 object-cover"
                          />
                        </a>
                      )}
                      {selectedOrder.paymentProofVideo && (
                        <video
                          src={selectedOrder.paymentProofVideo}
                          controls
                          className="h-28 w-full rounded-md border border-border/60 object-cover"
                        />
                      )}
                    </div>
                  )}
                  {selectedOrder.paymentMethod !== "cod" && selectedOrder.paymentStatus !== "paid" && (
                    <div className="mt-3">
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
                    </div>
                  )}
                </div>
              )}
              {selectedOrder.cargoType && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Cargo Type</h4>
                  <p className="capitalize">{selectedOrder.cargoType}</p>
                </div>
              )}
              <div className="rounded-lg border border-border/60 p-4 space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Tracking Control</h4>
                <div className="grid sm:grid-cols-2 gap-3">
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
                    <label className="text-xs text-muted-foreground mb-1 block">Tracking URL</label>
                    <Input
                      value={trackingForm.trackingUrl}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, trackingUrl: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Current Location</label>
                    <Input
                      value={trackingForm.currentLocation}
                      onChange={(event) =>
                        setTrackingForm((prev) => ({ ...prev, currentLocation: event.target.value }))
                      }
                      placeholder="Transit hub"
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
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Tracking Timeline</h4>
                  <div className="space-y-2 max-h-44 overflow-auto pr-1">
                    {selectedOrder.trackingEvents.map((event) => (
                      <div key={event.id} className="rounded-md border border-border/60 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{event.title}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.eventAt), "MMM dd, yyyy HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.message}</p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground mt-1">Location: {event.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
