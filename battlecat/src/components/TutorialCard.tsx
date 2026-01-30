import Link from "next/link";
import { Tutorial } from "@/types";
import { LevelBadge } from "./LevelBadge";

interface TutorialCardProps {
  tutorial: Tutorial;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
}

export function TutorialCard({
  tutorial,
  showBookmark = false,
  isBookmarked = false,
  onToggleBookmark,
}: TutorialCardProps) {
  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className="group block rounded-lg border border-bc-border bg-bc-surface p-5 transition-all hover:shadow-md hover:border-bc-primary/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge
              level={tutorial.maturity_level}
              relation={tutorial.level_relation}
            />
            <span className="text-xs text-bc-text-secondary">
              {tutorial.difficulty}
            </span>
            {tutorial.source_count > 1 && (
              <span className="text-xs text-bc-text-secondary">
                {tutorial.source_count} sources
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold group-hover:text-bc-primary transition-colors">
            {tutorial.title}
          </h3>

          <p className="text-sm text-bc-text-secondary line-clamp-2">
            {tutorial.summary}
          </p>

          <div className="flex flex-wrap gap-1 pt-1">
            {tutorial.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-full bg-bc-primary/10 px-2 py-0.5 text-xs font-medium text-bc-primary"
              >
                {topic}
              </span>
            ))}
            {tutorial.tools_mentioned.slice(0, 2).map((tool) => (
              <span
                key={tool}
                className="rounded-full bg-bc-border px-2 py-0.5 text-xs text-bc-text-secondary"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {showBookmark && onToggleBookmark && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(tutorial.id);
            }}
            className="shrink-0 p-1 text-bc-text-secondary hover:text-bc-secondary transition-colors"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <svg
              className="h-5 w-5"
              fill={isBookmarked ? "currentColor" : "none"}
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
          </button>
        )}
      </div>
    </Link>
  );
}
