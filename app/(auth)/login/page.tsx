"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN": return "/admin";
    case "TRAINER": return "/trainer";
    case "HR": return "/hr";
    default: return "/";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      await refresh();
      const redirect = searchParams.get("redirect");
      router.push(redirect || getDashboardPath(data.user.role));
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Quick login buttons for demo
  async function quickLogin(quickEmail: string) {
    setEmail(quickEmail);
    setPassword("password123");
    // Auto-submit
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: quickEmail, password: "password123" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      await refresh();
      router.push(getDashboardPath(data.user.role));
      router.refresh();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">TrainHub Malaysia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          HR & Training Development Platform
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.my"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex-col gap-4 border-t pt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Demo Accounts
          </p>
          {/* Admin */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground mb-1.5">Admin</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => quickLogin("admin@trainhub.my")}
                className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                Platform Admin
              </button>
            </div>
          </div>
          {/* Trainers */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground mb-1.5">Trainers</p>
            <div className="flex flex-wrap gap-1.5">
              {[{ email: "aisha@trainhub.my", label: "Aisha" }, { email: "jason@trainhub.my", label: "Jason" }, { email: "sarah@trainhub.my", label: "Sarah" }].map(t => (
                <button key={t.email} onClick={() => quickLogin(t.email)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* HR */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground mb-1.5">HR Departments</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { email: "hr@petronas.my", label: "Petronas" },
                { email: "hr@maybank.my", label: "Maybank" },
                { email: "hr@topglove.my", label: "Top Glove" },
                { email: "hr@airasia.my", label: "AirAsia" },
                { email: "hr@tm.my", label: "TM" },
                { email: "hr@sdarby.my", label: "Sime Darby" },
              ].map(h => (
                <button key={h.email} onClick={() => quickLogin(h.email)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                  {h.label}
                </button>
              ))}
            </div>
          </div>
          {/* Participants */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground mb-1.5">Participants</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => quickLogin("participant@demo.com")}
                className="rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                Demo Participant
              </button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
