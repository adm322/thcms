import { Loader2 } from "lucide-react";

export default function BookingsLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full py-16 space-y-3">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 animate-pulse">
        Loading bookings...
      </p>
    </div>
  );
}
