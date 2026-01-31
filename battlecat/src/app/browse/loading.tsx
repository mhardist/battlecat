import { Skeleton, TutorialGridSkeleton } from "@/components/Skeleton";

export default function BrowseLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-full" />
        ))}
      </div>
      <TutorialGridSkeleton count={6} />
    </div>
  );
}
