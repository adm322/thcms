interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "No listings found",
  message = "Try adjusting your filters to see more results.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-2xl">
        🏠
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
