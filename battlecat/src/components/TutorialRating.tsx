"use client";

import { useRatings } from "@/hooks/useRatings";
import { OrkoRating } from "./OrkoRating";

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

  if (!loaded) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-bc-text-secondary">Rate this tutorial</p>
      <OrkoRating
        tutorialId={tutorialId}
        rating={getRating(tutorialId)}
        onRate={setRating}
        size={size}
      />
    </div>
  );
}
