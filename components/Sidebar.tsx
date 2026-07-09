"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { CodeConductSidebar } from "./CodeConductSidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, GraduationCap, BookOpen, Users, ClipboardList, FileText,
  DollarSign, Star, Calendar, Compass, MapPin, ThumbsUp, MessageSquare,
  TrendingUp, Sparkles, MessageCircle, Clock, FileSpreadsheet, Calculator,
  BookMarked, HelpCircle, ScrollText, Bell, CalendarCheck, User,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Operations", items: [
    { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
    { href: "/admin/invoices", label: "Invoices", icon: DollarSign },
    { href: "/admin/code-of-conduct", label: "Code of Conduct", icon: ScrollText },
    { href: "/admin/support", label: "Support Tickets", icon: MessageSquare },
  ]},
  { label: "Training", items: [
    { href: "/admin/programs", label: "Programs", icon: BookMarked },
    { href: "/admin/trainers", label: "Trainers", icon: Users },
    { href: "/admin/training-plans", label: "Training Plans", icon: Calendar },
    { href: "/admin/team-building", label: "Team Building", icon: MapPin },
  ]},
  { label: "Analytics", items: [
    { href: "/admin/sales", label: "Sales Panel", icon: TrendingUp },
    { href: "/admin/finance", label: "Finance", icon: DollarSign },
  ]},
  { label: "Communication", items: [
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  ]},
];

const trainerGroups: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trainer/calendar", label: "Calendar", icon: Calendar },
    { href: "/trainer/availability", label: "Availability", icon: CalendarCheck },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Programs", items: [
    { href: "/trainer/programs", label: "My Programs", icon: BookOpen },
    { href: "/trainer/bookings", label: "Bookings", icon: ClipboardList },
    { href: "/trainer/programs/new", label: "Create Program", icon: GraduationCap },
    { href: "/trainer/sop", label: "SOP & Guide", icon: FileText },
  ]},
  { label: "Engagement", items: [
    { href: "/trainer/evaluations", label: "Evaluations", icon: Star },
    { href: "/trainer/quizzes", label: "Quizzes & Polls", icon: HelpCircle },
    { href: "/trainer/messages", label: "Messages", icon: MessageCircle },
    { href: "/trainer/materials", label: "Materials", icon: FileText },
  ]},
  { label: "Finance", items: [
    { href: "/trainer/earnings", label: "Earnings", icon: DollarSign },
  ]},
];

const hrGroups: NavGroup[] = [
  { label: "Overview", items: [
    { href: "/hr", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ]},
  { label: "Training", items: [
    { href: "/hr/marketplace", label: "Browse Programs", icon: Compass },
    { href: "/hr/bookings", label: "My Bookings", icon: ClipboardList },
    { href: "/hr/training-planner", label: "Training Planner", icon: Calendar },
    { href: "/hr/team-building", label: "Team Building", icon: MapPin },
  ]},
  { label: "HR Management", items: [
    { href: "/hr/employees", label: "Employees", icon: Users },
    { href: "/hr/leaves", label: "Leave Management", icon: Calendar },
    { href: "/hr/attendance", label: "Attendance", icon: Clock },
  ]},
  { label: "Tools", items: [
    { href: "/hr/hrdf-calculator", label: "HRDF Calculator", icon: Calculator },
    { href: "/hr/sop", label: "SOP & HRDF Guide", icon: FileText },
    { href: "/hr/integration", label: "Integration", icon: FileSpreadsheet },
    { href: "/hr/training-needs", label: "AI Needs Analyzer", icon: Sparkles },
  ]},
  { label: "Communication", items: [
    { href: "/hr/messages", label: "Messages", icon: MessageCircle },
    { href: "/hr/evaluations", label: "Evaluations", icon: Star },
    { href: "/hr/vote", label: "Vote & Request", icon: ThumbsUp },
    { href: "/hr/support", label: "Support Tickets", icon: MessageSquare },
  ]},
];

const participantGroups: NavGroup[] = [
  { label: "My Hub", items: [
    { href: "/participant", label: "My Classes", icon: BookOpen },
    { href: "/participant/scan", label: "Scan QR", icon: Sparkles },
    { href: "/participant/bookings", label: "My Bookings", icon: ClipboardList },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const groups = user?.role === "ADMIN" ? adminGroups : user?.role === "TRAINER" ? trainerGroups : user?.role === "PARTICIPANT" ? participantGroups : hrGroups;

  return (
    <div className="flex h-full w-full flex-col bg-card border-r">
      <div className="flex h-16 items-center gap-3 px-5 border-b flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary flex-shrink-0">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight truncate">TrainHub</p>
          <p className="text-[10px] text-muted-foreground leading-tight">HR & Training</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-hide">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isExact = pathname === item.href;
                // ponytail: avoid double-highlight on nested routes (e.g. /trainer/programs vs /trainer/programs/new)
                const isActive = isExact || (pathname.startsWith(item.href + "/") && !group.items.some(other => other.href !== item.href && pathname.startsWith(other.href)));
                return (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Code of Conduct — trainer only */}
      {user?.role === "TRAINER" && <CodeConductSidebar />}

      <div className="border-t px-5 py-3 flex-shrink-0">
        <div className="rounded-md bg-accent/50 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">Signed in as</p>
          <p className="text-xs font-medium truncate">
            {user?.role === "ADMIN" ? "Platform Admin" : user?.role === "TRAINER" ? "Training Provider" : user?.role === "PARTICIPANT" ? "Participant" : "HR Department"}
          </p>
        </div>
      </div>
    </div>
  );
}
