"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import { FileText, File, Film, Image, ExternalLink, Upload, X } from "lucide-react";

interface Material {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  moduleTitle: string;
  programTitle: string;
  programId: string;
  createdAt: string;
}

interface ModuleOption {
  id: string;
  title: string;
  programTitle: string;
}

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText, ppt: File, video: Film, doc: FileText, image: Image,
};

export default function TrainerMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function fetchMaterials() {
    fetch("/api/trainer/materials")
      .then((r) => r.json())
      .then(setMaterials)
      .catch(console.error);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/trainer/materials").then(r => r.json()),
      fetch("/api/trainer/programs").then(r => r.json()),
    ]).then(([mats, progs]) => {
      setMaterials(mats);
      const opts: ModuleOption[] = [];
      (progs || []).forEach((p: any) => {
        (p.modules || []).forEach((m: any) => {
          opts.push({ id: m.id, title: m.title, programTitle: p.title });
        });
      });
      setModules(opts);
      if (opts.length > 0) setSelectedModuleId(opts[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleUpload() {
    if (!selectedFile || !selectedModuleId) {
      toast("Please select a file and a module", "error");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("moduleId", selectedModuleId);
    formData.append("title", uploadTitle || selectedFile.name);

    const res = await fetch("/api/trainer/materials", { method: "POST", body: formData });
    if (res.ok) {
      toast("File uploaded successfully!", "success");
      setShowUpload(false);
      setUploadTitle("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchMaterials();
    } else {
      const err = await res.json();
      toast(err.error || "Upload failed", "error");
    }
    setUploading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Materials Library</h1>
          <p className="text-muted-foreground">All training materials across your programs</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)} variant={showUpload ? "secondary" : "default"}>
          {showUpload ? <X className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
          {showUpload ? "Cancel" : "Upload Material"}
        </Button>
      </div>

      {showUpload && (
        <Card>
          <CardContent className="py-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Module</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {modules.length === 0 && <option value="">No modules available</option>}
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.programTitle} → {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Leave blank to use filename"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">File</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No materials yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload training materials like PDFs, slides, videos, or images.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => {
            const Icon = fileIcons[m.fileType] || File;
            return (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground uppercase">{m.fileType}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Program: {m.programTitle}</p>
                    <p>Module: {m.moduleTitle}</p>
                  </div>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open file
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}