"use client";

import { useState, useEffect } from "react";

/**
 * Toggles between light/dark mode by adding/removing the 'dark' class
 * on the <html> element. Also persists preference in localStorage.
 */
export function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, then system preference
    const stored = localStorage.getItem("battlecat-dark-mode");
    if (stored !== null) {
      setDark(stored === "true");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("battlecat-dark-mode", String(dark));
  }, [dark, mounted]);

  // Always render the same button structure, just with different icon based on state
  // This avoids hydration mismatch from returning null
  return (
    <button
      onClick={() => mounted && setDark(!dark)}
      className="rounded-md p-2 text-bc-text-secondary transition-colors hover:bg-bc-primary/10 hover:text-bc-primary"
      aria-label={mounted ? (dark ? "Switch to light mode" : "Switch to dark mode") : "Toggle dark mode"}
      title={mounted ? (dark ? "Light mode" : "Dark mode") : "Toggle dark mode"}
    >
      {/* Always render moon icon during SSR/initial hydration, then switch based on actual state */}
      {mounted && dark ? (
        // Sun icon (shown when in dark mode)
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // Moon icon (default, shown when not mounted or in light mode)
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
