import Link from "next/link";
import { Tutorial } from "@/types";
import { LevelBadge } from "./LevelBadge";
import { ToolBadge } from "./ToolBadge";
import { StaleOverlay } from "./MossManBadge";

interface TutorialCardProps {
  tutorial: Tutorial;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  /** 0-5 Orko rating (from localStorage). Shown as mini Orkos on the card. */
  rating?: number;
}

export function TutorialCard({
  tutorial,
  showBookmark = false,
  isBookmarked = false,
  onToggleBookmark,
  rating = 0,
}: TutorialCardProps) {
  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className={`group block rounded-xl border bg-bc-surface overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 relative ${
        tutorial.is_stale
          ? "border-green-800/40 hover:border-green-700/50"
          : "border-bc-border hover:border-bc-primary/30"
      }`}
    >
      {tutorial.is_stale && <StaleOverlay />}

      {/* Hero image */}
      {tutorial.image_url && (
        <div className="relative overflow-hidden">
          <img
            src={tutorial.image_url}
            alt=""
            className="w-full aspect-[2/1] object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <LevelBadge
              level={tutorial.maturity_level}
              relation={tutorial.level_relation}
            />
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            {/* Level badge (only if no image) */}
            {!tutorial.image_url && (
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
            )}

            {/* Metadata row when image is present */}
            {tutorial.image_url && (
              <div className="flex items-center gap-2 text-xs text-bc-text-secondary">
                <span className="capitalize">{tutorial.difficulty}</span>
                {tutorial.source_count > 1 && (
                  <>
                    <span>-</span>
                    <span>{tutorial.source_count} sources</span>
                  </>
                )}
              </div>
            )}

            <h3 className="text-lg font-semibold group-hover:text-bc-primary transition-colors leading-snug">
              {tutorial.title}
            </h3>

            <p className="text-sm text-bc-text-secondary line-clamp-2 leading-relaxed">
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
                <ToolBadge key={tool} tool={tool} />
              ))}
            </div>

            {/* Mini Orko rating */}
            {rating > 0 && (
              <div className="flex items-center gap-0.5 pt-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    width={14}
                    height={18}
                    viewBox="0 0 64 80"
                    fill="none"
                    style={{ opacity: i <= rating ? 1 : 0.15 }}
                  >
                    <path d="M32 0L18 30h28L32 0z" fill={i <= rating ? "#E53935" : "#9CA3AF"} />
                    <ellipse cx="32" cy="30" rx="16" ry="4" fill={i <= rating ? "#C62828" : "#6B7280"} />
                    <ellipse cx="32" cy="36" rx="10" ry="6" fill={i <= rating ? "#1a1a2e" : "#4B5563"} />
                    <circle cx="28" cy="35" r="2" fill={i <= rating ? "#FDD835" : "#9CA3AF"} />
                    <circle cx="36" cy="35" r="2" fill={i <= rating ? "#FDD835" : "#9CA3AF"} />
                    <path d="M22 38q10 6 20 0v4q-10 6-20 0z" fill={i <= rating ? "#9C27B0" : "#6B7280"} />
                    <path d="M22 42q0 20 10 28q10-8 10-28z" fill={i <= rating ? "#E53935" : "#9CA3AF"} />
                  </svg>
                ))}
                <span className="ml-1 text-[10px] text-bc-text-secondary">{rating}/5</span>
              </div>
            )}
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
      </div>
    </Link>
  );
}
