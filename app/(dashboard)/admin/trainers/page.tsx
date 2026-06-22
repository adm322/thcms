"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronRight, User } from "lucide-react";
import Link from "next/link";

export default function AdminTrainers() {
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/trainers").then((r) => r.json()).then(setTrainers).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trainers</h1>
        <p className="text-sm text-muted-foreground mt-1">{trainers.length} trainers • Click any row to view profile, programs & earnings</p>
      </div>
      <div className="space-y-2">
        {trainers.map((t) => (
          <Link key={t.id} href={`/admin/trainers/${t.id}`}>
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.email} • {t.programs} programs</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {t.rating?.toFixed(1) || "N/A"}
                  </span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {trainers.length === 0 && (
          <Card><CardContent className="py-16 text-center text-muted-foreground">No trainers found.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
