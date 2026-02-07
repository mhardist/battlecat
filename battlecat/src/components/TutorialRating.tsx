"use client";

import { useRatings } from "@/hooks/useRatings";
import { OrkoRating } from "./OrkoRating";
import { useAchievementContext } from "./AchievementProvider";

interface TutorialRatingProps {
  tutorialId: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Client-side wrapper that connects OrkoRating to localStorage-backed ratings.
 * Can be embedded in server-rendered tutorial pages.
 */
export function TutorialRating({ tutorialId, size = "md" }: TutorialRatingProps) {
  const { getRating, setRating, loaded } = useRatings();
  const { recheckAchievements } = useAchievementContext();

  const handleRate = (id: string, rating: number) => {
    setRating(id, rating);
    recheckAchievements();
  };

  // Always render the same structure to avoid hydration mismatch
  // Just show placeholder Orkos when not loaded
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-bc-text-secondary">Rate this tutorial</p>
      <OrkoRating
        tutorialId={tutorialId}
        rating={loaded ? getRating(tutorialId) : 0}
        onRate={loaded ? handleRate : () => {}}
        size={size}
        readOnly={!loaded}
      />
    </div>
  );
}
