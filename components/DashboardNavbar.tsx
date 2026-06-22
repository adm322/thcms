"use client";

import { useAuth } from "./AuthProvider";
import { Button } from "./ui/button";
import { NotificationBell } from "./NotificationBell";
import { LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";

interface DashboardNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function DashboardNavbar({ sidebarOpen, onToggleSidebar }: DashboardNavbarProps) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <header className="flex h-16 flex-shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent flex-shrink-0"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <NotificationBell />

      {/* User menu */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
