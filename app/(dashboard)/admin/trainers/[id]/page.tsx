"use client";

import { useState, useEffect, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, BookOpen, DollarSign, Calendar, Mail, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminTrainerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trainer, setTrainer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/trainers/${id}`).then(r => r.json()).then(setTrainer).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-48 w-full rounded-lg" /></div>;
  if (!trainer) return <div className="py-20 text-center text-muted-foreground">Trainer not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/trainers"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div><h1 className="text-2xl font-bold">{trainer.name}</h1><p className="text-muted-foreground">{trainer.email}</p></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle><Star className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{trainer.profile?.rating?.toFixed(1) || "—"}</div><p className="text-xs text-muted-foreground">{trainer.profile?.totalPrograms || 0} lifetime programs</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">RM {trainer.stats.totalRevenue.toLocaleString()}</div><p className="text-xs text-muted-foreground">{trainer.stats.totalBookings} bookings</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rate</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">RM {trainer.profile?.hourlyRate}/h</div><p className="text-xs text-muted-foreground">Hourly rate</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bank</CardTitle><MapPin className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent><div className="text-sm font-medium">{trainer.profile?.bankName}</div><p className="text-xs text-muted-foreground">{trainer.profile?.bankAccount}</p></CardContent></Card>
      </div>

      {trainer.profile?.bio && <Card><CardHeader><CardTitle className="text-base">Bio</CardTitle></CardHeader><CardContent><p className="text-sm">{trainer.profile.bio}</p></CardContent></Card>}

      {trainer.profile?.expertise?.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Expertise</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{trainer.profile.expertise.map((e: string) => <Badge key={e} variant="secondary">{e}</Badge>)}</div></CardContent></Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Programs ({trainer.programs.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainer.programs.map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground leading-snug">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.bookings} bookings · {p.modules} modules</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto">
                  <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"} className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">{p.status}</Badge>
                  <span className="text-sm font-bold text-foreground font-mono">RM {p.revenue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {trainer.upcomingUnavailable?.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Upcoming Unavailable Dates</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{trainer.upcomingUnavailable.map((a: any) => <Badge key={a.date} variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />{a.date} — {a.reason || "Unavailable"}</Badge>)}</div></CardContent></Card>
      )}
    </div>
  );
}
