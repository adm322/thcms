import { Loader2 } from "lucide-react";

export default function GlobalDashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[28rem] w-full py-24 space-y-4 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Glowing outer spin ring */}
        <div className="absolute h-12 w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        {/* Pulsing center dot */}
        <div className="h-6 w-6 rounded-full bg-primary/10 animate-ping" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-sm font-bold tracking-tight">TrainHub</h3>
        <p className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground/60 animate-pulse">
          Loading page...
        </p>
      </div>
    </div>
  );
}
