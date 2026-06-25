"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, BookOpen, Copy, ChevronRight, Search } from "lucide-react";

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

const STATUSES = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"];

export default function TrainerPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/trainer/programs")
      .then((r) => r.json())
      .then(setPrograms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = programs;
    if (status !== "ALL") list = list.filter(p => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }, [programs, status, search]);

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

  const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
    DRAFT: "secondary", PUBLISHED: "default", ARCHIVED: "outline",
  };

  const counts = {
    total: programs.length,
    draft: programs.filter(p => p.status === "DRAFT").length,
    published: programs.filter(p => p.status === "PUBLISHED").length,
  };

  return (
    <div className="space-y-6 section-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Programs</h1>
          <p className="text-muted-foreground text-sm">
            {counts.total} total · {counts.published} published · {counts.draft} drafts
          </p>
        </div>
        <Link href="/trainer/programs/new">
          <Button><Plus className="mr-2 h-4 w-4" />New Program</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search programs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i}><CardContent className="flex items-center gap-4 py-4">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-14 rounded-full" /></div>
                <Skeleton className="h-3 w-64" /></div>
              <div className="flex items-center gap-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-4" /><Skeleton className="h-3 w-16" /></div>
              <div className="flex items-center gap-1">{[...Array(4)].map((_, j) => (<Skeleton key={j} className="h-8 w-8 rounded" />))}</div>
            </CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">{programs.length === 0 ? "No programs yet" : "No matches"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {programs.length === 0 ? "Create your first training program to get started." : "Try a different filter or search term."}
            </p>
            {programs.length === 0 ? (
              <Link href="/trainer/programs/new" className="mt-4">
                <Button><Plus className="mr-2 h-4 w-4" />Create Program</Button>
              </Link>
            ) : (
              <Button variant="link" className="mt-2" onClick={() => { setStatus("ALL"); setSearch(""); }}>Clear filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <Link key={p.id} href={`/trainer/programs/${p.id}`} className="block stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <Card className="group cursor-pointer border hover:border-primary/40 hover:shadow-sm transition-all">
                <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 px-5">
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <Badge variant={statusVariant[p.status]} className="text-[10px]">{p.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                        {p.category} · {p.durationHours}h · RM {p.pricePerPax}/pax
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {p.category} · {p.durationHours}h · Max {p.maxParticipants} pax · RM {p.pricePerPax}/pax
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{p.moduleCount} modules</span><span>·</span><span>{p.bookingCount} bookings</span>
                    </div>
                  </div>

                  <div className="flex sm:hidden items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2 font-mono">
                    <span>{p.moduleCount} modules</span>
                    <span>{p.bookingCount} bookings</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto" onClick={(e) => e.preventDefault()}>
                    <div className="flex items-center gap-1">
                      <Link href={`/trainer/programs/${p.id}/edit`} onClick={(e) => e.stopPropagation()}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                      </Link>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); e.preventDefault(); cloneProgram(p.id); }}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Clone</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); e.preventDefault(); deleteProgram(p.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
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
