"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Receipt, Wallet, Building2, Landmark } from "lucide-react";

interface FinanceData {
  invoices: any[];
  summary: {
    totalProgramFees: number; totalTrainerFees: number; totalPlatformFees: number;
    totalHRDF: number; totalSST: number; totalNetPay: number;
    paidCount: number; totalInvoices: number;
  };
}

export default function FinancePanel() {
  const [data, setData] = useState<FinanceData | null>(null);

  useEffect(() => {
    fetch("/api/admin/finance").then(r => r.json()).then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading finance data...</div>;

  const { summary, invoices } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Panel</h1>
        <p className="text-muted-foreground">Payment breakdowns, trainer fees, platform revenue & taxes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium uppercase tracking-wider">
              <Receipt className="h-3.5 w-3.5" /> Total Program Fees
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {summary.totalProgramFees.toLocaleString()}</p>
            <p className="text-emerald-100 text-xs mt-1">{summary.paidCount} paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-medium uppercase tracking-wider">
              <Wallet className="h-3.5 w-3.5" /> Trainer Payouts
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {summary.totalNetPay.toLocaleString()}</p>
            <p className="text-muted-foreground text-xs mt-1">After fees & taxes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-violet-100 text-xs font-medium uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" /> Platform Revenue
            </div>
            <p className="text-3xl font-bold mt-2 tabular-nums">RM {summary.totalPlatformFees.toLocaleString()}</p>
            <p className="text-violet-100 text-xs mt-1">{Math.round((summary.totalPlatformFees / (summary.totalProgramFees || 1)) * 100)}% effective rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">HRDF Levy (1%)</p>
            <p className="text-lg font-bold tabular-nums">RM {summary.totalHRDF.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Landmark className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">SST (8% on fee)</p>
            <p className="text-lg font-bold tabular-nums">RM {summary.totalSST.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Gross Trainer Fee</p>
            <p className="text-lg font-bold tabular-nums">RM {summary.totalTrainerFees.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-muted-foreground">Net Pay to Trainers</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600">RM {summary.totalNetPay.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Breakdown Table */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({invoices.filter(i => i.status === "PAID").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <InvoiceTable invoices={invoices} />
        </TabsContent>
        <TabsContent value="paid" className="mt-4">
          <InvoiceTable invoices={invoices.filter(i => i.status === "PAID")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvoiceTable({ invoices }: { invoices: any[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Program</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Program Fee</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Trainer Fee</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">HRDF</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">SST</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Pay</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inv.companyName}</td>
                  <td className="px-4 py-3 text-xs max-w-[160px] truncate">{inv.programTitle}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums">RM {inv.programFee?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums">RM {inv.trainerFee?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums text-violet-600">RM {inv.platformFee?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums text-amber-600">RM {inv.hrdfFee?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums text-red-500">RM {inv.sst?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-right tabular-nums font-semibold text-emerald-600">RM {inv.netPay?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={inv.status === "PAID" ? "default" : inv.status === "SENT" ? "secondary" : "outline"} className="text-[10px]">{inv.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
