"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Star, ChevronLeft, ChevronRight, MapPin, Clock, GraduationCap } from "lucide-react";

interface FeaturedProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  pricePerPax: number;
  locationType: string;
  trainerName: string;
  trainerRating: number;
  trainerPrograms: number;
  bookingCount: number;
}

export function FeaturedBanner({ programs }: { programs: FeaturedProgram[] }) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % programs.length);
  }, [current, programs.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + programs.length) % programs.length);
  }, [current, programs.length, goTo]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (programs.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, programs.length]);

  if (programs.length === 0) return null;

  const p = programs[current];

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-300 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row min-h-72">
          {/* Left: Program Info */}
          <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 font-semibold">
                ⭐ Featured Program
              </Badge>
              <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
            </div>
            <Link href={`/hr/marketplace/${p.id}`}>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight hover:text-primary transition-colors">
                {p.title}
              </h2>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 max-w-xl">
              {p.description}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{p.trainerRating.toFixed(1)}</span>
                </div>
                {p.trainerName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {p.durationHours}h
              </span>
              <span className="flex items-center gap-1 capitalize">
                <MapPin className="h-3.5 w-3.5" /> {p.locationType}
              </span>
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> {p.trainerPrograms} programs
              </span>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Link href={`/hr/marketplace/${p.id}`}>
                <Button size="lg">
                  Book Now — RM {p.pricePerPax}<span className="text-xs font-normal ml-1 opacity-70">/pax</span>
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">{p.bookingCount} bookings so far</span>
            </div>
          </div>

          {/* Right: Large decorative element */}
          <div className="hidden lg:flex w-72 flex-shrink-0 items-center justify-center p-8">
            <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center">
              <GraduationCap className="h-20 w-20 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Navigation arrows (multiple programs only) */}
        {programs.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-colors z-20"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 backdrop-blur shadow flex items-center justify-center hover:bg-white transition-colors z-20"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dot navigation */}
      {programs.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {programs.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-amber-500"
                  : "w-2 h-2 bg-amber-300 hover:bg-amber-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      {programs.length > 1 && (
        <div className="absolute top-4 right-4 text-xs font-medium text-muted-foreground bg-white/70 backdrop-blur rounded-full px-3 py-1 z-20">
          {current + 1} / {programs.length}
        </div>
      )}
    </div>
  );
}
