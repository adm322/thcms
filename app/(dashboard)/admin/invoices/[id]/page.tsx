"use client";

import { useState, useEffect, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/Toast";
import { ArrowLeft, Building2, User, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, "status-success" | "status-info" | "status-warning" | "status-danger" | "status-neutral"> = { PAID: "status-success", SENT: "status-info", OVERDUE: "status-danger", CANCELLED: "status-neutral" };

export default function AdminInvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/admin/invoices/${id}`).then(r => r.json()).then(setInvoice).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  async function markPaid() {
    const res = await fetch(`/api/admin/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID" }) });
    if (res.ok) { setInvoice((prev: any) => ({ ...prev, status: "PAID" })); toast("Invoice marked as paid", "success"); }
    else toast("Failed to update", "error");
  }

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-lg" /></div>;
  if (!invoice) return <div className="py-20 text-center text-muted-foreground">Invoice not found.</div>;

  const b = invoice.booking;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/invoices"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1><p className="text-muted-foreground">{b?.program?.title}</p></div>
        <Badge variant={statusColors[invoice.status] || "secondary"} className="ml-auto">{invoice.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Program:</span> {b?.program?.title}</p>
            <p><span className="text-muted-foreground">Category:</span> {b?.program?.category}</p>
            <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {b?.programDate ? new Date(b.programDate).toLocaleDateString("en-MY") : "—"}</p>
            <p className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {b?.company?.name}</p>
            <p className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-muted-foreground" /> {b?.program?.trainer?.name} ({b?.program?.trainer?.email})</p>
            <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{b?.status}</Badge></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Program Fee (Total)</span><span className="font-semibold">RM {invoice.amount.toLocaleString()}</span></div>
            <Separator />
            <div className="flex justify-between"><span>Platform Fee (12%)</span><span>RM {invoice.breakdown.platformFee.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Trainer Pay</span><span>RM {invoice.breakdown.trainerFee.toLocaleString()}</span></div>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground"><span>HRDF Levy (1%)</span><span>RM {invoice.breakdown.hrdfLevy.toLocaleString()}</span></div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>SST on Platform (8%)</span><span>RM {invoice.breakdown.sst.toLocaleString()}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Net Payable to Trainer</span><span>RM {invoice.breakdown.netPay.toLocaleString()}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Issued:</span> {new Date(invoice.issuedAt).toLocaleDateString("en-MY")}</p>
          <p><span className="text-muted-foreground">Due:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-MY") : "—"}</p>
          {invoice.paidAt && <p><span className="text-muted-foreground">Paid:</span> {new Date(invoice.paidAt).toLocaleDateString("en-MY")}</p>}
        </CardContent>
      </Card>

      {invoice.status !== "PAID" && (
        <Button onClick={markPaid} className="w-full"><CheckCircle2 className="mr-2 h-4 w-4" />Mark as Paid</Button>
      )}
    </div>
  );
}
