"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, ClipboardList } from "lucide-react";

const statusBadge: Record<string, "status-success" | "status-info" | "status-warning" | "status-danger" | "status-neutral"> = {
  PENDING: "status-warning", CONFIRMED: "status-info", COMPLETED: "status-success", CANCELLED: "status-neutral",
};

export default function HRBookings() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/hr/bookings").then((r) => r.json()).then(setBookings).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">{bookings.length} bookings • Click any row for details, messages & evaluation</p>
      </div>
      <div className="space-y-3">
        {bookings.map((b) => (
          <Link key={b.id} href={`/hr/bookings/${b.id}`} className="block">
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{b.programTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {b.trainerName} · {b.category}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(b.programDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} · {b.participantCount} pax · <span className="capitalize">{b.venueAddress || "TBD"}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto flex-shrink-0">
                  <Badge variant={statusBadge[b.status] || "secondary"} className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">{b.status}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground font-mono">RM {b.totalFee.toLocaleString()}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {bookings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No bookings yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Browse programs in the marketplace to book your first training.</p>
            <Link href="/hr/marketplace" className="mt-4 text-sm text-primary hover:underline font-medium">Browse Marketplace →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
