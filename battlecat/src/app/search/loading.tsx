import { Skeleton, TutorialGridSkeleton } from "@/components/Skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <TutorialGridSkeleton count={3} />
    </div>
  );
}
