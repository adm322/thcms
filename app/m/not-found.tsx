import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function MobileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-dvh px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <AlertTriangle className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/m"
        className="text-sm text-primary hover:underline"
      >
        Go to mobile dashboard
      </Link>
    </div>
  );
}
