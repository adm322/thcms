export interface CalendarEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
  companyName: string;
  trainerName: string;
  trainerId?: string;
  locationType: string;
  durationHours?: number;
  trainerEmail?: string;
  companyAddress?: string | null;
  companyState?: string | null;
  depositPaid?: number;
  depositStatus?: string;
  participantCount?: number;
  totalFee?: number;
}

export const CATEGORY_DOT: Record<string, string> = {
  Leadership: "#3b82f6",
  Technical: "#10b981",
  "Soft Skills": "#8b5cf6",
  Compliance: "#f59e0b",
  "Team Building": "#f43f5e",
  "HR Operations": "#06b6d4",
};

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type ViewMode = "month" | "quarter" | "year";
