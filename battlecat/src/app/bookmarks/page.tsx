"use client";

import Link from "next/link";
import { useBookmarks } from "@/hooks/useBookmarks";
import { TutorialCard } from "@/components/TutorialCard";
import { getAllTutorials } from "@/data/seed-tutorials";

export default function BookmarksPage() {
  const { bookmarks, toggle, isBookmarked, loaded } = useBookmarks();
  const allTutorials = getAllTutorials();
  const bookmarkedTutorials = allTutorials.filter((t) => bookmarks.has(t.id));

  if (!loaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Bookmarks</h1>
        <div className="rounded-lg border border-bc-border bg-bc-surface p-12 text-center">
          <p className="text-bc-text-secondary">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="mt-1 text-sm text-bc-text-secondary">
            {bookmarkedTutorials.length} saved tutorial
            {bookmarkedTutorials.length !== 1 ? "s" : ""}
          </p>
        </div>
        {bookmarkedTutorials.length > 0 && (
          <Link
            href="/browse"
            className="text-sm text-bc-primary hover:underline"
          >
            Browse more &rarr;
          </Link>
        )}
      </div>

      {bookmarkedTutorials.length > 0 ? (
        <div className="grid gap-3">
          {bookmarkedTutorials.map((tutorial) => (
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
        <div className="rounded-lg border border-dashed border-bc-border bg-bc-surface p-12 text-center space-y-3">
          <svg
            className="mx-auto h-10 w-10 text-bc-text-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <p className="text-bc-text-secondary">
            No bookmarks yet. Browse tutorials and tap the bookmark icon to save
            them here.
          </p>
          <Link
            href="/browse"
            className="inline-block rounded-lg bg-bc-primary px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-shadow"
          >
            Browse Tutorials
          </Link>
        </div>
      )}
    </div>
  );
}
