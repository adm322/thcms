"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/Toast";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import {
  Calendar, Users, MapPin, FileText, CheckCircle2,
  Clock, DollarSign, ArrowLeft, Upload, QrCode
} from "lucide-react";

interface BookingDetail {
  id: string;
  programTitle: string;
  programCategory: string;
  programDuration: number;
  locationType: string;
  companyName: string;
  programDate: string;
  status: string;
  totalFee: number;
  maxParticipants: number;
  venuePreference: string | null;
  venueAddress: string | null;
  venueConfirmed: boolean;
  meetingLink?: string | null;
  trainerHrdfSubmitted: boolean;
  trainerDocumentsUrl: string | null;
  participants: { id: string; name: string; email: string; attendanceStatus: string }[];
  error?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function TrainerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/trainer/bookings/${id}`)
      .then(r => r.json())
      .then(data => { setBooking(data); setLoading(false); })
      .catch((e) => { console.error("Failed to load booking:", e); setLoading(false); });
  }, [id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !booking) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      await fetch(`/api/trainer/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerDocumentsUrl: url, trainerHrdfSubmitted: true }),
      });

      setBooking({ ...booking, trainerDocumentsUrl: url, trainerHrdfSubmitted: true });
      toast("Documents uploaded successfully", "success");
    } catch {
      toast("Upload failed — try again", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) return <BookingDetailSkeleton />;
  if (!booking) return <p className="text-muted-foreground p-8 text-center">Loading booking details...</p>;
  if (booking.error) return (
    <div className="py-20 text-center text-red-500">
      <h2 className="text-xl font-bold mb-2">Access Denied</h2>
      <p>{booking.error === "Not found" ? "This booking does not exist or you do not have permission to view it." : booking.error}</p>
      <Link href="/trainer/bookings">
        <Button variant="outline" className="mt-6">Return to Bookings</Button>
      </Link>
    </div>
  );
  const isPast = new Date(booking.programDate) < new Date();
  const attendedCount = booking.participants.filter(p => p.attendanceStatus === "PRESENT").length;

  return (
    <div className="space-y-6 max-w-3xl section-enter">
      <div className="flex items-center gap-3">
        <Link href="/trainer/bookings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{booking.programTitle}</h1>
          <p className="text-sm text-muted-foreground">{booking.companyName}</p>
        </div>
        <Badge className={`ml-auto ${STATUS_COLORS[booking.status] || ""}`}>{booking.status}</Badge>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Session Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{new Date(booking.programDate).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{booking.programDuration} hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{booking.venuePreference === "online" ? "Online" : booking.venueAddress || "Venue TBD"}</span>
              {booking.venueConfirmed && <Badge variant="outline" className="text-[10px]">Confirmed</Badge>}
            </div>
            {booking.meetingLink && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-xs text-muted-foreground">Virtual Link:</span>
                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-xs truncate">
                  {booking.meetingLink}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>RM {booking.totalFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{booking.participants.length} / {booking.maxParticipants || "∞"} participants</span>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div>
                Participants
                <Badge variant="secondary" className="text-[10px] ml-2">{attendedCount}/{booking.participants.length} attended</Badge>
              </div>
              <Dialog>
                <DialogTrigger>
                  <Button variant="outline" size="sm" className="h-8 gap-1"><QrCode className="h-4 w-4" /> Class QR</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md flex flex-col items-center justify-center py-10">
                  <DialogHeader className="w-full text-center pb-4">
                    <DialogTitle className="text-center text-2xl font-bold">Class Check-in</DialogTitle>
                    <DialogDescription className="text-center">Scan this QR code to mark your attendance</DialogDescription>
                  </DialogHeader>
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    {typeof window !== "undefined" && (
                      <QRCodeSVG value={`${window.location.origin}/api/attendance/${booking.id}`} size={256} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-6 text-center">URL: {typeof window !== "undefined" ? `${window.location.origin}/api/attendance/${booking.id}` : ""}</p>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {booking.participants.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground text-center">No participants listed.</p>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {booking.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.email}</p>
                    </div>
                    {p.attendanceStatus === "PRESENT"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <span className="text-[10px] text-muted-foreground">{p.attendanceStatus}</span>
                    }
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HRDF Docs — only for completed */}
      {booking.status === "COMPLETED" && (
        <Card className={booking.trainerHrdfSubmitted ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Supporting Documents for Employer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {booking.trainerHrdfSubmitted ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Documents shared — the employer can now download and submit to e-TRiS.
                </div>
                <p className="text-[11px] text-muted-foreground">
                  ℹ️ You don't submit to e-TRiS directly. The employer downloads your documents and files the HRDF claim via the e-TRiS portal.
                </p>
                {booking.trainerDocumentsUrl && (
                  <a href={booking.trainerDocumentsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <FileText className="h-3 w-3" /> View uploaded file
                  </a>
                )}
                <button
                  onClick={() => {
                    setBooking({ ...booking, trainerHrdfSubmitted: false, trainerDocumentsUrl: null });
                    fetch(`/api/trainer/bookings/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ trainerDocumentsUrl: null, trainerHrdfSubmitted: false }),
                    });
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline self-start mt-1"
                >
                  Remove & re-upload
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload supporting documents for the employer to download. They will submit these to e-TRiS for their HRDF claim:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Official invoice</li>
                  <li>Signed attendance sheets (Form T3)</li>
                  <li>Trainer profile / CV</li>
                  <li>Course outline & schedule</li>
                  <li>Training photos (3–5)</li>
                  <li>Evaluation summary</li>
                </ul>
                <p className="text-xs text-muted-foreground">
                  Combine all documents into one PDF or ZIP file.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.zip,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    className="hidden"
                    id="trainer-doc-upload"
                  />
                  <label
                    htmlFor="trainer-doc-upload"
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer
                      ${uploading
                        ? "bg-muted text-muted-foreground pointer-events-none"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload File"}
                  </label>
                  <span className="text-[11px] text-muted-foreground">PDF, ZIP, DOC, or images</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href={`/class/${booking.id}`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          🎓 Class Mode
        </Link>
        <Link href="/trainer/sop" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <FileText className="h-4 w-4" /> View SOP
        </Link>
      </div>
    </div>
  );
}

function BookingDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 sm:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  );
}
