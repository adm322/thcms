"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export function SignOutCard() {
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
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="w-full bg-card border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-2xl p-3.5 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span className="text-sm font-semibold">Sign out</span>
    </button>
  );
}
