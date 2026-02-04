"use client";

import { useState, useTransition } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useProgress } from "@/hooks/useProgress";
import { useAchievementContext } from "./AchievementProvider";
import { MossManBadge } from "./MossManBadge";
import { ListenButton } from "./ListenButton";

interface TutorialActionsProps {
  tutorialId: string;
  tutorialTitle: string;
  tutorialSlug: string;
  isStale?: boolean;
  audioUrl?: string;
  imageUrl?: string;
}

export function TutorialActions({
  tutorialId,
  tutorialTitle,
  tutorialSlug,
  isStale = false,
  audioUrl,
  imageUrl,
}: TutorialActionsProps) {
  const { toggle: toggleBookmark, isBookmarked } = useBookmarks();
  const { getEntry, toggleCompleted, setNotes, isCompleted } = useProgress();
  const { recheckAchievements } = useAchievementContext();
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const entry = getEntry(tutorialId);
  const bookmarked = isBookmarked(tutorialId);
  const completed = isCompleted(tutorialId);

  const handleShare = async () => {
    const url = `${window.location.origin}/tutorials/${tutorialSlug}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: tutorialTitle, url });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Bookmark */}
        <button
          onClick={() => { toggleBookmark(tutorialId); recheckAchievements(); }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            bookmarked
              ? "border-bc-secondary bg-bc-secondary/10 text-bc-secondary"
              : "border-bc-border text-bc-text-secondary hover:border-bc-secondary hover:text-bc-secondary"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={bookmarked ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </button>

        {/* Listen */}
        {audioUrl && (
          <ListenButton
            audioUrl={audioUrl}
            variant="bar"
            tutorialTitle={tutorialTitle}
            imageUrl={imageUrl}
          />
        )}

        {/* Mark Complete */}
        <button
          onClick={() => { toggleCompleted(tutorialId); recheckAchievements(); }}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            completed
              ? "border-bc-success bg-bc-success/10 text-bc-success"
              : "border-bc-border text-bc-text-secondary hover:border-bc-success hover:text-bc-success"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill={completed ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {completed ? "Completed" : "Mark Complete"}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-bc-border px-3 py-2 text-sm font-medium text-bc-text-secondary transition-colors hover:border-bc-primary hover:text-bc-primary"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          {copied ? "Link Copied!" : "Share"}
        </button>

        {/* Notes toggle */}
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            entry.notes
              ? "border-bc-primary bg-bc-primary/10 text-bc-primary"
              : "border-bc-border text-bc-text-secondary hover:border-bc-primary hover:text-bc-primary"
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          {entry.notes ? "View Notes" : "Add Notes"}
        </button>

        {/* Mark Stale (Moss Man) */}
        <MossManBadge tutorialId={tutorialId} isStale={isStale} interactive size="md" />
      </div>

      {/* Notes editor */}
      {showNotes && (
        <div className="rounded-lg border border-bc-border bg-bc-surface p-4 space-y-2">
          <label className="text-sm font-medium">
            Your Notes
          </label>
          <textarea
            value={entry.notes}
            onChange={(e) => setNotes(tutorialId, e.target.value)}
            placeholder="Add your personal notes about this tutorial..."
            rows={4}
            className="w-full rounded-lg border border-bc-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-bc-primary focus:ring-2 focus:ring-bc-primary/20"
          />
          <p className="text-xs text-bc-text-secondary">
            Notes are saved locally in your browser.
          </p>
        </div>
      )}
    </div>
  );
}
