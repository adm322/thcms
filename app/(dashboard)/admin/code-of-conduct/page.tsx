"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/Toast";
import { ScrollText, Plus, Archive, CheckCircle2, ChevronDown, ChevronUp, Pencil } from "lucide-react";

interface CodeOfConductDoc {
  id: string;
  title: string;
  content: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCodeOfConductPage() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<CodeOfConductDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");

  const fetchDocs = useCallback(async () => {
    const res = await fetch("/api/admin/code-of-conduct");
    const data = await res.json();
    setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function nextVersion() {
    if (docs.length === 0) return "1.0";
    const versions = docs.map(d => parseFloat(d.version)).filter(v => !isNaN(v));
    if (versions.length === 0) return "1.0";
    return (Math.max(...versions) + 0.1).toFixed(1);
  }

  function openCreate() {
    setTitle("");
    setContent("");
    setVersion(nextVersion());
    setEditingId(null);
    setShowCreate(true);
  }

  function openEdit(doc: CodeOfConductDoc) {
    setTitle(doc.title);
    setContent(doc.content);
    setVersion(doc.version);
    setEditingId(doc.id);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      const res = await fetch("/api/admin/code-of-conduct", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, title: title.trim(), content: content.trim() }),
      });
      if (res.ok) {
        toast(`Code of Conduct v${version} updated.`, "success");
        setShowCreate(false);
        fetchDocs();
      }
    } else {
      const res = await fetch("/api/admin/code-of-conduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), status: "ACTIVE" }),
      });
      if (res.ok) {
        toast(`Code of Conduct v${version} published.`, "success");
        setShowCreate(false);
        fetchDocs();
      }
    }
  }

  async function toggleStatus(doc: CodeOfConductDoc) {
    const newStatus = doc.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    const res = await fetch("/api/admin/code-of-conduct", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, status: newStatus }),
    });
    if (res.ok) {
      toast(`v${doc.version} ${newStatus === "ACTIVE" ? "activated" : "archived"}.`, "success");
      fetchDocs();
    }
  }

  const activeDoc = docs.find(d => d.status === "ACTIVE");

  return (
    <div className="space-y-6 max-w-4xl section-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Code of Conduct</h1>
          <p className="text-sm text-muted-foreground">
            Manage versions visible to training providers
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Version
        </Button>
      </div>

      {/* Active indicator */}
      {activeDoc && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Active: v{activeDoc.version} — {activeDoc.title}
              </span>
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700">
                Visible to trainers
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit form */}
      {showCreate && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Version (e.g. 2.1)"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-24 text-sm"
              />
              <Input
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 text-sm"
              />
            </div>
            <Textarea
              placeholder="Code of Conduct content (markdown or plain text)..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              className="text-sm font-mono"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!title.trim() || !content.trim()}>
                {editingId ? "Save Changes" : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version list */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          All Versions
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-16" />
              </Card>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No Code of Conduct versions yet.</p>
              <Button variant="link" size="sm" onClick={openCreate} className="mt-1">
                Create the first version
              </Button>
            </CardContent>
          </Card>
        ) : (
          docs.map((doc, i) => (
            <Card
              key={doc.id}
              className="stagger-item cursor-pointer hover:shadow-sm transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-4 px-4 py-3"
                  onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                >
                  <Badge
                    className={
                      doc.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }
                  >
                    v{doc.version}
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Updated {new Date(doc.updatedAt).toLocaleDateString("en-MY")}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={
                      doc.status === "ACTIVE"
                        ? "border-emerald-200 text-emerald-700 text-[10px]"
                        : "text-[10px]"
                    }
                  >
                    {doc.status}
                  </Badge>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(doc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleStatus(doc)}
                    >
                      {doc.status === "ACTIVE" ? (
                        <Archive className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </Button>
                  </div>

                  <div className="text-muted-foreground">
                    {expandedId === doc.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {expandedId === doc.id && (
                  <div className="px-4 pb-4 pt-0 border-t">
                    <pre className="mt-3 text-sm whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
                      {doc.content}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
