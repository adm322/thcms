"use client";

import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  Clock,
  MapPin,
  Users,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface UpcomingTraining {
  id: string;
  title: string;
  category: string;
  locationType: string;
  durationHours?: number;
  trainerName: string;
  trainerEmail?: string;
  companyName: string;
  companyAddress?: string | null;
  companyState?: string | null;
  date: string;
  status: string;
  totalFee?: number;
  participantCount?: number;
}

interface UpcomingTrainingListProps {
  trainings: UpcomingTraining[];
  onSelect?: (t: UpcomingTraining) => void;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  CONFIRMED: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", label: "Confirmed" },
  PENDING: { icon: AlertCircle, color: "text-amber-600 bg-amber-50", label: "Awaiting Approval" },
  COMPLETED: { icon: CheckCircle2, color: "text-blue-600 bg-blue-50", label: "Completed" },
};

const locationIcons: Record<string, string> = {
  onsite: "On-Site",
  online: "Online",
  hybrid: "Hybrid",
};

export function UpcomingTrainingList({ trainings, onSelect }: UpcomingTrainingListProps) {
  if (trainings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Calendar className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">No upcoming training scheduled</p>
          <p className="text-xs text-muted-foreground mt-1">
            Confirmed bookings will appear here with full details.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {trainings.map((t) => {
        const dateObj = new Date(t.date);
        const isToday = new Date().toDateString() === dateObj.toDateString();
        const config = statusConfig[t.status] || statusConfig.PENDING;

        let borderColor = "border-l-blue-400";
        if (t.status === "CONFIRMED") borderColor = "border-l-emerald-500";
        else if (t.status === "PENDING") borderColor = "border-l-amber-400";

        return (
          <Card
            key={t.id}
            className={cn(
              "hover:shadow-sm transition-all cursor-pointer border-l-4",
              borderColor,
              isToday && "ring-2 ring-primary/20"
            )}
            onClick={() => onSelect?.(t)}
          >
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-4">
                {/* Date badge */}
                <div
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-[56px] text-center",
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <span className="text-[10px] uppercase font-medium leading-tight">
                    {dateObj.toLocaleDateString("en-MY", { month: "short" })}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {dateObj.getDate()}
                  </span>
                  <span className="text-[10px] leading-tight">
                    {dateObj.toLocaleDateString("en-MY", { weekday: "short" })}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm truncate">{t.title}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      className={cn("text-[10px] flex-shrink-0", config.color)}
                      variant="secondary"
                    >
                      <config.icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 truncate" title={t.trainerName}>
                      <User className="h-3 w-3 flex-shrink-0" />
                      {t.trainerName}
                    </span>
                    <span className="flex items-center gap-1.5 truncate" title={t.companyName}>
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      {t.companyName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      {t.durationHours}h
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="capitalize">
                        {locationIcons[t.locationType] || t.locationType}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      {t.participantCount ?? "?"} pax
                    </span>
                    {t.companyState && (
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0 opacity-0" />
                        {t.companyState}
                      </span>
                    )}
                  </div>

                  {t.locationType === "onsite" && t.companyAddress && (
                    <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1">
                      <span>Venue:</span> {t.companyAddress}
                    </p>
                  )}
                </div>

                {/* Fee */}
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold">RM {(t.totalFee ?? 0).toLocaleString()}</p>
                  {t.status === "PENDING" && (
                    <p className="text-[10px] text-amber-600">Needs approval</p>
                  )}
                  {isToday && (
                    <Badge variant="default" className="mt-1 text-[10px]">Today</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
