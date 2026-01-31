"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "battlecat-ratings";

/**
 * localStorage-backed tutorial ratings (0-5 Orkos).
 * Works for anonymous users before auth is added.
 */
export function useRatings() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRatings(JSON.parse(stored));
      }
    } catch {
      // localStorage may not be available in SSR
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // ignore write failures
    }
  }, [ratings, loaded]);

  const setRating = useCallback((tutorialId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [tutorialId]: rating }));
  }, []);

  const getRating = useCallback(
    (tutorialId: string) => ratings[tutorialId] ?? 0,
    [ratings]
  );

  return { ratings, setRating, getRating, loaded };
}
