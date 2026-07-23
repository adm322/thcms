"use client";

/**
 * ExportMenu — Dropdown for exporting slides to PPTX, PDF, or self-contained HTML.
 *
 * Fetches the corresponding export endpoint, converts the response to a Blob,
 * and triggers a browser download. Loading state is shown per-format.
 */

import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileCode2, Loader2, Presentation } from "lucide-react";

type ExportFormat = "pptx" | "pdf" | "html";

interface ExportMenuProps {
  programId: string;
  /** Disable the menu (e.g., when no slides exist yet) */
  disabled?: boolean;
  /** Optional className for the trigger button */
  className?: string;
}

export function ExportMenu({ programId, disabled, className }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function handleExport(format: ExportFormat) {
    setError(null);
    setLoadingFormat(format);
    setOpen(false);
    try {
      const res = await fetch(
        `/api/trainer/programs/${programId}/studio/export/${format}`,
        { method: "GET" }
      );
      if (!res.ok) {
        let msg = "Failed to generate export";
        try {
          const data = await res.json();
          msg = data.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      // Try to derive filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : `slides.${format}`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Free the URL after a short delay so the download can finish
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      // Auto-dismiss after 5s
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled || loadingFormat !== null}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
          disabled
            ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        } ${className ?? ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {loadingFormat ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {loadingFormat
          ? `Generating ${loadingFormat.toUpperCase()}…`
          : "Export"}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-48 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden"
        >
          <button
            type="button"
            onClick={() => handleExport("pptx")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            role="menuitem"
          >
            <Presentation className="h-4 w-4 text-orange-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                PowerPoint (.pptx)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Editable in PowerPoint
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-t border-slate-100 dark:border-slate-800"
            role="menuitem"
          >
            <FileText className="h-4 w-4 text-red-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                PDF (.pdf)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                For printing or sharing
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleExport("html")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-t border-slate-100 dark:border-slate-800"
            role="menuitem"
          >
            <FileCode2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                HTML (.html)
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Self-contained, viewable offline
              </p>
            </div>
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="absolute right-0 z-20 mt-2 max-w-xs rounded-md border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 shadow-md"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
