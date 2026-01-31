/** Shimmer skeleton placeholder for loading states */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-bc-border/50 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Card-shaped skeleton matching TutorialCard dimensions */
export function TutorialCardSkeleton() {
  return (
    <div className="rounded-xl border border-bc-border p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-18 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  );
}

/** Grid of card skeletons */
export function TutorialGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TutorialCardSkeleton key={i} />
      ))}
    </div>
  );
}
