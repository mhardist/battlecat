"use client";

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
  const { getScore } = useImpactScore();
  const score = getScore(tutorial);

  return <ImpactScoreBadge score={score} variant="full" />;
}
