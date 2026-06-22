"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, BookOpen, Copy, ChevronRight } from "lucide-react";

interface Program {
  id: string;
  title: string;
  category: string;
  durationHours: number;
  maxParticipants: number;
  pricePerPax: number;
  status: string;
  moduleCount: number;
  bookingCount: number;
  createdAt: string;
}

export default function TrainerPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trainer/programs")
      .then((r) => r.json())
      .then(setPrograms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function deleteProgram(id: string) {
    if (!confirm("Delete this program?")) return;
    await fetch(`/api/trainer/programs/${id}`, { method: "DELETE" });
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  async function cloneProgram(id: string) {
    const res = await fetch(`/api/trainer/programs/${id}/clone`, { method: "POST" });
    if (res.ok) {
      const clone = await res.json();
      setPrograms((prev) => [{ ...clone, moduleCount: 0, bookingCount: 0 }, ...prev]);
    }
  }

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    DRAFT: "secondary",
    PUBLISHED: "default",
    ARCHIVED: "outline",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Programs</h1>
          <p className="text-muted-foreground">Manage your training programs</p>
        </div>
        <Link href="/trainer/programs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-4" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No programs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first training program to get started.
            </p>
            <Link href="/trainer/programs/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <Link key={p.id} href={`/trainer/programs/${p.id}`} className="block">
              <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                      <Badge variant={statusColors[p.status]} className="text-[10px]">{p.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {p.category} • {p.durationHours}h • Max {p.maxParticipants} pax • RM {p.pricePerPax}/pax
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{p.moduleCount} modules</span>
                    <span>•</span>
                    <span>{p.bookingCount} bookings</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    <Link href={`/trainer/programs/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" title="Clone" onClick={(e) => { e.stopPropagation(); e.preventDefault(); cloneProgram(p.id); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteProgram(p.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
