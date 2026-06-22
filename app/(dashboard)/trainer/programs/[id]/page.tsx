"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Edit, BookOpen, FileText, HelpCircle, Layers } from "lucide-react";

export default function ProgramDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [program, setProgram] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/trainer/programs/${id}`)
      .then((r) => r.json())
      .then(setProgram)
      .catch(console.error);
  }, [id]);

  if (!program) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{program.title}</h1>
            <Badge variant={program.status === "PUBLISHED" ? "default" : "secondary"}>{program.status}</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">{program.category} • {program.durationHours}h • {program.locationType}</p>
        </div>
        <Link href={`/trainer/programs/${id}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Program
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules"><Layers className="mr-1 h-4 w-4" />Modules ({program.modules?.length || 0})</TabsTrigger>
          <TabsTrigger value="details"><FileText className="mr-1 h-4 w-4" />Details</TabsTrigger>
          <TabsTrigger value="syllabus"><BookOpen className="mr-1 h-4 w-4" />Syllabus</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4 mt-4">
          {program.modules?.map((mod: any, idx: number) => (
            <Card key={mod.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{mod.title}</p>
                      <p className="text-sm text-muted-foreground">{mod.durationMins} minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {mod.quizzes?.map((q: any) => (
                      <Link key={q.id} href={`/trainer/programs/${id}/quiz?id=${q.id}`}>
                        <Badge variant="outline" className="gap-1">
                          <HelpCircle className="h-3 w-3" />
                          Quiz ({q.questionCount}q)
                        </Badge>
                      </Link>
                    ))}
                    {mod.materials?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {mod.materials.length} files
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!program.modules || program.modules.length === 0) && (
            <p className="py-12 text-center text-muted-foreground">No modules yet. Edit the program to add modules.</p>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="py-6 space-y-3">
              <p className="whitespace-pre-wrap">{program.description || "No description."}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Max Participants:</span><span>{program.maxParticipants}</span>
                <span className="text-muted-foreground">Price per Pax:</span><span>RM {program.pricePerPax}</span>
                <span className="text-muted-foreground">Total Bookings:</span><span>{program._count?.bookings || 0}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="syllabus" className="mt-4">
          <Card>
            <CardContent className="py-6">
              <ul className="list-disc pl-5 space-y-1">
                {(Array.isArray(program.syllabus) ? program.syllabus : []).map((item: string, i: number) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
                {(!program.syllabus || program.syllabus.length === 0) && (
                  <p className="text-muted-foreground">No syllabus items.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
