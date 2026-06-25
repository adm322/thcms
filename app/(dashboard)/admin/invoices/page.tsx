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
      <div className="space-y-3">
        {invoices.map((inv) => (
          <Link key={inv.id} href={`/admin/invoices/${inv.id}`} className="block">
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      {inv.programTitle} · {inv.companyName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {inv.trainerName} · {inv.date ? new Date(inv.date).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—"} · {inv.participantCount} pax · <span className="capitalize">{inv.venueAddress || "TBD"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto flex-shrink-0">
                  <Badge variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"} className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">{inv.status}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground font-mono">RM {inv.amount.toLocaleString()}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
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
