"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

interface Earning {
  id: string;
  programTitle: string;
  companyName: string;
  date: string;
  totalFee: number;
  depositPaid: number;
  status: string;
}

export default function TrainerEarnings() {
  const [stats, setStats] = useState<any>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);

  useEffect(() => {
    fetch("/api/trainer/earnings")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setEarnings(data.bookings || []);
      })
      .catch(console.error);
  }, []);

  const totalEarnings = earnings
    .filter((e) => e.status !== "CANCELLED")
    .reduce((s, e) => s + e.totalFee, 0);

  const pendingEarnings = earnings
    .filter((e) => e.status === "PENDING")
    .reduce((s, e) => s + e.totalFee, 0);

  const thisMonth = new Date().getMonth();
  const thisMonthEarnings = earnings
    .filter((e) => new Date(e.date).getMonth() === thisMonth && e.status !== "CANCELLED")
    .reduce((s, e) => s + e.totalFee, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{earnings.length} bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {pendingEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {thisMonthEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-MY", { month: "long" })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Earnings Breakdown</CardTitle></CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No earnings yet.</p>
          ) : (
            <div className="space-y-2">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{e.programTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.companyName} • {new Date(e.date).toLocaleDateString("en-MY")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-semibold text-sm">RM {e.totalFee.toLocaleString()}</span>
                    <Badge variant={e.status === "COMPLETED" ? "default" : e.status === "CONFIRMED" ? "outline" : "secondary"}>
                      {e.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
