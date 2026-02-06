"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Tutorial } from "@/types";
import { useImpactScore } from "@/hooks/useImpactScore";
import { ImpactScoreBadge } from "./ImpactScoreBadge";
import { IMPACT_COLORS } from "@/lib/impact-score";

interface RecommendedNextProps {
  tutorials: Tutorial[];
  /** Maximum number of recommendations to show */
  limit?: number;
}

/**
 * Displays the top recommended tutorials for a level,
 * sorted by impact score, excluding completed and stale tutorials.
 */
export function RecommendedNext({ tutorials, limit = 3 }: RecommendedNextProps) {
  const [mounted, setMounted] = useState(false);
  const { getRecommended, getScore } = useImpactScore();

  // Delay rendering until client-side to avoid hydration mismatch
  // (scores depend on localStorage which isn't available during SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const recommended = getRecommended(tutorials, limit);
  if (recommended.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <svg className="h-5 w-5 text-bc-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        Recommended Next
      </h2>
      <p className="text-sm text-bc-text-secondary">
        Ranked by impact on your mastery and level-up readiness
      </p>
      <div className="grid gap-3">
        {recommended.map((tutorial, index) => {
          const score = getScore(tutorial);
          const color = IMPACT_COLORS[score.label];
          return (
            <Link
              key={tutorial.id}
              href={`/tutorials/${tutorial.slug}`}
              className="group flex items-start gap-4 rounded-lg border border-bc-border bg-bc-surface p-4 transition-all hover:shadow-md hover:border-bc-primary/30"
            >
              {/* Rank indicator */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold group-hover:text-bc-primary transition-colors">
                    {tutorial.title}
                  </h3>
                  <ImpactScoreBadge score={score} />
                </div>
                <p className="mt-1 text-sm text-bc-text-secondary line-clamp-2">
                  {tutorial.summary}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-bc-text-secondary">
                  <span className="capitalize">{tutorial.difficulty}</span>
                  <span>-</span>
                  <span style={{ color: "#14B8A6" }}>Mastery {score.mastery}</span>
                  <span style={{ color: "#F59E0B" }}>Level-Up {score.levelUp}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
