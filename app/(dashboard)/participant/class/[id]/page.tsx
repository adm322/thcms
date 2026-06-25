import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  BookOpen, 
  FileText, 
  BrainCircuit, 
  ArrowLeft, 
  Clock, 
  PlayCircle, 
  Trophy, 
  ChevronRight, 
  Award, 
  CheckCircle,
  FileCheck2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FeedbackDialog from "@/components/FeedbackDialog";

export default async function ClassHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;
  const session = await getSession();
  
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // Verify participant is enrolled
  const participant = await prisma.participant.findFirst({
    where: {
      bookingId,
      OR: [
        { userId: session.id },
        { email: session.email }
      ]
    },
    include: {
      quizResults: true,
      booking: {
        include: {
          program: {
            include: {
              modules: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  materials: { orderBy: { orderIndex: 'asc' } },
                  quizzes: { orderBy: { createdAt: 'asc' } }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!participant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You are not enrolled in this class.</p>
        <Link href="/participant" className="text-primary hover:underline mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  const program = participant.booking.program;

  // Calculate curriculum stats
  const totalQuizzes = program.modules.reduce((acc, m) => acc + m.quizzes.length, 0);
  const completedQuizzes = program.modules.reduce((acc, m) => {
    return acc + m.quizzes.filter(q => {
      const result = participant.quizResults.find(r => r.quizId === q.id);
      return result && result.score >= q.passingScore;
    }).length;
  }, 0);
  const hasQuizzes = totalQuizzes > 0;
  const progressPercent = hasQuizzes ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

  // Check if evaluation is active and if participant already submitted feedback
  const evaluation = await prisma.evaluation.findFirst({
    where: { bookingId }
  });
  
  const responses = evaluation?.responses ? JSON.parse(evaluation.responses) : [];
  const hasSubmittedFeedback = responses.some((r: any) => r.participantId === participant.id);

  // Certificate eligibility
  const completedAllQuizzes = progressPercent === 100 || !hasQuizzes;
  const qualifiedForCertificate = participant.attendanceStatus === "PRESENT" && completedAllQuizzes;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Vercel Monochrome Header Banner */}
      <div className="bg-black text-white rounded-lg p-8 shadow-sm relative overflow-hidden border border-border animate-in fade-in duration-300">
        <div className="relative z-10 space-y-6">
          <div>
            <Link 
              href="/participant" 
              className="inline-flex items-center text-xs font-medium text-slate-300 hover:text-white border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md transition-all duration-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Dashboard
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 flex-1">
              <h1 className="text-3xl font-bold tracking-tight leading-tight">{program.title}</h1>
              <p className="text-slate-450 text-sm font-normal leading-relaxed max-w-2xl">{program.description}</p>
            </div>

            {/* Certificate Button in Header (rounded-full pill shape) */}
            {qualifiedForCertificate && (
              <div className="flex-shrink-0 animate-in zoom-in duration-300">
                <a 
                  href={`/api/participants/${participant.id}/certificate`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200 bg-white text-black hover:bg-slate-100 shadow-sm h-9 px-5"
                >
                  <Award className="h-4 w-4 mr-2" /> Get Certificate
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium text-slate-350">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Clock className="h-3.5 w-3.5 text-slate-400" /> {program.durationHours} Hours
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" /> {program.category}
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <span className={`w-2 h-2 rounded-full ${participant.attendanceStatus === "PRESENT" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
              Attendance: {participant.attendanceStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Active Evaluation / Feedback Banner */}
      {evaluation && evaluation.sentAt !== null && (
        <div className="animate-in slide-in-from-bottom-2 duration-300">
          {hasSubmittedFeedback ? (
            <div className="bg-card border border-border rounded-lg p-5 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Course Feedback Submitted</h4>
                  <p className="text-xs text-muted-foreground font-normal">Thank you! Your evaluation responses have been received.</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-50 font-medium font-mono text-[10px] uppercase rounded-full">
                Completed
              </Badge>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 bg-muted text-foreground rounded-lg flex items-center justify-center border border-border flex-shrink-0 mt-0.5">
                  <FileCheck2 className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold text-foreground">Share Your Course Feedback</h4>
                  <p className="text-xs text-muted-foreground font-normal max-w-md leading-relaxed">
                    An evaluation is open for this class. Please take a minute to share your feedback about the course and the trainer.
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <FeedbackDialog 
                  evaluationId={evaluation.id} 
                  evaluationTitle={evaluation.title} 
                  questionsJson={evaluation.questions} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Card */}
      {hasQuizzes && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in duration-300">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Course Progress
            </h3>
            <p className="text-xs text-muted-foreground font-normal">
              Pass all module checkpoint assessments to complete the course curriculum.
            </p>
          </div>
          
          <div className="flex items-center gap-4 flex-1 max-w-md w-full">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-medium text-slate-650 mb-1.5 font-mono">
                <span>Assessment Completion</span>
                <span>{completedQuizzes} / {totalQuizzes} Passed</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
            <div className="text-xl font-semibold text-foreground font-mono w-14 text-right">
              {progressPercent}%
            </div>
          </div>
        </div>
      )}

      {/* Curriculum Timeline */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center mb-1">
          <BookOpen className="mr-2 h-5 w-5 text-muted-foreground" />
          Course Curriculum
        </h2>

        {program.modules.length === 0 ? (
          <Card className="bg-muted/10 border-dashed border-border rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <BookOpen className="h-10 w-10 mb-3 opacity-30 text-muted-foreground" />
              <p className="text-sm font-normal">No modules have been published for this course yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative before:absolute before:left-6 before:top-8 before:bottom-8 before:w-0.5 before:bg-border space-y-6">
            {program.modules.map((module, index) => (
              <div key={module.id} className="relative pl-12 group animate-in fade-in duration-300">
                {/* Timeline Step Icon (rounded-lg) */}
                <div className="absolute left-0 top-0.5 w-12 h-12 rounded-lg bg-card border border-border shadow-2xs flex flex-col items-center justify-center group-hover:border-slate-400 transition-colors duration-200">
                  <span className="text-[8px] font-medium text-muted-foreground font-mono uppercase tracking-widest leading-none mb-0.5">MOD</span>
                  <span className="text-base font-semibold text-foreground font-mono leading-none">{index + 1}</span>
                </div>

                {/* Module Details Card (rounded-lg) */}
                <div className="bg-card border border-border rounded-lg p-5 shadow-xs hover:border-slate-350 transition-colors duration-200">
                  <div className="space-y-0.5 mb-3 pb-3 border-b border-border">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-blue-600 transition-colors duration-200">{module.title}</h3>
                    {module.description && (
                      <p className="text-xs text-muted-foreground font-normal leading-relaxed">{module.description}</p>
                    )}
                  </div>

                  {module.materials.length === 0 && module.quizzes.length === 0 ? (
                    <div className="py-3 text-xs text-muted-foreground text-center italic">
                      No materials available in this module yet.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {/* Materials */}
                      {module.materials.map((material) => (
                        <li key={material.id}>
                          <a 
                            href={material.fileUrl || "#"} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center p-3.5 bg-muted/10 hover:bg-muted/30 border border-border rounded-lg transition-all duration-200 group/item hover:translate-x-0.5"
                          >
                            <div className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center mr-3 shadow-2xs">
                              {material.fileType === "VIDEO" ? (
                                <PlayCircle className="h-4 w-4 text-rose-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xs font-semibold text-foreground group-hover/item:text-blue-650 transition-colors">{material.title}</h4>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-wider">{material.fileType} Document</p>
                            </div>
                          </a>
                        </li>
                      ))}

                      {/* Quizzes */}
                      {module.quizzes.map((quiz) => {
                        const result = participant.quizResults.find(r => r.quizId === quiz.id);
                        const hasScore = !!result;
                        const score = result?.score;
                        const passedQuiz = hasScore && score! >= quiz.passingScore;

                        return (
                          <li key={quiz.id}>
                            <Link 
                              href={`/quiz/${quiz.shareToken}`}
                              className="flex items-center p-3.5 bg-muted/10 hover:bg-muted/30 border border-border rounded-lg transition-all duration-200 group/item hover:translate-x-0.5"
                            >
                              <div className="h-9 w-9 rounded-md bg-card border border-border flex items-center justify-center mr-3 shadow-2xs">
                                <BrainCircuit className="h-4 w-4 text-amber-500" />
                              </div>
                              <div className="flex-1 flex justify-between items-center gap-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-foreground group-hover/item:text-blue-650 transition-colors">{quiz.title}</h4>
                                  <p className="text-[9px] text-muted-foreground font-normal">Checkpoint &bull; {quiz.passingScore}% passing score</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {hasScore ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium font-mono border ${passedQuiz ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                      Score: {score}%
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-card text-muted-foreground border border-border group-hover/item:bg-muted/80">
                                      Start Checkpoint
                                    </span>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                                </div>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
