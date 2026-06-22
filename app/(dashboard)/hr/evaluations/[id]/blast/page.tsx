"use client";

import { useState, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, Users } from "lucide-react";

export default function EvaluationBlast({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleBlast() {
    setSending(true);
    const res = await fetch(`/api/hr/evaluations/${id}/blast`, { method: "POST" });
    if (res.ok) setSent(true);
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Send Evaluation</h1>
      {sent ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
            <h3 className="text-lg font-semibold">Evaluation Sent!</h3>
            <p className="text-sm text-muted-foreground mt-1">All participants have been notified.</p>
            <Badge variant="default" className="mt-3">Sent via Email</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Blast Evaluation to Participants</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 rounded-lg bg-accent/50 p-4">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email all participants</p>
                <p className="text-xs text-muted-foreground mt-1">This sends the evaluation form to every participant for rating and feedback.</p>
              </div>
            </div>
            <Button onClick={handleBlast} disabled={sending} className="w-full">
              <Send className="mr-2 h-4 w-4" />{sending ? "Sending..." : "Send Evaluation Forms"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
