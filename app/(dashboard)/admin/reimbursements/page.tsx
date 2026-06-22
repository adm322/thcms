"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminReimbursements() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/reimbursements").then((r) => r.json()).then(setItems).catch(console.error);
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/reimbursements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Reimbursement Requests</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">
                  {item.trainerName} • RM {item.amount.toLocaleString()} • {item.programTitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.status === "PENDING" ? "secondary" : item.status === "APPROVED" ? "default" : "destructive"}>
                  {item.status}
                </Badge>
                {item.status === "PENDING" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, "REJECTED")}>
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">No reimbursement requests.</p>
        )}
      </div>
    </div>
  );
}
