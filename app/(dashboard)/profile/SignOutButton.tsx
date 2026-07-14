"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={signOut}
      disabled={busy}
      className="flex-shrink-0"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      <span className="hidden sm:inline ml-1.5">Sign out</span>
    </Button>
  );
}
