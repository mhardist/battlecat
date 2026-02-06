"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Achievement } from "@/config/achievements";
import { useAchievements } from "@/hooks/useAchievements";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useRatings } from "@/hooks/useRatings";
import { useProgress } from "@/hooks/useProgress";
import { SorceressModal } from "./SorceressModal";

interface AchievementContextValue {
  /** Track that the user read a tutorial (call on detail page visit) */
  trackRead: (tutorialId: string, maturityLevel: number) => void;
  /** Track a submission */
  trackSubmission: () => void;
  /** Track quiz completion */
  trackQuizComplete: () => void;
  /** Manually trigger an achievement check (e.g., after bookmark/rate/complete) */
  recheckAchievements: () => void;
  /** Check if an achievement is unlocked */
  isUnlocked: (achievementId: string) => boolean;
  /** Total Points of Power */
  totalPoints: number;
  /** Number of unlocked achievements */
  unlockedCount: number;
  /** Whether achievement data has loaded from localStorage */
  loaded: boolean;
}

const AchievementContext = createContext<AchievementContextValue>({
  trackRead: () => {},
  trackSubmission: () => {},
  trackQuizComplete: () => {},
  recheckAchievements: () => {},
  isUnlocked: () => false,
  totalPoints: 0,
  unlockedCount: 0,
  loaded: false,
});

export function useAchievementContext() {
  return useContext(AchievementContext);
}

/**
 * Wraps the app, combining data from all localStorage hooks
 * to evaluate achievements and trigger the Sorceress modal.
 */
export function AchievementProvider({ children }: { children: ReactNode }) {
  const achievements = useAchievements();
  const { bookmarks } = useBookmarks();
  const { ratings } = useRatings();
  const { isCompleted, completedCount } = useProgress();

  const [modalQueue, setModalQueue] = useState<Achievement[]>([]);
  // Track tutorial maturity levels for per-level stats
  const levelMapRef = useRef<Record<string, number>>({});

  // Build per-level stats from read tutorial IDs
  // We store level info when trackRead is called
  const LEVEL_MAP_KEY = "battlecat-tutorial-levels";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEVEL_MAP_KEY);
      if (stored) levelMapRef.current = JSON.parse(stored);
    } catch {
      // ignore
    }
  }, []);

  const saveLevelMap = useCallback(() => {
    try {
      localStorage.setItem(LEVEL_MAP_KEY, JSON.stringify(levelMapRef.current));
    } catch {
      // ignore
    }
  }, []);

  const buildExternalStats = useCallback(() => {
    const readIds = achievements.readTutorialIds;
    const levelReads: Record<number, number> = {};
    const levelCompletions: Record<number, number> = {};
    const levelsSeenSet = new Set<number>();

    for (const tid of readIds) {
      const level = levelMapRef.current[tid];
      if (level !== undefined) {
        levelReads[level] = (levelReads[level] || 0) + 1;
        levelsSeenSet.add(level);
      }
    }

    // Check completions per level
    for (const [tid, level] of Object.entries(levelMapRef.current)) {
      if (isCompleted(tid)) {
        levelCompletions[level] = (levelCompletions[level] || 0) + 1;
      }
    }

    return {
      completions: completedCount,
      ratingsGiven: Object.keys(ratings).length,
      bookmarksCount: bookmarks.size,
      levelReads,
      levelCompletions,
      levelsExplored: levelsSeenSet.size,
    };
  }, [achievements.readTutorialIds, bookmarks.size, ratings, completedCount, isCompleted]);

  const doCheck = useCallback(() => {
    if (!achievements.loaded) return;
    const ext = buildExternalStats();
    const newlyUnlocked = achievements.checkAchievements(ext);
    if (newlyUnlocked.length > 0) {
      setModalQueue(newlyUnlocked);
    }
  }, [achievements, buildExternalStats]);

  // Re-check achievements whenever external stats change
  const prevStatsRef = useRef("");
  useEffect(() => {
    if (!achievements.loaded) return;
    const ext = buildExternalStats();
    const key = JSON.stringify(ext);
    if (key !== prevStatsRef.current) {
      prevStatsRef.current = key;
      doCheck();
    }
  }, [achievements.loaded, buildExternalStats, doCheck]);

  // ── Public actions ──────────────────────────────────────────────────────

  const trackRead = useCallback(
    (tutorialId: string, maturityLevel: number) => {
      levelMapRef.current[tutorialId] = maturityLevel;
      saveLevelMap();
      achievements.trackRead(tutorialId);
    },
    [achievements, saveLevelMap],
  );

  const trackSubmission = useCallback(() => {
    achievements.trackSubmission();
    // Give a tick for the state to update, then recheck
    setTimeout(doCheck, 100);
  }, [achievements, doCheck]);

  const trackQuizComplete = useCallback(() => {
    achievements.trackQuizComplete();
    setTimeout(doCheck, 100);
  }, [achievements, doCheck]);

  const recheckAchievements = useCallback(() => {
    setTimeout(doCheck, 100);
  }, [doCheck]);

  return (
    <AchievementContext.Provider
      value={{
        trackRead,
        trackSubmission,
        trackQuizComplete,
        recheckAchievements,
        isUnlocked: achievements.isUnlocked,
        totalPoints: achievements.totalPoints,
        unlockedCount: achievements.unlocked.length,
        loaded: achievements.loaded,
      }}
    >
      {children}

      {modalQueue.length > 0 && (
        <SorceressModal
          achievements={modalQueue}
          totalPoints={achievements.totalPoints}
          onDismiss={() => setModalQueue([])}
        />
      )}
    </AchievementContext.Provider>
  );
}
