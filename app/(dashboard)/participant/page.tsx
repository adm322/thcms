import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Clock, 
  Award, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  QrCode, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticipantVoting from "@/components/ParticipantVoting";

export default async function ParticipantDashboard() {
  const session = await getSession();
  if (!session || session.role !== "PARTICIPANT") {
    redirect("/login");
  }

  // Fetch participant records matching this user, with full curriculum and quiz info
  const participations = await prisma.participant.findMany({
    where: {
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
                include: {
                  quizzes: true
                }
              }
            }
          },
          company: true,
        }
      }
    },
    orderBy: {
      booking: {
        programDate: "asc"
      }
    },
      take: 100,
      skip: 0
});

  // Calculate statistics
  const completedParticipations = participations.filter(p => p.attendanceStatus === "PRESENT");
  const totalHours = completedParticipations.reduce((sum, p) => sum + (p.booking?.program?.durationHours || 0), 0);
  
  const quizScores = participations.flatMap(p => p.quizResults.map(r => r.score));
  const avgQuizScore = quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;
  
  const certificatesEarned = completedParticipations.filter(p => {
    const quizzesCount = p.booking?.program?.modules?.reduce((acc, m) => acc + m.quizzes.length, 0) || 0;
    const takenQuizzesCount = p.quizResults.length;
    return quizzesCount === 0 || takenQuizzesCount === quizzesCount;
  }).length;

  const upcomingClasses = participations.filter(p => p.attendanceStatus === "PENDING");
  const completedClasses = participations.filter(p => p.attendanceStatus === "PRESENT");

  return (
    <div className="space-y-6 pb-12">
      {/* Vercel monochrome Gradient Header Card */}
      <div className="relative overflow-hidden rounded-lg bg-black p-8 text-white border border-border shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-white/10 text-slate-200 border border-white/10 px-3 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Learner Profile
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {session.name}
            </h1>
            <p className="text-slate-400 font-normal text-sm leading-relaxed max-w-xl">
              Track your upcoming workshops, access course handouts, and view your professional credentials.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <Link 
              href="/participant/scan" 
              className="inline-flex items-center justify-center rounded-full text-xs font-medium transition-all duration-200 bg-white text-black hover:bg-slate-100 h-9 px-6"
            >
              <QrCode className="h-3.5 w-3.5 mr-2" /> Scan QR Code
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Dashboard section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hours Completed */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:border-slate-400 transition-colors duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Hours Completed</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground font-mono tracking-tight">{totalHours}h</h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Completed sessions
            </p>
          </div>
        </div>

        {/* Classes Attended */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:border-slate-400 transition-colors duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Classes Attended</span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground font-mono tracking-tight">{completedParticipations.length}</h3>
            <p className="text-xs text-muted-foreground mt-1">Total workshops attended</p>
          </div>
        </div>

        {/* Certificates Earned */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:border-slate-400 transition-colors duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Certificates</span>
            <Award className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground font-mono tracking-tight">{certificatesEarned}</h3>
            <p className="text-xs text-muted-foreground mt-1">Verified achievements</p>
          </div>
        </div>

        {/* Average Quiz Score */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm hover:border-slate-400 transition-colors duration-250 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-mono">Avg Quiz Score</span>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground font-mono tracking-tight">
              {avgQuizScore !== null ? `${avgQuizScore}%` : "—"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Knowledge checkpoints</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Section */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedule">
            My Schedule ({upcomingClasses.length})
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Achievements & Certificates ({completedClasses.length})
          </TabsTrigger>
          <TabsTrigger value="voting">
            Request Training
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Schedule */}
        <TabsContent value="schedule" className="space-y-4 outline-none">
          {upcomingClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border border-dashed rounded-lg bg-muted/20">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No Upcoming Workshops</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm font-normal leading-relaxed">
                You are not currently enrolled in any upcoming training programs. Reach out to your HR department to register.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {upcomingClasses.map((p) => {
                const dateStr = new Date(p.booking.programDate).toLocaleDateString("en-MY", {
                  day: "numeric", month: "long", year: "numeric"
                });
                return (
                  <div 
                    key={p.id} 
                    className="group border border-border bg-card rounded-lg overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono py-0.5 tracking-wider bg-muted/30 rounded-full">
                            {p.booking.program.category}
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 font-medium text-[10px] uppercase font-mono tracking-wider rounded-full">
                            {p.attendanceStatus}
                          </Badge>
                        </div>
                        
                        <Link 
                          href={`/participant/class/${p.booking.id}`} 
                          className="font-semibold text-base text-foreground leading-tight block hover:text-blue-600 transition-colors"
                        >
                          {p.booking.program.title}
                        </Link>
                      </div>

                      <div className="space-y-1.5 pt-3 border-t border-border text-muted-foreground text-xs font-normal">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                          <span>{p.booking.program.durationHours} Hours</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{p.booking.venueAddress || p.booking.program.locationType.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                      <Link 
                        href={`/participant/class/${p.booking.id}`} 
                        className="text-xs font-medium text-foreground hover:text-blue-600 transition-colors flex items-center"
                      >
                        Enter Class Hub <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                      <Link 
                        href="/participant/scan" 
                        className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1 hover:border-slate-400 shadow-2xs"
                      >
                        Check-in &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Achievements */}
        <TabsContent value="achievements" className="space-y-4 outline-none">
          {completedClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-border border-dashed rounded-lg bg-muted/20">
              <Award className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="text-sm font-semibold text-foreground">No Certificates Yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm font-normal leading-relaxed">
                Your earned certificates will appear here once you attend training sessions and complete checkpoints.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              {completedClasses.map((p) => {
                const dateStr = new Date(p.booking.programDate).toLocaleDateString("en-MY", {
                  day: "numeric", month: "long", year: "numeric"
                });
                const quizzesCount = p.booking.program.modules.reduce((acc, m) => acc + m.quizzes.length, 0);
                const hasQuizzes = quizzesCount > 0;
                const passedAll = !hasQuizzes || (p.quizResults.length === quizzesCount && p.quizResults.every(r => r.score >= 50));
                const avgScore = p.quizResults.length > 0 ? Math.round(p.quizResults.reduce((sum, r) => sum + r.score, 0) / p.quizResults.length) : null;
                const qualifiedForCertificate = p.attendanceStatus === "PRESENT" && passedAll;

                return (
                  <div 
                    key={p.id} 
                    className="group border border-border bg-card rounded-lg overflow-hidden shadow-xs hover:border-slate-400 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono py-0.5 tracking-wider bg-muted/30 rounded-full">
                            {p.booking.program.category}
                          </Badge>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-medium text-[10px] uppercase font-mono tracking-wider rounded-full">
                            Attended
                          </Badge>
                        </div>
                        
                        <Link 
                          href={`/participant/class/${p.booking.id}`} 
                          className="font-semibold text-base text-foreground leading-tight block hover:text-blue-600 transition-colors"
                        >
                          {p.booking.program.title}
                        </Link>
                      </div>

                      <div className="pt-3 border-t border-border space-y-2.5">
                        {/* Score stats */}
                        {hasQuizzes ? (
                          <div className="flex items-center justify-between text-xs font-normal text-muted-foreground">
                            <span>Checkpoint score:</span>
                            <span className={`font-mono font-medium px-2 py-0.5 rounded-md ${passedAll ? 'text-emerald-700 bg-emerald-50 border border-emerald-150' : 'text-rose-700 bg-rose-50 border border-rose-150'}`}>
                              {avgScore !== null ? `${avgScore}% avg` : "Not taken"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs font-normal text-muted-foreground">
                            <span>Assessment:</span>
                            <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">No quizzes required</span>
                          </div>
                        )}

                        <div className="space-y-1 text-muted-foreground text-xs font-normal">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                            <span>{p.booking.program.durationHours} Hours completion</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                      <Link 
                        href={`/participant/class/${p.booking.id}`} 
                        className="text-xs font-medium text-foreground hover:text-blue-600 transition-colors flex items-center"
                      >
                        Class Resources <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                      
                      {qualifiedForCertificate ? (
                        <a 
                          href={`/api/participants/${p.id}/certificate`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-emerald-600 hover:underline flex items-center gap-1 bg-card border border-border rounded-full px-3 py-1.5 hover:border-slate-400 shadow-2xs hover:bg-emerald-50/50"
                        >
                          Certificate &rarr;
                        </a>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-medium bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                          Quiz incomplete
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Request Training */}
        <TabsContent value="voting" className="space-y-4 outline-none">
          <ParticipantVoting />
        </TabsContent>
      </Tabs>
    </div>
  );
}
