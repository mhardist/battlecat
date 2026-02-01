"use client";

import { useCallback, useState, useEffect } from "react";
import { Tutorial, MaturityLevel } from "@/types";
import {
  calculateImpactScore,
  ImpactScore,
  UserContext,
  sortByImpact,
} from "@/lib/impact-score";
import { useProgress } from "./useProgress";
import { useRatings } from "./useRatings";
import { useBookmarks } from "./useBookmarks";
import { useAchievements } from "./useAchievements";

const QUIZ_LEVEL_KEY = "battlecat-quiz-level";

/**
 * Hook that provides impact scoring for tutorials based on
 * the current user's context (level, progress, ratings, bookmarks).
 */
export function useImpactScore() {
  const { isCompleted, getEntry } = useProgress();
  const { getRating } = useRatings();
  const { isBookmarked } = useBookmarks();
  const { readTutorialIds } = useAchievements();

  const [userLevel, setUserLevel] = useState<MaturityLevel | null>(null);

  // Load user's quiz-detected level
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUIZ_LEVEL_KEY);
      if (stored !== null) {
        const level = parseInt(stored, 10);
        if (level >= 0 && level <= 4) {
          setUserLevel(level as MaturityLevel);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  /** Build user context for a specific tutorial */
  const buildContext = useCallback(
    (tutorial: Tutorial): UserContext => ({
      userLevel,
      completed: isCompleted(tutorial.id),
      rating: getRating(tutorial.id),
      bookmarked: isBookmarked(tutorial.id),
      hasNotes: (getEntry(tutorial.id).notes || "").length > 0,
      hasRead: readTutorialIds.includes(tutorial.id),
    }),
    [userLevel, isCompleted, getRating, isBookmarked, getEntry, readTutorialIds]
  );

  /** Get impact score for a single tutorial */
  const getScore = useCallback(
    (tutorial: Tutorial): ImpactScore => {
      const ctx = buildContext(tutorial);
      return calculateImpactScore(tutorial, ctx);
    },
    [buildContext]
  );

  /** Sort tutorials by impact score (highest first) */
  const sortByScore = useCallback(
    (tutorials: Tutorial[]): Tutorial[] => {
      return sortByImpact(tutorials, getScore);
    },
    [getScore]
  );

  /**
   * Get the top N recommended tutorials from a list,
   * excluding completed ones, sorted by impact.
   */
  const getRecommended = useCallback(
    (tutorials: Tutorial[], limit: number = 3): Tutorial[] => {
      const uncompleted = tutorials.filter((t) => !isCompleted(t.id) && !t.is_stale);
      return sortByImpact(uncompleted, getScore).slice(0, limit);
    },
    [getScore, isCompleted]
  );

  return { getScore, sortByScore, getRecommended, userLevel };
}
