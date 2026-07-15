"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Clock, Users, Star, GraduationCap } from "lucide-react";

const CATEGORIES = ["All", "Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations"];
const LOCATIONS = ["all", "onsite", "online", "hybrid"];

const categoryGradients: Record<string, string> = {
  Leadership: "from-indigo-500 to-blue-600",
  Technical: "from-emerald-500 to-teal-600",
  "Soft Skills": "from-violet-500 to-purple-600",
  Compliance: "from-amber-500 to-orange-600",
  "Team Building": "from-rose-500 to-pink-600",
  "HR Operations": "from-cyan-500 to-sky-600",
};
const categoryIcons: Record<string, string> = {
  Leadership: "👔", Technical: "💻", "Soft Skills": "🗣️", Compliance: "⚖️", "Team Building": "🤝", "HR Operations": "📊",
};

interface Program {
  id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  maxParticipants: number;
  pricePerPax: number;
  locationType: string;
  trainerName: string;
  trainerRating: number;
  trainerPrograms?: number;
  moduleCount: number;
  thumbnailUrl?: string;
  accreditations?: string[];
}

export default function HRMarketplace() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (location !== "all") params.set("location", location);
    if (search) params.set("search", search);

    fetch(`/api/hr/programs?${params.toString()}`)
      .then((r) => r.json())
      .then(setPrograms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, location, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Program Marketplace</h1>
        <p className="text-muted-foreground">Browse and book training programs for your team</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat ? "bg-primary text-primary-foreground" : "bg-accent hover:bg-accent/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocation(loc)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              location === loc ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
            }`}
          >
            {loc === "all" ? "All Locations" : loc.charAt(0).toUpperCase() + loc.slice(1)}
          </button>
        ))}
      </div>

      {/* Program Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-14 rounded-full" /></div>
                <Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-16" /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="py-20 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No programs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => {
            const gradient = categoryGradients[p.category] || "from-gray-500 to-gray-600";
            const icon = categoryIcons[p.category] || "📚";
            return (
              <Link key={p.id} href={`/hr/marketplace/${p.id}`} className="group block">
                <Card className="h-full overflow-hidden border hover:border-primary/40 hover:shadow-lg transition-all duration-200">
                  <div className="relative h-44 overflow-hidden bg-muted">
                    {/* Gradient fallback always visible behind image */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <span className="text-5xl opacity-30">{icon}</span>
                    </div>
                    {/* Image overlay — hides gradient when loaded */}
                    {p.thumbnailUrl && (
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={i === 0 ? true : undefined}
                        onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                      />
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className="bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm">{p.category}</Badge>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm capitalize"><MapPin className="mr-1 h-2.5 w-2.5" />{p.locationType}</Badge>
                    </div>
                    <div className="absolute bottom-3 right-3 z-10">
                      <Badge className="bg-white/90 text-primary border-0 text-sm font-bold shadow-sm">RM {p.pricePerPax}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.durationHours}h</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />Max {p.maxParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{p.trainerName.charAt(0)}</div>
                        <div className="text-xs"><p className="font-medium leading-tight">{p.trainerName}</p>
                          <div className="flex items-center gap-0.5 text-muted-foreground"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /><span>{p.trainerRating.toFixed(1)}</span></div>
                          {p.accreditations && p.accreditations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.accreditations.slice(0, 2).map((acc) => (
                                <span key={acc} className="text-[8px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                                  {acc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">View details →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
