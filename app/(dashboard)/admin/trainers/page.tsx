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
      <div className="space-y-3">
        {trainers.map((t) => (
          <Link key={t.id} href={`/admin/trainers/${t.id}`} className="block">
            <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{t.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {t.rating?.toFixed(1) || "N/A"}
                    </span>
                    <Badge variant="default" className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{t.programs} programs</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
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
