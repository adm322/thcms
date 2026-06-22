"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  User,
  Building2,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Mail,
  GraduationCap,
} from "lucide-react";
import { useState, useEffect } from "react";

interface EventDetail {
  id: string;
  title: string;
  category: string;
  locationType: string;
  durationHours?: number;
  trainerName: string;
  trainerId?: string;
  trainerEmail?: string;
  companyName: string;
  companyAddress?: string | null;
  companyState?: string | null;
  date: string;
  status: string;
  totalFee?: number;
  depositPaid?: number;
  depositStatus?: string;
  participantCount?: number;
}

interface EventDetailDialogProps {
  event: EventDetail | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function EventDetailDialog({ event, open, onClose, onStatusChange }: EventDetailDialogProps) {
  const [updating, setUpdating] = useState(false);

  if (!event) return null;

  const dateObj = new Date(event.date);
  const isPast = dateObj < new Date();

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/bookings/${event!.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange?.(event!.id, newStatus);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{event.category}</Badge>
            <Badge
              variant={
                event.status === "CONFIRMED"
                  ? "default"
                  : event.status === "PENDING"
                  ? "secondary"
                  : "outline"
              }
            >
              {event.status}
            </Badge>
          </div>
          <DialogTitle className="text-lg">{event.title}</DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {dateObj.toLocaleDateString("en-MY", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Trainer</p>
            <p className="font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {event.trainerName}
              {event.trainerId && (
                <TrainerAvailabilityBadge trainerId={event.trainerId} date={event.date} />
              )}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {event.trainerEmail ?? "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Client Company</p>
            <p className="font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {event.companyName}
            </p>
            {event.companyState && (
              <p className="text-xs text-muted-foreground">{event.companyState}</p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {event.durationHours} hours
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="font-medium flex items-center gap-1.5 capitalize">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {event.locationType}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Participants</p>
            <p className="font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              {event.participantCount ?? "?"} pax
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Fee</p>
            <p className="font-medium flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              RM {(event.totalFee ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Venue for onsite */}
        {event.locationType === "onsite" && event.companyAddress && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1">Venue Address</p>
            <p className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
              {event.companyAddress}
              {event.companyState ? `, ${event.companyState}` : ""}
            </p>
          </div>
        )}

        <Separator />

        <DialogFooter className="flex gap-2 sm:gap-2">
          {event.status === "PENDING" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={updating}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange("CONFIRMED")}
                disabled={updating}
              >
                Approve Training
              </Button>
            </>
          )}
          {event.status === "CONFIRMED" && !isPast && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={updating}
              >
                Mark as Completed
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrainerAvailabilityBadge({ trainerId, date }: { trainerId: string; date: string }) {
  const [status, setStatus] = useState<"available" | "booked" | "unavailable" | null>(null);

  useEffect(() => {
    const d = new Date(date);
    fetch(`/api/admin/trainers/availability?trainerId=${trainerId}&month=${d.getMonth()}&year=${d.getFullYear()}`)
      .then((r) => r.json())
      .then((data) => {
        const day = (data.days || []).find((d: any) => d.date === date.slice(0, 10));
        if (day) setStatus(day.status);
      })
      .catch(() => {});
  }, [trainerId, date]);

  if (!status) return null;

  if (status === "booked") {
    return <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 bg-blue-100 text-blue-700">Booked</Badge>;
  }
  if (status === "unavailable") {
    return <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 bg-red-100 text-red-700">Unavailable</Badge>;
  }
  return <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 bg-emerald-100 text-emerald-700">Available</Badge>;
}
