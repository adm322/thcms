"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Clock, Users, Star, GraduationCap, ChevronRight } from "lucide-react";

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

export function MarketplaceClient() {
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
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search programs..."
          className="w-full h-10 rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              category === cat
                ? "text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            style={category === cat ? { backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-deep))" } : undefined}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Location filter */}
      <div className="flex gap-1.5">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocation(loc)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
              location === loc
                ? "border-[var(--brand)] text-[var(--brand)] bg-[var(--brand-soft)]"
                : "hover:bg-muted"
            }`}
          >
            {loc === "all" ? "All Locations" : loc.charAt(0).toUpperCase() + loc.slice(1)}
          </button>
        ))}
      </div>

      {/* Program list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="size-16 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-4 bg-muted rounded-full w-12" />
                    <div className="h-4 bg-muted rounded-full w-14" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <GraduationCap className="mx-auto size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No programs found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => {
            const gradient = categoryGradients[p.category] || "from-gray-500 to-gray-600";
            const icon = categoryIcons[p.category] || "📚";
            return (
              <Link
                key={p.id}
                href={`/m/hr/new-booking?programId=${p.id}`}
                className="block bg-card border border-border rounded-2xl p-3.5 active:scale-[0.99] transition-transform"
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div
                    className={`size-16 rounded-xl shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
                  >
                    <span className="text-2xl opacity-30">{icon}</span>
                    {p.thumbnailUrl && (
                      <Image
                        src={p.thumbnailUrl}
                        alt=""
                        fill
                        sizes="64px"
                        priority={true}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold leading-snug line-clamp-2">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {p.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize flex items-center gap-0.5">
                        <MapPin className="size-2.5" /> {p.locationType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock className="size-3" />{p.durationHours}h</span>
                      <span className="flex items-center gap-0.5"><Users className="size-3" />Max {p.maxParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                          {p.trainerName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-medium">{p.trainerName}</span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Star className="size-2.5 fill-amber-400 text-amber-400" />
                          {p.trainerRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[var(--brand)]">RM {p.pricePerPax}</span>
                    </div>
                    {p.accreditations && p.accreditations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.accreditations.slice(0, 2).map((acc) => (
                          <span key={acc} className="text-[8px] font-medium bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">
                            {acc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
