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
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground leading-snug">{item.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requested by <span className="font-medium text-foreground">{item.trainerName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Program: {item.programTitle}
                </p>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border w-full sm:w-auto flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground font-mono">RM {item.amount.toLocaleString()}</span>
                  <Badge variant={item.status === "PENDING" ? "secondary" : item.status === "APPROVED" ? "default" : "destructive"} className="text-[10px] font-mono tracking-wider uppercase py-0.5 px-2 rounded-full">
                    {item.status}
                  </Badge>
                </div>
                
                {item.status === "PENDING" && (
                  <div className="flex items-center gap-1">
                    <Button size="sm" className="h-8 text-xs px-3" variant="outline" onClick={() => updateStatus(item.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button size="sm" className="h-8 text-xs px-3" variant="destructive" onClick={() => updateStatus(item.id, "REJECTED")}>
                      Reject
                    </Button>
                  </div>
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
