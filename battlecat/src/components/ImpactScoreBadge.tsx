"use client";

import { ImpactScore, IMPACT_COLORS } from "@/lib/impact-score";

interface ImpactScoreBadgeProps {
  score: ImpactScore;
  /** "compact" for cards, "full" for detail page */
  variant?: "compact" | "full";
}

/**
 * Visual display of a tutorial's impact score.
 * Compact: small pill showing score number + label.
 * Full: expanded breakdown with mastery + level-up sub-scores.
 */
export function ImpactScoreBadge({
  score,
  variant = "compact",
}: ImpactScoreBadgeProps) {
  const color = IMPACT_COLORS[score.label];

  if (variant === "compact") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight"
        style={{ backgroundColor: `${color}20`, color }}
        title={`Impact: ${score.total} — Mastery ${score.mastery}, Level-Up ${score.levelUp}`}
      >
        <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1l2.5 5.5L18 7.5l-4 4.5 1 6L10 15l-5 3 1-6-4-4.5 5.5-1z"
            fill={color}
          />
        </svg>
        {score.total}
      </span>
    );
  }

  // Full variant with sub-score breakdown
  return (
    <div className="rounded-xl border border-bc-border bg-bc-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-bc-text-secondary uppercase tracking-wider">
          Impact Score
        </h3>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 1l2.5 5.5L18 7.5l-4 4.5 1 6L10 15l-5 3 1-6-4-4.5 5.5-1z"
              fill={color}
            />
          </svg>
          {score.total}/100
        </span>
      </div>

      {/* Overall bar */}
      <div>
        <div className="h-2 w-full rounded-full bg-bc-border/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score.total}%`, backgroundColor: color }}
          />
        </div>
        <p className="mt-1 text-xs capitalize" style={{ color }}>
          {score.label} impact
        </p>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-2 gap-4">
        <SubScore
          label="Mastery"
          value={score.mastery}
          description="Helps master current level"
          color="#14B8A6"
        />
        <SubScore
          label="Level-Up"
          value={score.levelUp}
          description="Prepares for next level"
          color="#F59E0B"
        />
      </div>
    </div>
  );
}

function SubScore({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: number;
  description: string;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-bc-text-secondary">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bc-border/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-bc-text-secondary leading-tight">{description}</p>
    </div>
  );
}
