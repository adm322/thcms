"use client";

import { useState, useEffect } from "react";
import { ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";

export function CodeConductSidebar() {
  const [doc, setDoc] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/trainer/code-of-conduct").then(r => r.json()).then(setDoc).catch(console.error);
  }, []);

  if (!doc) return null;

  return (
    <div className="border-t px-5 py-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 space-y-1.5 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex-1">Code of Conduct</p>
          <Badge variant="outline" className="text-[8px] h-4 px-1.5 flex-shrink-0">{doc.status}</Badge>
          {expanded
            ? <ChevronUp className="h-3 w-3 text-amber-500 flex-shrink-0" />
            : <ChevronDown className="h-3 w-3 text-amber-500 flex-shrink-0" />
          }
        </div>
        <p className="text-[10px] text-amber-700 dark:text-amber-400 line-clamp-2">{doc.title} — v{doc.version}</p>
        <p className="text-[9px] text-muted-foreground">Updated {new Date(doc.updatedAt).toLocaleDateString("en-MY")}</p>
      </button>

      {expanded && (
        <div className="mt-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-800/50 p-3 max-h-60 overflow-y-auto">
          <pre className="text-[10px] text-amber-800 dark:text-amber-300 whitespace-pre-wrap font-sans leading-relaxed">
            {doc.content}
          </pre>
        </div>
      )}
    </div>
  );
}
