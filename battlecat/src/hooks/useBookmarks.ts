"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "battlecat-bookmarks";

/**
 * localStorage-backed bookmarks.
 * Works for anonymous users before auth is added.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setBookmarks(new Set(JSON.parse(stored)));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...bookmarks]));
    } catch {
      // ignore write failures
    }
  }, [bookmarks, loaded]);

  const toggle = useCallback((tutorialId: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(tutorialId)) {
        next.delete(tutorialId);
      } else {
        next.add(tutorialId);
      }
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (tutorialId: string) => bookmarks.has(tutorialId),
    [bookmarks]
  );

  return { bookmarks, toggle, isBookmarked, loaded };
}
