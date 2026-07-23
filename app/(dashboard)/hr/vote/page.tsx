"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, TrendingUp, Trophy, Users } from "lucide-react";

interface ProgramVote {
  id: string;
  title: string;
  category: string;
  trainerName: string;
  voteCount: number;
  employeeVotesCount: number;
  voted: boolean;
}

export default function VotePage() {
  const [programs, setPrograms] = useState<ProgramVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"hr" | "employee">("employee");

  useEffect(() => {
    fetch("/api/hr/vote").then((r) => r.json()).then(setPrograms).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function toggleVote(programId: string) {
    const res = await fetch("/api/hr/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programId }),
    });
    if (res.ok) {
      const { voted } = await res.json();
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === programId ? { ...p, voted, voteCount: p.voteCount + (voted ? 1 : -1) } : p
        )
      );
    }
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  // Sort by selected criteria
  const sorted = [...programs].sort((a, b) => {
    if (sortBy === "employee") {
      return b.employeeVotesCount - a.employeeVotesCount || b.voteCount - a.voteCount;
    }
    return b.voteCount - a.voteCount || b.employeeVotesCount - a.employeeVotesCount;
  });
  const top3 = sorted.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vote & Request Programs</h1>
        <p className="text-muted-foreground">
          Upvote programs your employees need. Top-voted programs get priority approval from admin.
        </p>
      </div>

      {/* Top 3 Leaderboard */}
      {top3.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((p, i) => (
            <Card key={p.id} className={i === 0 ? "ring-2 ring-amber-400" : ""}>
              <CardContent className="pt-6 text-center space-y-2">
                <div className="flex justify-center">
                  {i === 0 ? <Trophy className="h-8 w-8 text-amber-400" />
                    : i === 1 ? <Trophy className="h-8 w-8 text-slate-400" />
                    : <Trophy className="h-8 w-8 text-amber-700" />}
                </div>
                <p className="font-semibold text-sm line-clamp-2">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.trainerName} • {p.category}</p>
                <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-1">
                  <div className="flex items-center gap-1 text-muted-foreground" title="HR votes">
                    <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                    <span>{p.voteCount} HR</span>
                  </div>
                  {p.employeeVotesCount > 0 && (
                    <div className="flex items-center gap-1 text-indigo-600 font-medium" title="Employee requests">
                      <Users className="h-3.5 w-3.5" />
                      <span>{p.employeeVotesCount} employee{p.employeeVotesCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* All programs to vote on */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">All Programs — Cast Your Vote</CardTitle>
          <div className="flex items-center gap-1.5 border rounded-lg p-0.5 bg-muted/40">
            <button
              onClick={() => setSortBy("employee")}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                sortBy === "employee"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Employee Requests
            </button>
            <button
              onClick={() => setSortBy("hr")}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors ${
                sortBy === "hr"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              HR Votes
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No programs available to vote on.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      {p.employeeVotesCount > 0 && (
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-medium text-[10px] rounded-full flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {p.employeeVotesCount} employee request{p.employeeVotesCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.trainerName} • {p.category}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5" /> {p.voteCount}
                    </span>
                    <Button
                      size="sm"
                      variant={p.voted ? "default" : "outline"}
                      onClick={() => toggleVote(p.id)}
                      className="min-w-20"
                    >
                      {p.voted ? "Voted ✓" : "Vote"}
                    </Button>
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
