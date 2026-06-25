"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";

interface BookingItem {
  id: string;
  programTitle: string;
  programCategory: string;
  companyName: string;
  programDate: string;
  status: string;
  totalFee: number;
  participantCount: number;
  maxParticipants: number;
  createdAt: string;
}

const STATUSES = ["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: "⏳",
  CONFIRMED: "📅",
  COMPLETED: "✅",
  CANCELLED: "❌",
};

export default function TrainerBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/trainer/bookings?${params}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [status, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return (
    <div className="space-y-6 max-w-5xl section-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground text-sm">All training sessions booked with you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search program or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {status !== "ALL"
                ? `No ${status.toLowerCase()} bookings.`
                : search
                ? "No bookings match your search."
                : "No bookings yet."}
            </p>
            {!search && status === "ALL" && (
              <Link href="/trainer/programs" className="text-primary hover:underline text-sm mt-1 inline-block">
                Publish a program to start receiving bookings
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => (
            <Link key={b.id} href={`/trainer/bookings/${b.id}`} className="block">
              <Card className="stagger-item hover:shadow-sm transition-shadow cursor-pointer"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-center flex-shrink-0 w-14">
                    <p className="text-lg font-bold leading-none">
                      {new Date(b.programDate).getDate()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {new Date(b.programDate).toLocaleDateString("en-MY", { month: "short", year: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{b.programTitle}</p>
                      <Badge className={`text-[10px] ${STATUS_COLORS[b.status] || ""}`}>
                        {STATUS_ICONS[b.status] || ""} {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.companyName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {b.participantCount}/{b.maxParticipants || "∞"}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        RM {b.totalFee.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
