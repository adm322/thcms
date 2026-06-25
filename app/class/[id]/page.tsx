"use client";

import { useState, useEffect, useRef, use } from "react";
import { QrCode, Users, Calendar, User, GraduationCap } from "lucide-react";

export default function ClassMode({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [justCheckedIn, setJustCheckedIn] = useState<string | null>(null);

  const [bubbles] = useState(() =>
    [...Array(20)].map(() => ({
      width: `${4 + Math.random() * 8}px`,
      height: `${4 + Math.random() * 8}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${3 + Math.random() * 4}s`
    }))
  );

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`).then(r => r.json()).then(setBooking).catch(console.error);
  }, [id]);

  // Poll every 5s for live check-ins
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/bookings/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (booking) {
          const prev = booking.participants?.filter((p: any) => p.attendanceStatus === "PENDING").map((p: any) => p.name) || [];
          const curr = data.participants?.filter((p: any) => p.attendanceStatus === "PENDING").map((p: any) => p.name) || [];
          const newCheckIn = prev.find((n: string) => !curr.includes(n));
          if (newCheckIn) {
            setJustCheckedIn(newCheckIn);
            setTimeout(() => setJustCheckedIn(null), 3000);
          }
        }
        setBooking(data);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, booking]);

  // Generate QR
  const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/api/attendance/${id}` : "";
  useEffect(() => {
    if (canvasRef.current && qrUrl) {
      import("qrcode").then(({ default: QRCode }) => QRCode.toCanvas(canvasRef.current!, qrUrl, { width: 280 }));
    }
  }, [qrUrl, booking]);

  if (!booking) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white"><p>Loading...</p></div>;

  const attended = booking.participants?.filter((p: any) => p.attendanceStatus === "PRESENT").length || 0;
  const total = booking.participants?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-10">
        {bubbles.map((style, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: style.width, height: style.height,
            left: style.left, top: style.top,
            animation: `float ${style.animationDuration} ease-in-out infinite`,
            animationDelay: style.animationDelay,
          }} />
        ))}
      </div>

      {/* Just checked in animation */}
      {justCheckedIn && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 bg-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl text-xl font-bold">
          ✅ {justCheckedIn} just checked in!
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8 z-10">
        <GraduationCap className="h-16 w-16 mx-auto mb-4 text-emerald-400" />
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{booking.programTitle}</h1>
        <p className="text-lg text-gray-400">
          <User className="h-5 w-5 inline mr-1" />{booking.trainerName}
          {" · "}<Calendar className="h-5 w-5 inline mr-1" />{new Date(booking.date).toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-3xl p-6 shadow-2xl z-10 mb-6">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-sm text-gray-400 mb-8 z-10">Scan to mark your attendance</p>

      {/* Attendance counter */}
      <div className="z-10 mb-8">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <Users className="h-6 w-6 text-emerald-400" />
          <span className="text-emerald-400">{attended}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-300">{total}</span>
          <span className="text-sm font-normal text-gray-500 ml-2">checked in</span>
        </div>
        {/* Progress bar */}
        <div className="w-64 h-2 rounded-full bg-gray-700 mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${total > 0 ? (attended / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Participant list */}
      <div className="w-full max-w-md z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {booking.participants?.map((p: any, i: number) => (
            <div key={i} className={`rounded-lg px-3 py-2 text-sm font-medium text-center transition-all duration-500 ${
              p.attendanceStatus === "PRESENT" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-gray-500"
            }`}>
              <span className={p.attendanceStatus === "PRESENT" ? "" : "opacity-50"}>{p.name.split(" ")[0]}</span>
              {p.attendanceStatus === "PRESENT" && <span className="ml-1">✓</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}`}</style>
    </div>
  );
}
