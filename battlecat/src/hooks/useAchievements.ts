"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ALL_ACHIEVEMENTS,
  Achievement,
  UserStats,
} from "@/config/achievements";

const STORAGE_KEY = "battlecat-achievements";

interface AchievementState {
  /** IDs of unlocked achievements */
  unlocked: string[];
  /** Tracking counters */
  stats: {
    reads: string[]; // tutorial IDs
    submissions: number;
    quizCompleted: boolean;
  };
  /** ISO timestamp of last unlock (for display) */
  lastUnlockAt: string | null;
}

const DEFAULT_STATE: AchievementState = {
  unlocked: [],
  stats: {
    reads: [],
    submissions: 0,
    quizCompleted: false,
  },
  lastUnlockAt: null,
};

/**
 * localStorage-backed achievement tracking.
 *
 * This hook manages the achievement state and combines it with data
 * from other hooks (bookmarks, ratings, progress) to compute UserStats.
 *
 * When achievements unlock, the newly unlocked ones are returned so
 * the Sorceress modal can be triggered.
 */
export function useAchievements() {
  const [state, setState] = useState<AchievementState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
        });
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, loaded]);

  // ── Tracking actions ────────────────────────────────────────────────────

  const trackRead = useCallback((tutorialId: string) => {
    setState((prev) => {
      if (prev.stats.reads.includes(tutorialId)) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          reads: [...prev.stats.reads, tutorialId],
        },
      };
    });
  }, []);

  const trackSubmission = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        submissions: prev.stats.submissions + 1,
      },
    }));
  }, []);

  const trackQuizComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        quizCompleted: true,
      },
    }));
  }, []);

  // ── Achievement checking ────────────────────────────────────────────────

  /**
   * Check all achievements against current stats.
   * Returns newly unlocked achievements (not previously unlocked).
   *
   * External hooks data (bookmarks, ratings, progress) must be passed in
   * since this hook doesn't own that data.
   */
  const checkAchievements = useCallback(
    (externalStats: {
      completions: number;
      ratingsGiven: number;
      bookmarksCount: number;
      levelReads: Record<number, number>;
      levelCompletions: Record<number, number>;
      levelsExplored: number;
    }): Achievement[] => {
      const stats: UserStats = {
        reads: state.stats.reads.length,
        completions: externalStats.completions,
        submissions: state.stats.submissions,
        ratingsGiven: externalStats.ratingsGiven,
        bookmarksCount: externalStats.bookmarksCount,
        quizCompleted: state.stats.quizCompleted,
        levelReads: externalStats.levelReads,
        levelCompletions: externalStats.levelCompletions,
        levelsExplored: externalStats.levelsExplored,
      };

      // Calculate total points for "Master of the Universe" check
      const currentPoints = ALL_ACHIEVEMENTS.filter(
        (a) => a.id !== "master-of-universe" && (state.unlocked.includes(a.id) || a.check(stats)),
      ).reduce((sum, a) => sum + a.points, 0);

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of ALL_ACHIEVEMENTS) {
        if (state.unlocked.includes(achievement.id)) continue;

        let earned = false;
        if (achievement.id === "master-of-universe") {
          earned = currentPoints >= 500;
        } else {
          earned = achievement.check(stats);
        }

        if (earned) {
          newlyUnlocked.push(achievement);
        }
      }

      if (newlyUnlocked.length > 0) {
        setState((prev) => ({
          ...prev,
          unlocked: [...prev.unlocked, ...newlyUnlocked.map((a) => a.id)],
          lastUnlockAt: new Date().toISOString(),
        }));
      }

      return newlyUnlocked;
    },
    [state.unlocked, state.stats],
  );

  // ── Computed values ─────────────────────────────────────────────────────

  const unlockedSet = new Set(state.unlocked);
  const totalPoints = ALL_ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id)).reduce(
    (sum, a) => sum + a.points,
    0,
  );

  const isUnlocked = useCallback(
    (achievementId: string) => state.unlocked.includes(achievementId),
    [state.unlocked],
  );

  return {
    loaded,
    unlocked: state.unlocked,
    totalPoints,
    readTutorialIds: state.stats.reads,
    isUnlocked,
    trackRead,
    trackSubmission,
    trackQuizComplete,
    checkAchievements,
  };
}
