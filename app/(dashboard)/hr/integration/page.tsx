"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportButton } from "@/components/ExportButton";
import { Download, Upload, FileSpreadsheet, Database, Link2, ArrowRight, Check } from "lucide-react";

export default function IntegrationGuide() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integration & Data Sync</h1>
        <p className="text-muted-foreground mt-1">Connect TrainHub with your existing HR tools — Excel, Google Sheets, HRIS, or custom systems</p>
      </div>

      {/* Quick Export Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center space-y-2">
            <FileSpreadsheet className="h-6 w-6 mx-auto text-primary" />
            <p className="text-sm font-medium">Employees</p>
            <ExportButton apiUrl="/api/hr/employees" filename="employees.csv" size="sm" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center space-y-2">
            <FileSpreadsheet className="h-6 w-6 mx-auto text-primary" />
            <p className="text-sm font-medium">Leaves</p>
            <ExportButton apiUrl="/api/hr/leaves" filename="leaves.csv" size="sm" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center space-y-2">
            <FileSpreadsheet className="h-6 w-6 mx-auto text-primary" />
            <p className="text-sm font-medium">Attendance</p>
            <ExportButton apiUrl={`/api/hr/attendance?month=${new Date().getMonth()}&year=${new Date().getFullYear()}`} filename="attendance.csv" size="sm" dataKey="summary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center space-y-2">
            <FileSpreadsheet className="h-6 w-6 mx-auto text-primary" />
            <p className="text-sm font-medium">Claims</p>
            <ExportButton apiUrl="/api/hr/claims" filename="claims.csv" size="sm" />
          </CardContent>
        </Card>
      </div>

      {/* Workflow Guide */}
      <Card>
        <CardHeader><CardTitle>🔄 How HR Teams Typically Work with TrainHub</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <Step title="1. Export from Your Current System" icon={Download}>
            Most HR teams track employees in <strong>Excel</strong>, <strong>Google Sheets</strong>, or an <strong>HRIS</strong> (HR2000, Kakitangan.com, BrioHR, SQL Payroll).
            Export your employee list, leave records, or attendance data as a <Badge variant="outline" className="ml-1 text-xs">.CSV</Badge> file.
          </Step>
          <Step title="2. Import into TrainHub" icon={Upload}>
            Go to <strong>Employees → Bulk Upload</strong> to import employee CSV files. TrainHub maps your columns automatically (Name, Email, Department, Position, IC Number).
            For leave and claims data, use the <strong>Export buttons above</strong> to download the current TrainHub format, paste your data into the template, and contact support for bulk import.
          </Step>
          <Step title="3. Keep Both in Sync" icon={Link2}>
            <strong>Weekly routine:</strong> Export TrainHub data every Friday (one click per module above). Import into your HRIS or payroll software.
            TrainHub stores all history, so you can always export past months for audit or reporting.
          </Step>
          <Step title="4. Automate (Advanced)" icon={Database}>
            TrainHub exposes a <strong>REST API</strong> at <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/api/hr/*</code>.
            Use tools like <strong>Zapier</strong>, <strong>Make (Integromat)</strong>, or a custom script to:
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>Auto-sync employee changes from your HRIS to TrainHub</li>
              <li>Push new leave requests from TrainHub to your payroll system</li>
              <li>Export attendance monthly and feed into SQL Payroll / Million Payroll</li>
            </ul>
          </Step>
        </CardContent>
      </Card>

      {/* Common HR Software */}
      <Card>
        <CardHeader><CardTitle>🖥️ Malaysian HR Software Compatibility</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <SoftwareRow name="Microsoft Excel / Google Sheets" format="CSV" note="Export any table above as CSV, open in Excel" />
            <SoftwareRow name="SQL Payroll / Million Payroll" format="CSV" note="Export attendance summary, map to payroll import" />
            <SoftwareRow name="HR2000 / EmplX" format="CSV" note="Match employee ID columns for sync" />
            <SoftwareRow name="Kakitangan.com / BrioHR" format="API" note="Use REST API for real-time sync" />
            <SoftwareRow name="AutoCount Payroll" format="CSV" note="Monthly attendance export → payroll processing" />
            <SoftwareRow name="Custom / In-house System" format="API" note="Full REST API at /api/hr/* endpoints" />
          </div>
        </CardContent>
      </Card>

      {/* API Quick Reference */}
      <Card>
        <CardHeader><CardTitle>📡 API Quick Reference</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              ["GET /api/hr/employees", "List all employees (paginated)"],
              ["POST /api/hr/employees/upload", "CSV bulk upload employees"],
              ["GET /api/hr/leaves", "List leave requests"],
              ["PATCH /api/hr/leaves/:id", "Approve/reject leave"],
              ["GET /api/hr/attendance", "Monthly attendance report"],
              ["GET /api/hr/claims", "List expense claims"],
              ["GET /api/hr/bookings", "List training bookings"],
              ["GET /api/hr/stats", "Dashboard statistics"],
            ].map(([endpoint, desc]) => (
              <div key={endpoint} className="flex items-start gap-3 py-2 border-b last:border-0">
                <Badge variant="secondary" className="text-[10px] font-mono flex-shrink-0">{endpoint.split(" ")[0]}</Badge>
                <code className="text-xs flex-shrink-0 w-64">{endpoint.split(" ").slice(1).join(" ")}</code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ title, children, icon: Icon }: { title: string; children: React.ReactNode; icon: any }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="font-semibold text-sm">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{children}</p>
      </div>
    </div>
  );
}

function SoftwareRow({ name, format, note }: { name: string; format: string; note: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Database className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px]">{format}</Badge>
          <span className="text-xs text-muted-foreground">{note}</span>
        </div>
      </div>
    </div>
  );
}
