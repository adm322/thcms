"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, ClipboardList } from "lucide-react";

const statusBadge: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary", CONFIRMED: "default", COMPLETED: "outline", CANCELLED: "destructive",
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
      <div className="space-y-2">
        {bookings.map((b) => (
          <Link key={b.id} href={`/hr/bookings/${b.id}`}>
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{b.programTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.trainerName} • {new Date(b.programDate).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} • {b.participantCount} pax
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold">RM {b.totalFee.toLocaleString()}</span>
                  <Badge variant={statusBadge[b.status] || "secondary"} className="text-xs">{b.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
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
    </div>
  );
}
