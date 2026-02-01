/**
 * Tutorial Impact Score Algorithm
 *
 * Scores tutorials (0-100) based on their impact on a user's ability to:
 * 1. Master their current AI maturity level (Mastery Contribution)
 * 2. Prepare to level up (Level-Up Readiness)
 *
 * Two scoring dimensions:
 * - Content Quality Signal (intrinsic to the tutorial metadata)
 * - Engagement Signal (derived from user behavior)
 */

import { Tutorial, MaturityLevel } from "@/types";
import { LEVELS } from "@/config/levels";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ImpactScore {
  /** Composite score 0-100 */
  total: number;
  /** How much this tutorial helps master the current level (0-100) */
  mastery: number;
  /** How much this tutorial prepares the user to level up (0-100) */
  levelUp: number;
  /** Label for display */
  label: "low" | "moderate" | "high" | "exceptional";
}

export interface UserContext {
  /** User's current maturity level from quiz (null if not taken) */
  userLevel: MaturityLevel | null;
  /** Whether the user has completed this tutorial */
  completed: boolean;
  /** User's Orko rating for this tutorial (0 = unrated, 1-5) */
  rating: number;
  /** Whether the user bookmarked this tutorial */
  bookmarked: boolean;
  /** Whether the user wrote notes on this tutorial */
  hasNotes: boolean;
  /** Whether the user has read this tutorial */
  hasRead: boolean;
}

// ─── Weights ────────────────────────────────────────────────────────────────

/** Content quality weights (sum to ~50 max) */
const W = {
  /** Bonus for level-relation alignment */
  RELATION_MASTERY: 12,
  RELATION_LEVELUP: 12,
  /** Action items signal hands-on learning */
  ACTION_ITEMS: 10,
  /** Well-sourced content is more credible */
  SOURCES: 6,
  /** Difficulty alignment with user level */
  DIFFICULTY_MATCH: 8,
  /** Tools relevance to user's level toolkit */
  TOOLS_RELEVANCE: 7,
  /** Stale content penalty (multiplier, not additive) */
  STALE_PENALTY: 0.6,

  /** Engagement weights (sum to ~50 max) */
  COMPLETED: 20,
  RATING: 15, // max at 5/5
  BOOKMARKED: 5,
  NOTES: 5,
  READ: 5,
} as const;

// ─── Content Quality Scoring ────────────────────────────────────────────────

/**
 * Score how well the tutorial's level_relation aligns with mastery vs. level-up.
 * Returns [masteryPoints, levelUpPoints].
 */
function scoreRelation(
  tutorial: Tutorial,
  userLevel: MaturityLevel | null
): [number, number] {
  const isAtLevel =
    userLevel !== null && tutorial.maturity_level === userLevel;
  const isNextLevel =
    userLevel !== null && tutorial.maturity_level === userLevel + 1;

  switch (tutorial.level_relation) {
    case "level-practice":
      // Practice tutorials are strong for mastery, weak for level-up
      return [
        isAtLevel ? W.RELATION_MASTERY : W.RELATION_MASTERY * 0.5,
        isAtLevel ? W.RELATION_LEVELUP * 0.2 : 0,
      ];
    case "level-up":
      // Level-up tutorials help mastery somewhat but are strongest for progression
      return [
        isAtLevel ? W.RELATION_MASTERY * 0.5 : W.RELATION_MASTERY * 0.25,
        isAtLevel || isNextLevel ? W.RELATION_LEVELUP : W.RELATION_LEVELUP * 0.3,
      ];
    case "cross-level":
      // Cross-level tutorials provide moderate benefit to both
      return [W.RELATION_MASTERY * 0.4, W.RELATION_LEVELUP * 0.4];
    default:
      return [0, 0];
  }
}

/**
 * Score action items. More action items = more hands-on = more impact.
 * Caps at 5 action items for full score.
 */
function scoreActionItems(tutorial: Tutorial): number {
  const count = tutorial.action_items.length;
  if (count === 0) return 0;
  return W.ACTION_ITEMS * Math.min(1, count / 3);
}

/**
 * Score source credibility. More sources = better synthesis.
 * Caps at 4 sources for full score.
 */
function scoreSources(tutorial: Tutorial): number {
  const count = tutorial.source_count;
  if (count <= 1) return W.SOURCES * 0.3;
  return W.SOURCES * Math.min(1, count / 4);
}

/**
 * Score difficulty alignment with user's current level.
 * Matching difficulty = highest mastery. Stretch difficulty = higher level-up.
 * Returns [masteryPoints, levelUpPoints].
 */
function scoreDifficulty(
  tutorial: Tutorial,
  userLevel: MaturityLevel | null
): [number, number] {
  if (userLevel === null) {
    // No quiz taken — give moderate baseline
    return [W.DIFFICULTY_MATCH * 0.5, W.DIFFICULTY_MATCH * 0.5];
  }

  const expectedDifficulty: Record<number, string> = {
    0: "beginner",
    1: "beginner",
    2: "intermediate",
    3: "advanced",
    4: "advanced",
  };

  const match = tutorial.difficulty === expectedDifficulty[userLevel];
  const isStretch =
    (userLevel <= 1 && tutorial.difficulty === "intermediate") ||
    (userLevel === 2 && tutorial.difficulty === "advanced");

  if (match) return [W.DIFFICULTY_MATCH, W.DIFFICULTY_MATCH * 0.3];
  if (isStretch) return [W.DIFFICULTY_MATCH * 0.3, W.DIFFICULTY_MATCH];
  // Below user level or too far above
  return [W.DIFFICULTY_MATCH * 0.2, W.DIFFICULTY_MATCH * 0.1];
}

/**
 * Score tools relevance — do the tools mentioned match the user's
 * current level toolkit or next level toolkit?
 * Returns [masteryPoints, levelUpPoints].
 */
function scoreToolsRelevance(
  tutorial: Tutorial,
  userLevel: MaturityLevel | null
): [number, number] {
  if (userLevel === null) return [W.TOOLS_RELEVANCE * 0.5, W.TOOLS_RELEVANCE * 0.5];
  if (tutorial.tools_mentioned.length === 0) return [0, 0];

  const currentTools = new Set(
    LEVELS[userLevel]?.tools.map((t) => t.toLowerCase()) ?? []
  );
  const nextLevel = Math.min(4, userLevel + 1) as MaturityLevel;
  const nextTools = new Set(
    LEVELS[nextLevel]?.tools.map((t) => t.toLowerCase()) ?? []
  );

  const mentioned = tutorial.tools_mentioned.map((t) => t.toLowerCase());
  let currentMatches = 0;
  let nextMatches = 0;

  for (const tool of mentioned) {
    if (currentTools.has(tool)) currentMatches++;
    if (nextTools.has(tool)) nextMatches++;
  }

  const total = mentioned.length;
  const masteryRatio = total > 0 ? currentMatches / total : 0;
  const levelUpRatio = total > 0 ? nextMatches / total : 0;

  return [
    W.TOOLS_RELEVANCE * masteryRatio,
    W.TOOLS_RELEVANCE * levelUpRatio,
  ];
}

// ─── Engagement Scoring ─────────────────────────────────────────────────────

function scoreEngagement(ctx: UserContext): number {
  let score = 0;
  if (ctx.hasRead) score += W.READ;
  if (ctx.completed) score += W.COMPLETED;
  if (ctx.rating > 0) score += (ctx.rating / 5) * W.RATING;
  if (ctx.bookmarked) score += W.BOOKMARKED;
  if (ctx.hasNotes) score += W.NOTES;
  return score;
}

// ─── Main Algorithm ─────────────────────────────────────────────────────────

/**
 * Calculate the impact score for a tutorial given the user's context.
 */
export function calculateImpactScore(
  tutorial: Tutorial,
  ctx: UserContext
): ImpactScore {
  const userLevel = ctx.userLevel;

  // Content quality sub-scores
  const [relationMastery, relationLevelUp] = scoreRelation(tutorial, userLevel);
  const actionItems = scoreActionItems(tutorial);
  const sources = scoreSources(tutorial);
  const [diffMastery, diffLevelUp] = scoreDifficulty(tutorial, userLevel);
  const [toolsMastery, toolsLevelUp] = scoreToolsRelevance(tutorial, userLevel);

  // Raw content quality for mastery vs. level-up
  let rawMastery = relationMastery + actionItems * 0.6 + sources * 0.5 + diffMastery + toolsMastery;
  let rawLevelUp = relationLevelUp + actionItems * 0.4 + sources * 0.5 + diffLevelUp + toolsLevelUp;

  // Apply stale penalty to content quality
  if (tutorial.is_stale) {
    rawMastery *= W.STALE_PENALTY;
    rawLevelUp *= W.STALE_PENALTY;
  }

  // Engagement (same for both dimensions — engagement validates learning)
  const engagement = scoreEngagement(ctx);

  // Combine: content quality (50%) + engagement (50%)
  // Normalize each dimension to 0-50 range, then combine
  const masteryContent = Math.min(50, rawMastery * (50 / 35));
  const levelUpContent = Math.min(50, rawLevelUp * (50 / 35));
  const engagementNorm = Math.min(50, engagement);

  const mastery = Math.round(Math.min(100, masteryContent + engagementNorm));
  const levelUp = Math.round(Math.min(100, levelUpContent + engagementNorm));
  const total = Math.round(Math.min(100, (mastery + levelUp) / 2));

  return {
    total,
    mastery,
    levelUp,
    label: getLabel(total),
  };
}

function getLabel(score: number): ImpactScore["label"] {
  if (score >= 75) return "exceptional";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Color for each label, matching Battlecat theming */
export const IMPACT_COLORS: Record<ImpactScore["label"], string> = {
  low: "#6B7280",       // gray
  moderate: "#3B82F6",  // blue
  high: "#14B8A6",      // teal (bc-primary)
  exceptional: "#F59E0B", // amber/gold (bc-secondary)
};

/** Sort tutorials by impact score descending */
export function sortByImpact(
  tutorials: Tutorial[],
  scoreFn: (t: Tutorial) => ImpactScore
): Tutorial[] {
  return [...tutorials].sort((a, b) => scoreFn(b).total - scoreFn(a).total);
}
