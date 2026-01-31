"use client";

import { useEffect } from "react";
import { useAchievementContext } from "./AchievementProvider";

/**
 * Invisible component that tracks a tutorial read for achievements.
 * Placed on the tutorial detail page to fire once on mount.
 */
export function TutorialReadTracker({
  tutorialId,
  maturityLevel,
}: {
  tutorialId: string;
  maturityLevel: number;
}) {
  const { trackRead } = useAchievementContext();

  useEffect(() => {
    trackRead(tutorialId, maturityLevel);
  }, [tutorialId, maturityLevel, trackRead]);

  return null;
}
