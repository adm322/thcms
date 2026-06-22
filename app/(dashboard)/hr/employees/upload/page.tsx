"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Check, X, Users } from "lucide-react";

const TEMPLATE_HEADERS = ["Name", "IC Number", "Email", "Department", "Position"];

export default function EmployeeUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Simple CSV/TSV preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = text
        .split("\n")
        .filter(Boolean)
        .map((line) => line.split(/[\t,]/).map((c) => c.trim().replace(/^"|"$/g, "")));
      setPreview(rows.slice(0, 6)); // Preview first 6 rows
    };
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    const text = await file.text();
    const rows = text
      .split("\n")
      .filter(Boolean)
      .slice(1) // Skip header
      .map((line) => line.split(/[\t,]/).map((c) => c.trim().replace(/^"|"$/g, "")));

    const res = await fetch("/api/hr/employees/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employees: rows }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
      router.refresh();
    }
    setUploading(false);
  }

  function downloadTemplate() {
    const csv = TEMPLATE_HEADERS.join(",") + "\n" + "John Doe,900101-14-5001,john@company.my,Engineering,Engineer";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_upload_template.csv";
    a.click();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Bulk Upload Employees</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Download Template</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Download our Excel/CSV template with the correct column format, fill in your employee data, then upload.
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download CSV Template
          </Button>
          <div className="mt-3 flex gap-2">
            {TEMPLATE_HEADERS.map((h) => (
              <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <input type="file" accept=".csv,.tsv,.txt" onChange={handleFile} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">{file ? file.name : "Click to select CSV file"}</p>
              <p className="text-xs text-muted-foreground">.csv, .tsv files supported</p>
            </label>
          </div>

          {preview.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Preview (first {preview.length} rows)</p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {preview[0]?.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-t">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? "Uploading..." : <><Users className="mr-2 h-4 w-4" /> Import Employees</>}
          </Button>

          {result && (
            <div className="flex items-center gap-4 rounded-lg bg-accent/50 p-4">
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" /> {result.imported} imported
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <X className="h-4 w-4" /> {result.errors} errors
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
