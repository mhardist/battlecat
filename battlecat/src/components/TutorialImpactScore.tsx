"use client";

import { useState, useEffect } from "react";
import { Tutorial } from "@/types";
import { useImpactScore } from "@/hooks/useImpactScore";
import { ImpactScoreBadge } from "./ImpactScoreBadge";

interface TutorialImpactScoreProps {
  tutorial: Tutorial;
}

/**
 * Client component that computes and displays the full impact score
 * breakdown for a tutorial on its detail page.
 */
export function TutorialImpactScore({ tutorial }: TutorialImpactScoreProps) {
  const [mounted, setMounted] = useState(false);
  const { getScore } = useImpactScore();

  // Delay rendering until client-side to avoid hydration mismatch
  // (scores depend on localStorage which isn't available during SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same structure to avoid layout shift
    return (
      <div className="rounded-xl border border-bc-border bg-bc-surface p-5 space-y-4 animate-pulse">
        <div className="h-4 bg-bc-border/30 rounded w-24" />
        <div className="h-2 bg-bc-border/30 rounded w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-12 bg-bc-border/30 rounded" />
          <div className="h-12 bg-bc-border/30 rounded" />
        </div>
      </div>
    );
  }

  const score = getScore(tutorial);
  return <ImpactScoreBadge score={score} variant="full" />;
}
