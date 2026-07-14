import { Badge } from "./badge";

/**
 * ponytail: StatusBadge — maps status strings to semantic badge variants.
 *
 *   success: COMPLETED, APPROVED, PAID, ACTIVE, AVAILABLE, FINALISED,
 *            RESOLVED, SUBMITTED, PRESENT, PUBLISHED
 *   info:    CONFIRMED, MATCHED, SCHEDULED, REVIEWING, OPEN, IN_PROGRESS, SENT
 *   warning: PENDING, LATE, URGENT
 *   danger:  REJECTED, ABSENT, OVERDUE, CANCELLED, CRITICAL
 *   neutral: DRAFT, ARCHIVED, CLOSED, UNAVAILABLE, INACTIVE, TERMINATED,
 *            RESIGNED, ON_LEAVE, HALF_DAY, PUBLIC_HOLIDAY
 *
 * Falls back to the raw string if unknown (still renders via default variant).
 */
const STATUS_VARIANT: Record<string, "status-success" | "status-info" | "status-warning" | "status-danger" | "status-neutral"> = {
  // success — terminal good states
  COMPLETED: "status-success",
  APPROVED: "status-success",
  PAID: "status-success",
  ACTIVE: "status-success",
  AVAILABLE: "status-success",
  FINALISED: "status-success",
  RESOLVED: "status-success",
  SUBMITTED: "status-success",
  PRESENT: "status-success",
  PUBLISHED: "status-success",

  // info — in-progress or scheduled
  CONFIRMED: "status-info",
  MATCHED: "status-info",
  SCHEDULED: "status-info",
  REVIEWING: "status-info",
  OPEN: "status-info",
  IN_PROGRESS: "status-info",
  SENT: "status-info",

  // warning — needs attention but not failed
  PENDING: "status-warning",
  LATE: "status-warning",
  URGENT: "status-warning",
  SOON: "status-warning",

  // danger — failed or critical
  REJECTED: "status-danger",
  ABSENT: "status-danger",
  OVERDUE: "status-danger",
  CANCELLED: "status-danger",
  CRITICAL: "status-danger",

  // neutral — inactive or system states
  DRAFT: "status-neutral",
  ARCHIVED: "status-neutral",
  CLOSED: "status-neutral",
  UNAVAILABLE: "status-neutral",
  INACTIVE: "status-neutral",
  TERMINATED: "status-neutral",
  RESIGNED: "status-neutral",
  ON_LEAVE: "status-neutral",
  HALF_DAY: "status-neutral",
  PUBLIC_HOLIDAY: "status-neutral",
};

export function StatusBadge({
  status,
  className = "",
  size = "default",
}: {
  status: string;
  className?: string;
  size?: "default" | "sm";
}) {
  const variant = STATUS_VARIANT[status] ?? "default";
  const display = status.replace(/_/g, " ");
  return (
    <Badge variant={variant} className={`${size === "sm" ? "text-[10px] h-5" : "text-xs"} ${className}`.trim()}>
      {display}
    </Badge>
  );
}
