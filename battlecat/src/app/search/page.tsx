"use client";

import { useState } from "react";

/**
 * Search page.
 * Full-text search across all tutorials.
 * In production, queries Supabase FTS index.
 */
export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search Tutorials</h1>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by topic, tool, or keyword..."
          className="w-full rounded-lg border border-bc-border bg-bc-surface px-4 py-3 text-lg outline-none transition-colors focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((level) => (
          <button
            key={level}
            className="rounded-full border border-bc-border px-3 py-1 text-sm font-medium text-bc-text-secondary transition-colors hover:border-bc-primary hover:text-bc-primary"
          >
            L{level}
          </button>
        ))}
        <button className="rounded-full border border-bc-border px-3 py-1 text-sm font-medium text-bc-text-secondary transition-colors hover:border-bc-primary hover:text-bc-primary">
          Level-Up
        </button>
      </div>

      {/* Results */}
      <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center">
        <p className="text-bc-text-secondary">
          {query
            ? `Search results for "${query}" will appear here once tutorials are ingested.`
            : "Enter a search term to find tutorials across all levels."}
        </p>
      </div>
    </div>
  );
}
