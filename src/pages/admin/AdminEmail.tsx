import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopActions } from "@/components/admin/AdminTopActions";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EmailHistoryItem } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminEmail() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState("");

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["email-history"],
    queryFn: () => api.getEmailHistory(token || ""),
    enabled: Boolean(token),
  });

  const testMutation = useMutation({
    mutationFn: () => api.sendTestEmail(token || "", testEmail || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-history"] });
      toast({ title: "Test email sent", description: "Check your inbox." });
    },
  });

  const lowStockMutation = useMutation({
    mutationFn: () => api.sendLowStockAlerts(token || ""),
    onSuccess: (data: { sent: number }) => {
      queryClient.invalidateQueries({ queryKey: ["email-history"] });
      toast({
        title: "Low stock alerts sent",
        description: `${data.sent} alert(s) sent.`,
      });
    },
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <AdminTopActions />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Email Management</h1>
          <p className="text-muted-foreground">Send test emails and review history</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Test email address (optional)"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={() => testMutation.mutate()} disabled={!token}>
            Send Test Email
          </Button>
          <Button variant="outline" onClick={() => lowStockMutation.mutate()} disabled={!token}>
            Send Low Stock Alerts
          </Button>
        </div>

        {!token ? (
          <div className="text-muted-foreground">Please sign in to view email history.</div>
        ) : isLoading ? (
          <div className="text-muted-foreground">Loading email history...</div>
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history as EmailHistoryItem[]).map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>{email.to}</TableCell>
                    <TableCell>{email.subject}</TableCell>
                    <TableCell>{email.template}</TableCell>
                    <TableCell>{email.status}</TableCell>
                    <TableCell>{new Date(email.sentAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
}
