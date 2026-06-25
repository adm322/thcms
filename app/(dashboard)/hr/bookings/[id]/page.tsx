"use client";

import { useState, useEffect, useRef, use } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Download, Award, User, DollarSign, Landmark, Users,
  Clock, MapPin, CreditCard, FileText, CheckCircle2, AlertCircle,
  Building2, QrCode, ImageDown,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const ATTENDANCE_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
};

export default function HRBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/hr/bookings/${id}`).then((r) => r.json()).then(setBooking).catch(console.error);
  }, [id]);

  // QR attendance
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/api/attendance/${id}` : "";
  
  useEffect(() => {
    if (showQR && canvasRef.current) {
      import("qrcode").then(({ default: QRCode }) => QRCode.toCanvas(canvasRef.current!, qrUrl, { width: 200 }));
    }
  }, [showQR, qrUrl]);

  if (!booking) return (
    <div className="py-20 text-center text-muted-foreground animate-in fade-in">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-3">
        <Clock className="h-6 w-6 animate-spin" />
      </div>
      <p>Loading booking details...</p>
    </div>
  );

  if (booking.error) return (
    <div className="py-20 text-center text-red-500">
      <AlertCircle className="h-10 w-10 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Access Denied</h2>
      <p>{booking.error === "Not found" ? "This booking does not exist or you do not have permission to view it." : booking.error}</p>
      <Link href="/hr/bookings">
        <Button variant="outline" className="mt-6">Return to Bookings</Button>
      </Link>
    </div>
  );

  const isUpcoming = new Date(booking.programDate) > new Date();
  const allPending = booking.participants?.every((p: any) => p.attendanceStatus === "PENDING");
  const isCompleted = booking.status === "COMPLETED";

  // ponytail: inline certificate — no new component, uses jspdf already in project
  function generateCertificate(name: string) {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(28);
      doc.text("Certificate of Completion", 148, 60, { align: "center" });
      doc.setFontSize(18);
      doc.text(`This certifies that`, 148, 85, { align: "center" });
      doc.setFontSize(24);
      doc.text(name, 148, 105, { align: "center" });
      doc.setFontSize(16);
      doc.text(`has successfully completed`, 148, 125, { align: "center" });
      doc.text(booking.programTitle, 148, 140, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(booking.programDate).toLocaleDateString("en-MY")}`, 148, 165, { align: "center" });
      doc.text(`Trainer: ${booking.trainerName}`, 148, 175, { align: "center" });
      doc.save(`${name.replace(/\s/g, "_")}_certificate.pdf`);
    });
  }


  function downloadQR() {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `attendance-qr-${id.slice(-6)}.png`;
    a.click();
  }

  return (
    <div className="space-y-6 section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{booking.programTitle}</h1>
            <Badge className={`text-xs ${STATUS_COLORS[booking.status] || ""}`}>{booking.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Building2 className="h-3.5 w-3.5 inline mr-1" />
            {booking.trainerName} · {new Date(booking.programDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {booking.programCategory && <> · <span className="font-medium">{booking.programCategory}</span></>}
            {booking.programDuration && <> · {booking.programDuration}h</>}
          </p>
          {booking.locationType && (
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
              <MapPin className="h-3.5 w-3.5 inline flex-shrink-0" />
              {booking.locationType === "onsite" || booking.locationType === "Onsite"
                ? (booking.venueConfirmed
                  ? <>Onsite at <span className="font-medium">{booking.venueAddress || "Venue confirmed"}</span></>
                  : <span>Onsite — <Badge variant="outline" className="text-[10px] text-amber-600">Venue TBD</Badge></span>)
                : booking.locationType === "hybrid" || booking.locationType === "Hybrid"
                ? (booking.venueConfirmed
                  ? <>Hybrid — <span className="font-medium">{booking.venueAddress || "Venue confirmed"}</span></>
                  : <span>Hybrid — <Badge variant="outline" className="text-[10px] text-amber-600">Venue TBD</Badge></span>)
                : <span>Online</span>
              }
              {!booking.venueConfirmed && (booking.locationType === "onsite" || booking.locationType === "Onsite" || booking.locationType === "hybrid" || booking.locationType === "Hybrid") && (
                <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-primary">Confirm Venue</Button>
              )}
            </p>
          )}
          {booking.meetingLink && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground">Virtual Link:</span>
              <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs bg-muted px-2 py-0.5 rounded">
                {booking.meetingLink}
              </a>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <Button variant="outline" size="sm" onClick={() => generateCertificate(booking.participants?.[0]?.name || "Participant")}>
              <Award className="mr-1 h-4 w-4" />Certificate
            </Button>
          )}
          <Link href={`/api/bookings/${id}/ics`}>
            <Button variant="outline" size="sm"><Calendar className="mr-1 h-4 w-4" />Add to Calendar</Button>
          </Link>
          <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" />Export</Button>
          {booking.status === "CONFIRMED" && (
            <a href={`/class/${id}`} target="_blank" rel="noopener">
              <Button variant="outline" size="sm"><QrCode className="mr-1 h-4 w-4" />Class Mode</Button>
            </a>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking info — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><span className="text-muted-foreground">Trainer:</span> <span className="font-medium">{booking.trainerName}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(booking.programDate).toLocaleDateString("en-MY")}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><span className="text-muted-foreground">Participants:</span> <span className="font-medium">{booking.participants?.length || 0}</span></span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><span className="text-muted-foreground">Total Fee:</span> <span className="font-semibold">RM {booking.totalFee?.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span><span className="text-muted-foreground">Deposit:</span> <span className="font-medium">RM {booking.depositPaid?.toLocaleString()}</span>
                    {booking.depositPaid > 0 && <Badge variant="outline" className="ml-2 text-[10px] text-emerald-600">PAID</Badge>}
                  </span>
                </div>
              </div>
            </div>

            {/* HRDF Claim Status */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                HRDF Claim Status
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className={`rounded-lg border p-3 flex items-center justify-between ${booking.employerHrdfSubmitted ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"}`}>
                  <div>
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Employer Claim
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {booking.employerHrdfSubmitted ? "Submitted — awaiting processing" : "Not yet submitted"}
                    </p>
                  </div>
                  <Badge variant={booking.employerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">
                    {booking.employerHrdfSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className={`rounded-lg border p-3 flex items-center justify-between ${booking.trainerHrdfSubmitted ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200"}`}>
                  <div>
                    <p className="text-xs font-medium flex items-center gap-1">
                      <User className="h-3 w-3" /> Trainer Docs
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {booking.trainerHrdfSubmitted ? "Uploaded — ready for your claim" : "Awaiting upload"}
                    </p>
                  </div>
                  <Badge variant={booking.trainerHrdfSubmitted ? "default" : "secondary"} className="text-[10px]">
                    {booking.trainerHrdfSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
              </div>
              {booking.trainerDocumentsUrl && (
                <a href={booking.trainerDocumentsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline">
                  <FileText className="h-3 w-3" /> View Submitted Documents
                </a>
              )}
              {/* e-TRiS guidance */}
              <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">📋 To submit your HRDF claim:</p>
                <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                  <li>Download the trainer's documents above</li>
                  <li>Log in to the <strong>e-TRiS portal</strong> (etris.hrdcorp.gov.my)</li>
                  <li>Go to Application → Claim → Submit Claims with Grants</li>
                  <li>Upload: claim form, invoice, attendance, photos, trainer profile, certificates</li>
                  <li>Submit within <strong>6 months</strong> of training date</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Participants ({booking.participants?.length || 0})</CardTitle>
              {booking.status === "CONFIRMED" && (<Button size="sm" variant="outline" className="text-xs" onClick={() => setShowQR(!showQR)}><QrCode className="h-3.5 w-3.5 mr-1" />{showQR ? "Hide QR" : "Attendance QR"}</Button>)}
            </div>
          </CardHeader>
          <CardContent>
            {showQR && (<div className="mb-4 p-4 rounded-lg bg-muted/50 text-center"><canvas ref={canvasRef} className="mx-auto rounded-lg bg-white p-2" /><div className="flex items-center justify-center gap-2 mt-2"><Button size="sm" variant="outline" className="text-[10px]" onClick={downloadQR}><ImageDown className="h-3 w-3 mr-1" />Download for Slides</Button></div><p className="text-[10px] text-muted-foreground break-all mt-1">{qrUrl}</p></div>)}
            {/* Explanation for future bookings */}
            {isUpcoming && allPending && (
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 p-3 mb-3">
                <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-700">All participants are pending</p>
                  <p className="text-[10px] text-blue-600">
                    Training is scheduled for {new Date(booking.programDate).toLocaleDateString("en-MY")}. Attendance will be marked after the session.
                  </p>
                </div>
              </div>
            )}

            {booking.participants?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No participants registered.</p>
            ) : (
              <div className="space-y-1">
                {booking.participants?.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted flex-shrink-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {p.email && <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>}
                      </div>
                    </div>
                    <Badge className={`text-[10px] flex-shrink-0 ${ATTENDANCE_COLORS[p.attendanceStatus] || ""}`} variant="outline">
                      {p.attendanceStatus === "PENDING" ? (isUpcoming ? "Upcoming" : "Pending") : p.attendanceStatus}
                    </Badge>
                    {isCompleted && p.attendanceStatus !== "PENDING" && (
                      <Button variant="ghost" size="sm" className="h-5 text-[9px] px-1" onClick={() => generateCertificate(p.name)}>
                        <Award className="h-2.5 w-2.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
