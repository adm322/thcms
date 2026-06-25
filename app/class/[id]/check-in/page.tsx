"use client";

import { useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, UserCheck } from "lucide-react";

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = use(params);
  
  const [email, setEmail] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already_checked_in">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/attendance/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, icNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setStatus("already_checked_in");
          setMessage(data.message || "You are already checked in.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
        return;
      }

      setStatus("success");
      setMessage(data.message || "Check-in successful!");
      
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Class Check-In</CardTitle>
          <CardDescription>
            Enter your details to verify your registration and mark your attendance.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="text-center py-6 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-700 mb-2">Checked In!</h3>
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "already_checked_in" && (
            <div className="text-center py-6 animate-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-blue-700 mb-2">Already Checked In</h3>
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {(status === "idle" || status === "loading" || status === "error") && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {status === "error" && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-start gap-2 border border-red-100">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{message}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Email</label>
                <Input
                  type="email"
                  placeholder="e.g. ali@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === "loading"}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">IC Number</label>
                <Input
                  type="text"
                  placeholder="e.g. 900101-14-5555"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  required
                  disabled={status === "loading"}
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">Used to securely verify your identity.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Check In"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t pt-4 text-xs text-muted-foreground">
          Powered by TrainHub Secure Attendance
        </CardFooter>
      </Card>
    </div>
  );
}
