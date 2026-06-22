"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/invoices").then((r) => r.json()).then(setInvoices).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">{invoices.length} invoices • Click any row to view details & mark as paid</p>
      </div>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{inv.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.companyName} • Due {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">RM {inv.amount.toLocaleString()}</span>
                  <Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"} className="text-xs">{inv.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {invoices.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No invoices found.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
