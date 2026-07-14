"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Users, Download } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["M","T","W","T","F","S","S"];

interface AttSummary { employeeId: string; name: string; dept: string; present: number; late: number; absent: number; }

export default function HRAttendance() {
  const [summary, setSummary] = useState<AttSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hr/attendance?month=${month}&year=${year}`)
      .then(r => r.json()).then(d => setSummary(d.summary || [])).catch(console.error).finally(() => setLoading(false));
  }, [month, year]);

  function prev() { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }

  const totalDays = new Date(year, month + 1, 0).getDate();
  const workDays = Math.floor(totalDays * 5 / 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold tracking-tight">Attendance</h1><p className="text-muted-foreground">{MONTHS[month]} {year} — {workDays} working days</p></div>
        <div className="flex items-center gap-2">
          <ExportButton apiUrl={`/api/hr/attendance?month=${month}&year=${year}`} filename={`attendance-${year}-${String(month+1).padStart(2,'0')}.csv`} label="Export" dataKey="summary" />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="w-36 text-center text-sm font-semibold">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      ) : summary.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16"><Users className="mb-4 h-12 w-12 text-muted-foreground/40" /><h3 className="text-lg font-semibold">No attendance records</h3><p className="text-sm text-muted-foreground">No records for {MONTHS[month]} {year}</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50"><th className="text-left px-4 py-3 font-medium">Employee</th><th className="text-left px-4 py-3 font-medium">Department</th><th className="text-center px-4 py-3 font-medium">Present</th><th className="text-center px-4 py-3 font-medium">Late</th><th className="text-center px-4 py-3 font-medium">Absent</th><th className="text-center px-4 py-3 font-medium">Rate</th></tr></thead>
              <tbody>
                {summary.map((e) => {
                  const total = e.present + e.late + e.absent;
                  // ponytail: cap rate at 100% (present can exceed workDays when overtime/shift work counted)
                  const rate = total > 0 ? Math.min(100, Math.round((e.present / workDays) * 100)) : 0;
                  return (
                    <tr key={e.employeeId} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{e.name}</td><td className="px-4 py-3 text-muted-foreground">{e.dept}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-medium">{e.present}</td>
                      <td className="px-4 py-3 text-center text-amber-600">{e.late}</td>
                      <td className="px-4 py-3 text-center text-red-600">{e.absent}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={rate >= 90 ? "default" : rate >= 75 ? "secondary" : "destructive"}>{rate}%</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
