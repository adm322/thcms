"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2, Save } from "lucide-react";

export default function ManageModules({ params }: { params: Promise<{ id: string }> }) {
  const { id: programId } = use(params);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, { title: string; durationMins: number }>>({});

  useEffect(() => {
    fetch(`/api/trainer/programs/${programId}`).then((r) => r.json()).then((d) => setModules(d.modules || [])).finally(() => setLoading(false));
  }, [programId]);

  async function addModule() {
    const res = await fetch(`/api/trainer/programs/${programId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Module", durationMins: 60, orderIndex: modules.length }),
    });
    if (res.ok) {
      const mod = await res.json();
      setModules([...modules, mod]);
    }
  }

  async function saveModule(modId: string) {
    const e = editing[modId];
    if (!e) return;
    await fetch(`/api/trainer/modules/${modId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: e.title, durationMins: e.durationMins }),
    });
    setModules((prev) => prev.map((m) => (m.id === modId ? { ...m, title: e.title, durationMins: e.durationMins } : m)));
    const newEditing = { ...editing };
    delete newEditing[modId];
    setEditing(newEditing);
  }

  async function deleteModule(modId: string) {
    if (!confirm("Delete this module and all its quizzes/materials?")) return;
    await fetch(`/api/trainer/modules/${modId}`, { method: "DELETE" });
    setModules((prev) => prev.filter((m) => m.id !== modId));
  }

  function startEdit(mod: any) {
    setEditing({ ...editing, [mod.id]: { title: mod.title, durationMins: mod.durationMins } });
  }

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Modules</h1>
        <Button onClick={addModule}><Plus className="mr-2 h-4 w-4" />Add Module</Button>
      </div>
      {modules.map((mod, i) => {
        const isEditing = editing[mod.id] !== undefined;
        const e = editing[mod.id];
        return (
          <Card key={mod.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-bold text-muted-foreground flex-shrink-0">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={e.title} onChange={(ev) => setEditing({ ...editing, [mod.id]: { ...e, title: ev.target.value } })} className="font-medium" />
                    <div className="flex items-center gap-2">
                      <Input type="number" value={e.durationMins} onChange={(ev) => setEditing({ ...editing, [mod.id]: { ...e, durationMins: Number(ev.target.value) } })} className="w-24" />
                      <span className="text-xs text-muted-foreground">minutes</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-sm">{mod.title}</p>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      <span>{mod.durationMins} minutes</span>
                      <span>{mod.quizzes?.length || 0} quizzes</span>
                      <span>{mod.materials?.length || 0} files</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isEditing ? (
                  <Button variant="ghost" size="icon" onClick={() => saveModule(mod.id)} title="Save"><Save className="h-4 w-4 text-emerald-600" /></Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => startEdit(mod)}>Edit</Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => deleteModule(mod.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
