"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/Toast";
import { ThumbsUp, Search, Sparkles, Users, Award, BookOpen } from "lucide-react";

interface Program {
  id: string;
  title: string;
  category: string;
  trainerName: string;
  description: string;
  voteCount: number;
  voted: boolean;
}

export default function ParticipantVoting() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch("/api/participant/vote");
      if (res.ok) {
        const data = await res.json();
        setPrograms(data);
      } else {
        toast("Failed to load training programs", "error");
      }
    } catch {
      toast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  async function handleVote(programId: string) {
    try {
      const res = await fetch("/api/participant/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      if (res.ok) {
        const { voted } = await res.json();
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === programId
              ? { ...p, voted, voteCount: p.voteCount + (voted ? 1 : -1) }
              : p
          )
        );
        toast(
          voted ? "Interest registered! HR will see your recommendation." : "Interest removed.",
          "success"
        );
      } else {
        toast("Failed to process request", "error");
      }
    } catch {
      toast("Network error. Please try again.", "error");
    }
  }

  // Get unique categories for filtering
  const categories = ["All", ...Array.from(new Set(programs.map((p) => p.category)))];

  // Filter programs based on search and category
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-full max-w-sm rounded bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-48 border border-border animate-pulse">
              <CardContent className="h-full bg-muted/40" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Suggest Future Training
          </h2>
          <p className="text-xs text-muted-foreground">
            Upvote programs you want to attend. Your HR department will see these interests and can schedule them.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs or trainers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-colors ${
              selectedCategory === cat
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Program Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-border border-dashed rounded-lg bg-muted/20">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="text-sm font-semibold text-foreground">No matching programs found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Try adjusting your search terms or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((p) => (
            <Card
              key={p.id}
              className={`group border rounded-lg shadow-2xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                p.voted ? "border-indigo-200 bg-indigo-50/5" : "border-border bg-card"
              }`}
            >
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase font-mono py-0.5 tracking-wider bg-muted/30 rounded-full"
                    >
                      {p.category}
                    </Badge>

                    {/* Colleague count badge */}
                    {p.voteCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5 font-medium">
                        <Users className="h-3 w-3" />
                        {p.voteCount} request{p.voteCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm leading-snug text-foreground block group-hover:text-indigo-600 transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs text-muted-foreground font-normal line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border flex items-center gap-1.5 text-muted-foreground text-xs font-normal">
                  <Award className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span>Trainer: <strong className="text-foreground">{p.trainerName}</strong></span>
                </div>
              </div>

              {/* Vote toggle footer */}
              <div className="p-3 bg-muted/10 border-t border-border flex items-center justify-end">
                <Button
                  size="sm"
                  variant={p.voted ? "default" : "outline"}
                  onClick={() => handleVote(p.id)}
                  className={`h-8 font-medium rounded-md px-4 text-xs transition-all ${
                    p.voted ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                  }`}
                >
                  <ThumbsUp className={`h-3.5 w-3.5 mr-1.5 ${p.voted ? "fill-white" : ""}`} />
                  {p.voted ? "Suggested" : "Suggest Course"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
