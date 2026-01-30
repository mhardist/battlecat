"use client";

import { useState, useMemo } from "react";
import { searchTutorials, getAllTutorials } from "@/data/seed-tutorials";
import { TutorialCard } from "@/components/TutorialCard";
import { useBookmarks } from "@/hooks/useBookmarks";
import { MaturityLevel } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<MaturityLevel | null>(null);
  const { toggle, isBookmarked } = useBookmarks();

  const results = useMemo(() => {
    let tutorials = query.trim()
      ? searchTutorials(query.trim())
      : getAllTutorials();

    if (levelFilter !== null) {
      tutorials = tutorials.filter((t) => t.maturity_level === levelFilter);
    }

    return tutorials;
  }, [query, levelFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search Tutorials</h1>

      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-bc-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by topic, tool, or keyword..."
          className="w-full rounded-lg border border-bc-border bg-bc-surface pl-12 pr-4 py-3 text-lg outline-none transition-colors focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
        />
      </div>

      {/* Level Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setLevelFilter(null)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            levelFilter === null
              ? "bg-bc-primary text-white"
              : "border border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
          }`}
        >
          All
        </button>
        {([0, 1, 2, 3, 4] as MaturityLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(levelFilter === level ? null : level)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              levelFilter === level
                ? "bg-bc-primary text-white"
                : "border border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
            }`}
          >
            L{level}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-sm text-bc-text-secondary">
        {query.trim()
          ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"`
          : `${results.length} tutorial${results.length !== 1 ? "s" : ""}`}
      </p>

      {/* Results */}
      {results.length > 0 ? (
        <div className="grid gap-3">
          {results.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              tutorial={tutorial}
              showBookmark
              isBookmarked={isBookmarked(tutorial.id)}
              onToggleBookmark={toggle}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">
            No results found for &quot;{query}&quot;. Try a different search
            term.
          </p>
        </div>
      )}
    </div>
  );
}
