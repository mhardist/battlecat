"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "battlecat-progress";

interface ProgressEntry {
  completed: boolean;
  completedAt: string | null;
  notes: string;
}

type ProgressMap = Record<string, ProgressEntry>;

/**
 * localStorage-backed progress tracking.
 * Tracks tutorial completion and personal notes.
 */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress, loaded]);

  const getEntry = useCallback(
    (tutorialId: string): ProgressEntry =>
      progress[tutorialId] || { completed: false, completedAt: null, notes: "" },
    [progress]
  );

  const toggleCompleted = useCallback((tutorialId: string) => {
    setProgress((prev) => {
      const existing = prev[tutorialId] || {
        completed: false,
        completedAt: null,
        notes: "",
      };
      return {
        ...prev,
        [tutorialId]: {
          ...existing,
          completed: !existing.completed,
          completedAt: !existing.completed
            ? new Date().toISOString()
            : null,
        },
      };
    });
  }, []);

  const setNotes = useCallback((tutorialId: string, notes: string) => {
    setProgress((prev) => {
      const existing = prev[tutorialId] || {
        completed: false,
        completedAt: null,
        notes: "",
      };
      return {
        ...prev,
        [tutorialId]: { ...existing, notes },
      };
    });
  }, []);

  const isCompleted = useCallback(
    (tutorialId: string) => !!progress[tutorialId]?.completed,
    [progress]
  );

  const completedCount = Object.values(progress).filter(
    (p) => p.completed
  ).length;

  return { getEntry, toggleCompleted, setNotes, isCompleted, completedCount, loaded };
}
