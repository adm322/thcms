"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  apiUrl: string;
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
  dataKey?: string;  // e.g., "summary" for attendance API
}

export function ExportButton({ apiUrl, filename, label = "Export CSV", variant = "outline", size = "sm", dataKey }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const url = apiUrl.includes("?") ? `${apiUrl}&limit=10000` : `${apiUrl}?limit=10000`;
      const res = await fetch(url);
      const json = await res.json();
      const rows = dataKey ? (json[dataKey] || []) : (json.data || json);

      if (!rows || !rows.length) {
        alert("No data to export.");
        setExporting(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(","),
        ...rows.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return /[",\n]/.test(str) ? `"${str}"` : str;
          }).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url2;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url2);
    } catch (e) {
      console.error("Export failed:", e);
    }
    setExporting(false);
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {label}
    </Button>
  );
}
